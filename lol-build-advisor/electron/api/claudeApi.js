/**
 * Claude API Client - 4種のAI分析
 *
 * OP.GG のコアビルドと入れ替え候補アイテム一覧を提示し、
 * この試合でおすすめのアイテムを候補の中から選ばせる。
 *
 * プロバイダー抽象化: AnthropicProvider (BYOK) / BedrockProvider (AWS) を切り替え可能
 */
const { ITEM_PROMPT, MATCHUP_PROMPT, MACRO_PROMPT, COACHING_PROMPT } = require('../core/prompts')
const { AnthropicProvider } = require('./providers/anthropicProvider')

const MODEL_HAIKU = 'claude-haiku-4-5-20251001'
const MODEL_SONNET = 'claude-sonnet-4-6'

class ClaudeApiClient {
  /**
   * @param {string|object} providerOrApiKey - API キー文字列 (後方互換) またはプロバイダーインスタンス
   */
  constructor(providerOrApiKey) {
    if (typeof providerOrApiKey === 'string') {
      // 後方互換: API キー文字列が渡された場合は AnthropicProvider を自動生成
      this.provider = new AnthropicProvider(providerOrApiKey)
    } else {
      this.provider = providerOrApiKey
    }
    this.coreBuild = null
    this.substituteItems = []
    this.matchContext = null
    this.lastSuggestion = null
    this.logs = []
    this.recommendationHistory = {}
    this.totalCalls = 0
  }

  setCoreBuild(coreBuild) { this.coreBuild = coreBuild }
  setSubstituteItems(items) { this.substituteItems = items || [] }
  setMatchContext(staticContext) { this.matchContext = staticContext }
  getSubstituteItems() { return this.substituteItems }
  getLogs() { return this.logs }
  clearLogs() { this.logs = [] }
  getProviderType() { return this.provider?.type || 'unknown' }

  clearMatch() {
    this.matchContext = null
    this.lastSuggestion = null
    this.coreBuild = null
    this.substituteItems = []
    this.recommendationHistory = {}
    this.totalCalls = 0
  }

