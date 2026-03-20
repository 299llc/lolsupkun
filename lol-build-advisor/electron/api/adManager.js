/**
 * 広告マネージャー
 * リモートJSONから広告データを取得し、ローテーション表示を管理
 *
 * 広告JSON形式:
 * {
 *   "ads": [
 *     {
 *       "id": "ad1",
 *       "imageUrl": "https://example.com/banner.png",
 *       "linkUrl": "https://example.com",
 *       "alt": "広告テキスト",
 *       "weight": 1
 *     }
 *   ]
 * }
 */

// 広告配信エンドポイント（GitHub Pages や自前サーバー等に設置）
const AD_FEED_URL = 'https://299llc.github.io/ads/lol-sapo-kun.json'
const CACHE_TTL_MS = 30 * 60 * 1000 // 30分キャッシュ
const FETCH_TIMEOUT_MS = 5000

// デフォルト広告（リモート取得失敗時のフォールバック）
const DEFAULT_ADS = [
  {
    id: 'promo-pro',
    imageUrl: null, // 画像なし = テキスト広告
    linkUrl: null,
    title: 'Pro版にアップグレード',
    text: '広告非表示 + 無制限AI分析で最強のサポートを。',
    type: 'self-promo',
  },
]

class AdManager {
  constructor() {
    this.ads = []
    this.lastFetch = 0
    this.fetching = false
  }

  /**
   * 広告リストを取得（キャッシュあり）
   * @returns {Promise<Array>}
   */
  async getAds() {
    const now = Date.now()
    if (this.ads.length > 0 && now - this.lastFetch < CACHE_TTL_MS) {
      return this.ads
    }

    if (this.fetching) return this.ads.length > 0 ? this.ads : DEFAULT_ADS

    this.fetching = true
    try {
      const res = await fetch(AD_FEED_URL, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      })
      const data = await res.json()
      if (Array.isArray(data.ads) && data.ads.length > 0) {
        this.ads = data.ads
        this.lastFetch = now
      }
    } catch {
      // フェッチ失敗時はデフォルト広告を使用
      if (this.ads.length === 0) {
        this.ads = DEFAULT_ADS
      }
    } finally {
      this.fetching = false
    }

    return this.ads
  }

  /**
   * 重み付きランダムで1つ選択
   * @returns {Promise<Object|null>}
   */
  async pickAd() {
    const ads = await this.getAds()
    if (ads.length === 0) return null
    if (ads.length === 1) return ads[0]

    const totalWeight = ads.reduce((sum, ad) => sum + (ad.weight || 1), 0)
    let r = Math.random() * totalWeight
    for (const ad of ads) {
      r -= ad.weight || 1
      if (r <= 0) return ad
    }
    return ads[0]
  }
}

module.exports = { AdManager }
