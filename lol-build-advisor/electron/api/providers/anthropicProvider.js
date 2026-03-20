/**
 * Anthropic 直接 API プロバイダー (BYOK)
 * ユーザーが自分の API キーを使って Anthropic API を直接呼び出す
 */

const API_URL = 'https://api.anthropic.com/v1/messages'
const API_VERSION = '2023-06-01'

class AnthropicProvider {
  constructor(apiKey) {
    this.apiKey = apiKey
    this.type = 'anthropic'
  }

  async sendMessage({ model, maxTokens, temperature = 0, system, messages, signal }) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': API_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        cache_control: { type: 'ephemeral' },
        system: Array.isArray(system) ? system : [{ type: 'text', text: system }],
        messages
      }),
      signal
    })

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      throw new Error(`HTTP ${res.status}: ${errBody.substring(0, 200)}`)
    }

    const data = await res.json()
    return {
      text: data.content?.[0]?.text || '',
      usage: data.usage ? {
        input: data.usage.input_tokens,
        output: data.usage.output_tokens,
        cache_read: data.usage.cache_read_input_tokens || 0,
        cache_creation: data.usage.cache_creation_input_tokens || 0
      } : null,
      stopReason: data.stop_reason
    }
  }

  async validate() {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': API_VERSION,
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'hi' }]
        })
      })
      return res.ok
    } catch {
      return false
    }
  }
}

module.exports = { AnthropicProvider }
