/**
 * AWS Bedrock プロバイダー
 * AWS Bedrock 経由で Claude を呼び出す (マネージドキーモデル用)
 *
 * 必要な環境変数 or コンストラクタ引数:
 *   - region: AWS リージョン (例: 'us-east-1')
 *   - accessKeyId: AWS Access Key ID
 *   - secretAccessKey: AWS Secret Access Key
 *
 * Bedrock の Claude モデル ID:
 *   - anthropic.claude-haiku-4-5-20251001-v1:0
 *   - anthropic.claude-sonnet-4-6-20250514-v1:0
 *
 * Note: cache_control (prompt caching) は Bedrock でもサポートされている
 */

// Bedrock は Anthropic Messages API 互換のリクエスト形式をサポート
// https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages.html

const crypto = require('crypto')

// Anthropic モデル名 → Bedrock モデル ID のマッピング
const MODEL_MAP = {
  'claude-haiku-4-5-20251001': 'anthropic.claude-haiku-4-5-20251001-v1:0',
  'claude-sonnet-4-6': 'anthropic.claude-sonnet-4-6-20250514-v1:0',
}

class BedrockProvider {
  constructor({ region, accessKeyId, secretAccessKey }) {
    this.region = region || 'us-east-1'
    this.accessKeyId = accessKeyId
    this.secretAccessKey = secretAccessKey
    this.type = 'bedrock'
  }

  async sendMessage({ model, maxTokens, temperature = 0, system, messages, signal }) {
    const bedrockModel = MODEL_MAP[model] || model
    const endpoint = `https://bedrock-runtime.${this.region}.amazonaws.com`
    const path = `/model/${encodeURIComponent(bedrockModel)}/invoke`

    const body = JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: maxTokens,
      temperature,
      system: Array.isArray(system) ? system : [{ type: 'text', text: system }],
      messages
    })

    const headers = await this._signRequest('POST', path, body, endpoint)

    const res = await fetch(`${endpoint}${path}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body,
      signal
    })

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      throw new Error(`Bedrock HTTP ${res.status}: ${errBody.substring(0, 200)}`)
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
      const bedrockModel = MODEL_MAP['claude-haiku-4-5-20251001']
      const endpoint = `https://bedrock-runtime.${this.region}.amazonaws.com`
      const path = `/model/${encodeURIComponent(bedrockModel)}/invoke`
      const body = JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'hi' }]
      })

      const headers = await this._signRequest('POST', path, body, endpoint)
      const res = await fetch(`${endpoint}${path}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body
      })
      return res.ok
    } catch {
      return false
    }
  }

  // AWS Signature V4 署名
  async _signRequest(method, path, body, endpoint) {
    const host = new URL(endpoint).host
    const now = new Date()
    const dateStamp = now.toISOString().replace(/[-:]/g, '').substring(0, 8)
    const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
    const service = 'bedrock'
    const credentialScope = `${dateStamp}/${this.region}/${service}/aws4_request`

    const canonicalHeaders = `host:${host}\nx-amz-date:${amzDate}\n`
    const signedHeaders = 'host;x-amz-date'
    const payloadHash = crypto.createHash('sha256').update(body || '').digest('hex')

    const canonicalRequest = [
      method, path, '', canonicalHeaders, signedHeaders, payloadHash
    ].join('\n')

    const stringToSign = [
      'AWS4-HMAC-SHA256', amzDate, credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex')
    ].join('\n')

    const signingKey = this._getSignatureKey(dateStamp, this.region, service)
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex')

    return {
      'Host': host,
      'X-Amz-Date': amzDate,
      'Authorization': `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
    }
  }

  _getSignatureKey(dateStamp, region, service) {
    let key = Buffer.from('AWS4' + this.secretAccessKey, 'utf-8')
    for (const part of [dateStamp, region, service, 'aws4_request']) {
      key = crypto.createHmac('sha256', key).update(part).digest()
    }
    return key
  }
}

module.exports = { BedrockProvider }
