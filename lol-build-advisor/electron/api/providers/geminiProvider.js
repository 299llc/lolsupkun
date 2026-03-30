/**
 * Google Gemini API プロバイダー (Lambda Proxy 経由)
 * 明示的キャッシュ (CachedContent API) でシステムプロンプトの再処理コストを削減
 */

const DEFAULT_MODEL = 'gemini-2.5-flash'
const CACHE_TTL = '3600s'        // 1時間（試合時間 + バッファ）
const MIN_CACHE_CHARS = 4000     // キャッシュ対象の最小文字数（Gemini最低4096トークン、日本語は1文字≈0.5tokなので余裕を持つ）

class GeminiProvider {
  /**
   * @param {string} proxyUrl - Lambda Function URL
   * @param {string} [appSecret] - アプリ固有シークレット（X-App-Secret ヘッダー）
   */
  constructor(proxyUrl, appSecret) {
    this.proxyUrl = proxyUrl.replace(/\/$/, '')
    this.appSecret = appSecret || ''
    this.type = 'gemini'
    this._cacheMap = new Map()      // systemHash → { name, expiresAt }
    this._cacheInFlight = new Map() // systemHash → Promise<name|null>
  }

  /**
   * Lambda Proxy へリクエスト
   */
  async _proxyRequest(action, body, { signal, model, cacheName } = {}) {
    const payload = { action, body }
    if (model) payload.model = model
    if (cacheName) payload.cacheName = cacheName

    const res = await fetch(this.proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Secret': this.appSecret,
      },
      body: JSON.stringify(payload),
      signal,
    })

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      throw new Error(`HTTP ${res.status}: ${errBody.substring(0, 200)}`)
    }

    return res
  }

  /**
   * システムテキストの簡易ハッシュ（キャッシュキー用）
   */
  _hashSystem(text) {
    let h = 0x811c9dc5
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i)
      h = Math.imul(h, 0x01000193)
    }
    return (h >>> 0).toString(36)
  }

  /**
   * 明示的キャッシュの取得 or 作成
   * @returns {Promise<string|null>} キャッシュリソース名 or null（フォールバック用）
   */
  async _getOrCreateCache(model, systemText) {
    if (systemText.length < MIN_CACHE_CHARS) return null

    const hash = this._hashSystem(systemText)

    // 既存キャッシュチェック
    const existing = this._cacheMap.get(hash)
    if (existing && existing.expiresAt > Date.now()) {
      return existing.name
    }

    // 作成中の重複防止
    if (this._cacheInFlight.has(hash)) {
      return this._cacheInFlight.get(hash)
    }

    const promise = this._createCache(model, systemText, hash)
    this._cacheInFlight.set(hash, promise)
    try {
      return await promise
    } finally {
      this._cacheInFlight.delete(hash)
    }
  }

  async _createCache(model, systemText, hash) {
    try {
      const res = await this._proxyRequest('cachedContents', {
        model: `models/${model}`,
        systemInstruction: { parts: [{ text: systemText }] },
        ttl: CACHE_TTL,
      })

      const data = await res.json()
      const name = data.name
      const expiresAt = Date.now() + 3500 * 1000 // TTL - 100s のマージン
      this._cacheMap.set(hash, { name, expiresAt })
      console.log(`[Gemini] Created cache: ${name} (hash=${hash}, tokens≈${Math.round(systemText.length / 2)})`)
      return name
    } catch (err) {
      console.warn(`[Gemini] Cache creation error: ${err.message}`)
      return null
    }
  }

  /**
   * 全キャッシュ削除（試合終了時に呼ぶ）
   */
  async clearCaches() {
    const entries = [...this._cacheMap.values()]
    this._cacheMap.clear()
    await Promise.allSettled(entries.map(cache =>
      this._proxyRequest('cachedContents:delete', {}, { cacheName: cache.name })
        .then(() => console.log(`[Gemini] Deleted cache: ${cache.name}`))
        .catch(err => console.warn(`[Gemini] Cache delete failed: ${err.message}`))
    ))
  }

  async sendMessage({ model, maxTokens, temperature = 0, system, messages, signal, jsonMode }) {
    const geminiModel = model || DEFAULT_MODEL

    // system → systemInstruction テキスト化
    let systemText = ''
    if (Array.isArray(system)) {
      systemText = system.map(s => typeof s === 'string' ? s : s.text || '').join('\n')
    } else if (typeof system === 'string') {
      systemText = system
    }

    // messages 変換: role user→user, assistant→model
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }]
    }))

    const generationConfig = {
      maxOutputTokens: maxTokens,
      temperature,
      // 2.5-flash の思考トークンを無効化してコスト・速度を最適化
      thinkingConfig: { thinkingBudget: 0 },
    }
    if (jsonMode !== false) {
      generationConfig.responseMimeType = 'application/json'
    }

    // 明示的キャッシュ: システムプロンプトをキャッシュして再利用
    const body = {}
    let cacheName = null
    if (systemText) {
      cacheName = await this._getOrCreateCache(geminiModel, systemText)
      if (cacheName) {
        body.cachedContent = cacheName
      } else {
        body.systemInstruction = { parts: [{ text: systemText }] }
      }
    }
    body.generationConfig = generationConfig
    body.contents = contents

    try {
      const res = await this._proxyRequest('generateContent', body, { signal, model: geminiModel })
      return this._parseResponse(await res.json())
    } catch (err) {
      // キャッシュ参照エラー → キャッシュ破棄してリトライ
      if (cacheName && /HTTP (400|404)/.test(err.message)) {
        console.warn(`[Gemini] Cached content error, retrying without cache`)
        this._invalidateCache(cacheName)
        const fallbackBody = { generationConfig, contents }
        if (systemText) {
          fallbackBody.systemInstruction = { parts: [{ text: systemText }] }
        }
        const res = await this._proxyRequest('generateContent', fallbackBody, { signal, model: geminiModel })
        return this._parseResponse(await res.json())
      }
      throw err
    }
  }

  async sendInteraction({ model, maxTokens, temperature = 0, system, messages, previousInteractionId = null, signal, store = true, jsonSchema = null }) {
    const geminiModel = model || DEFAULT_MODEL

    let systemText = ''
    if (Array.isArray(system)) {
      systemText = system.map(s => typeof s === 'string' ? s : s.text || '').join('\n')
    } else if (typeof system === 'string') {
      systemText = system
    }

    const lastMessage = messages[messages.length - 1]
    const input = typeof lastMessage?.content === 'string'
      ? lastMessage.content
      : JSON.stringify(lastMessage?.content ?? '')

    const generationConfig = {
      max_output_tokens: maxTokens,
      temperature,
    }

    const interactionBody = {
      model: `models/${geminiModel}`,
      input,
      store,
      generation_config: generationConfig,
    }
    if (jsonSchema) {
      interactionBody.response_mime_type = 'application/json'
      interactionBody.response_format = jsonSchema
    }
    if (previousInteractionId) interactionBody.previous_interaction_id = previousInteractionId
    if (systemText) interactionBody.system_instruction = systemText

    const res = await this._proxyRequest('interactions', interactionBody, { signal })
    return this._parseInteractionResponse(await res.json())
  }

  _parseResponse(data) {
    const candidate = data.candidates?.[0]
    const text = candidate?.content?.parts?.[0]?.text || ''
    const usage = data.usageMetadata ? {
      input: data.usageMetadata.promptTokenCount || 0,
      output: data.usageMetadata.candidatesTokenCount || 0,
      cache_read: data.usageMetadata.cachedContentTokenCount || 0,
      cache_creation: 0
    } : null
    const stopReason = candidate?.finishReason || null

    return { text, usage, stopReason }
  }

  _parseInteractionResponse(data) {
    const outputs = Array.isArray(data.outputs) ? data.outputs : []
    let text = ''
    for (const output of outputs) {
      if (typeof output?.text === 'string' && output.text) {
        text = output.text
        break
      }
    }

    const usage = data.usage ? {
      input: data.usage.total_input_tokens || 0,
      output: data.usage.total_output_tokens || 0,
      cache_read: data.usage.total_cached_tokens || 0,
      cache_creation: 0
    } : null

    return {
      text,
      usage,
      stopReason: data.stopReason || null,
      interactionId: data.id || null,
    }
  }

  _invalidateCache(cacheName) {
    for (const [hash, entry] of this._cacheMap) {
      if (entry.name === cacheName) {
        this._cacheMap.delete(hash)
        break
      }
    }
  }

  async validate() {
    try {
      const res = await this._proxyRequest('generateContent', {
        contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
        generationConfig: { maxOutputTokens: 10 }
      }, { model: DEFAULT_MODEL })
      return res.ok
    } catch {
      return false
    }
  }
}

module.exports = { GeminiProvider }
