export function formatBDT(amount: number): string {
  const n = Math.round(amount)
  return '৳ ' + n.toLocaleString('en-US')
}

export function discountPercent(price: number, comparePrice?: number | null): number | null {
  if (!comparePrice || comparePrice <= price) return null
  return Math.round(((comparePrice - price) / comparePrice) * 100)
}

export function classNames(...cls: (string | false | undefined | null)[]): string {
  return cls.filter(Boolean).join(' ')
}
