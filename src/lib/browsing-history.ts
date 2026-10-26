export interface ProductViewRecord {
  productId: string
  categoryId?: string
  brand?: string | null
  timestamp: number
}

const STORAGE_KEY = 'shopzilla_browsing_history'
const MAX_HISTORY = 30

function isClient(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

/**
 * Record a product view in client-side localStorage.
 * Deduplicates and moves the recently viewed item to the top of the history.
 */
export function recordProductView(
  productId: string,
  categoryId?: string,
  brand?: string | null
): void {
  if (!isClient() || !productId) return

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    let history: ProductViewRecord[] = raw ? JSON.parse(raw) : []
    if (!Array.isArray(history)) history = []

    // Remove existing entry for same product to avoid duplicates
    history = history.filter((item) => item.productId !== productId)

    // Add to front of history with current timestamp
    history.unshift({
      productId,
      categoryId: categoryId || undefined,
      brand: brand || undefined,
      timestamp: Date.now(),
    })

    // Keep history bounded to MAX_HISTORY entries
    if (history.length > MAX_HISTORY) {
      history = history.slice(0, MAX_HISTORY)
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch (err) {
    // Graceful silent fallback if localStorage is disabled or full
    console.debug('Failed to write browsing history to localStorage', err)
  }
}

/**
 * Retrieve the full client browsing history.
 */
export function getBrowsingHistory(): ProductViewRecord[] {
  if (!isClient()) return []

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Extract distinct category IDs from browsing history, ordered by view frequency and recency.
 */
export function getInterestCategoryIds(): string[] {
  const history = getBrowsingHistory()
  if (history.length === 0) return []

  const scoreMap = new Map<string, number>()

  history.forEach((item, index) => {
    if (!item.categoryId) return
    // Items near the front of the list are more recent and get higher weights
    const recencyWeight = Math.max(1, 10 - index)
    const current = scoreMap.get(item.categoryId) || 0
    scoreMap.set(item.categoryId, current + recencyWeight)
  })

  return Array.from(scoreMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([catId]) => catId)
}

/**
 * Extract distinct brand names from browsing history.
 */
export function getInterestBrands(): string[] {
  const history = getBrowsingHistory()
  if (history.length === 0) return []

  const brandSet = new Set<string>()
  for (const item of history) {
    if (item.brand && item.brand.trim() && item.brand.toLowerCase() !== 'no brand') {
      brandSet.add(item.brand.trim())
    }
  }
  return Array.from(brandSet)
}

/**
 * Clear the browsing history.
 */
export function clearBrowsingHistory(): void {
  if (!isClient()) return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}