  // 共通API呼び出し (プロバイダー経由)
  async _callApi({ model, maxTokens, temperature = 0, system, messages, timeoutMs, logType }) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    const startTime = Date.now()
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: logType,
      provider: this.getProviderType(),
      system: typeof system === 'string' ? system : system?.[0]?.text || '',
      userMessage: messages[messages.length - 1]?.content || '',
      response: null,
      error: null,
      durationMs: 0
    }

    try {
      const result = await this.provider.sendMessage({
        model, maxTokens, temperature, system, messages,
        signal: controller.signal
      })

      clearTimeout(timeout)
      logEntry.durationMs = Date.now() - startTime

      const text = result.text
      logEntry.response = text

      if (result.usage) {
        logEntry.tokens = result.usage
        console.log(`[Claude:${logType}:${this.getProviderType()}] tokens: in=${result.usage.input} out=${result.usage.output} cache_read=${result.usage.cache_read} cache_create=${result.usage.cache_creation}`)
      }

      if (result.stopReason === 'max_tokens') {
        console.warn(`[Claude:${logType}] Output truncated (max_tokens reached)`)
      }

      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.error(`[Claude:${logType}] No JSON found in response: ${text.substring(0, 200)}`)
        this._pushLog(logEntry)
        return null
      }

      try {
        const parsed = JSON.parse(jsonMatch[0])
        this._pushLog(logEntry)
        return parsed
      } catch (parseErr) {
        console.error(`[Claude:${logType}] JSON parse failed: ${jsonMatch[0].substring(0, 200)}`)
        logEntry.error = `JSON parse: ${parseErr.message}`
        this._pushLog(logEntry)
        return null
      }
    } catch (err) {
      clearTimeout(timeout)
      logEntry.durationMs = Date.now() - startTime
      logEntry.error = err.message || String(err)
      console.error(`[Claude:${logType}:${this.getProviderType()}] Error: ${logEntry.error}`)
      this._pushLog(logEntry)
      return null
    }
  }

  _buildUserMessage(dynamicContext) {
    const lines = []

    if (this.coreBuild) {
      lines.push(`【コアビルド(統計)】`)
      this.coreBuild.ids.forEach((id, i) => {
        const name = this.coreBuild.names[i] || id
        const raw = this.coreBuild.descs?.[i] || ''
        const desc = raw ? ` (${raw.substring(0, 80)})` : ''
        lines.push(`${id}:${name}${desc}`)
      })
    }

    if (this.substituteItems.length) {
      lines.push(`【入れ替え候補アイテム】`)
      for (const it of this.substituteItems) {
        const raw = it.desc || ''
        const desc = raw ? ` (${raw.substring(0, 80)})` : ''
        lines.push(`${it.id}:${it.jaName}${desc}`)
      }
    }

    lines.push('')
    lines.push(dynamicContext)
    return lines.join('\n')
  }

  async validate() {
    return this.provider.validate()
  }

  async getSuggestion(dynamicContext) {
    const userMessage = this._buildUserMessage(dynamicContext)

    const messages = []
    if (this.matchContext) {
      messages.push(
        { role: 'user', content: [{ type: 'text', text: this.matchContext, cache_control: { type: 'ephemeral' } }] },
        { role: 'assistant', content: '了解' },
        { role: 'user', content: userMessage }
      )
    } else {
      messages.push({ role: 'user', content: userMessage })
    }

    const aiResult = await this._callApi({
      model: MODEL_HAIKU,
      maxTokens: 600,
      system: [{ type: 'text', text: ITEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages,
      timeoutMs: 30000,
      logType: 'suggestion'
    })

    if (!aiResult) return this.lastSuggestion

    // 推薦蓄積
    const recommended = aiResult.recommended || []
    this.totalCalls++
    for (const r of recommended) {
      const key = String(r.id)
      if (!this.recommendationHistory[key]) {
        this.recommendationHistory[key] = { count: 0, lastReason: '' }
      }
      this.recommendationHistory[key].count++
      this.recommendationHistory[key].lastReason = r.reason || ''
    }

    const suggestion = {
      recommended,
      reasoning: aiResult.reasoning || '',
      history: { ...this.recommendationHistory },
      totalCalls: this.totalCalls
    }
    this.lastSuggestion = suggestion
    return suggestion
  }

  async getMatchupTip(matchupContext) {
    return this._callApi({
      model: MODEL_HAIKU,
      maxTokens: 700,
      system: MATCHUP_PROMPT,
      messages: [{ role: 'user', content: matchupContext }],
      timeoutMs: 20000,
      logType: 'matchup'
    })
  }

  async getMacroAdvice(staticContext, dynamicContext) {
    const messages = []
    if (staticContext) {
      messages.push(
        { role: 'user', content: [{ type: 'text', text: staticContext, cache_control: { type: 'ephemeral' } }] },
        { role: 'assistant', content: '了解。リアルタイムの試合状況を送ってください。' },
        { role: 'user', content: dynamicContext }
      )
    } else {
      messages.push({ role: 'user', content: dynamicContext })
    }

    return this._callApi({
      model: MODEL_HAIKU,
      maxTokens: 500,
      system: [{ type: 'text', text: MACRO_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages,
      timeoutMs: 20000,
      logType: 'macro'
    })
  }

  async getCoaching(gameContext) {
    return this._callApi({
      model: MODEL_HAIKU,
      maxTokens: 4000,
      system: COACHING_PROMPT,
      messages: [{ role: 'user', content: gameContext }],
      timeoutMs: 60000,
      logType: 'coaching'
    })
  }

  _pushLog(entry) {
    this.logs.push(entry)
    if (this.logs.length > 20) this.logs.shift()
  }
}

module.exports = { ClaudeApiClient }
