'use client'

import { useStore } from '@/lib/store'
import { BRAND } from '@/lib/brand'

const CATEGORY_ICONS: Record<string, string> = {
  laptop: '💻',
  shirt: '👕',
  sofa: '🛋️',
  smartphone: '📱',
  heart: '❤️',
  dumbbell: '🏋️',
  'shopping-cart': '🛒',
  book: '📚',
}

export function Footer({ categories }: { categories: { id: string; name: string; icon: string | null }[] }) {
  const navigate = useStore((s) => s.navigate)

  return (
    <footer className="mt-auto bg-gray-900 text-gray-300">
      <div className="max-w-[1200px] mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <h4 className="text-white font-semibold mb-3">Customer Care</h4>
          <ul className="space-y-2 text-sm">
            <li className="hover:text-sky-400 cursor-pointer">Help Center</li>
            <li className="hover:text-sky-400 cursor-pointer">How to Buy</li>
            <li className="hover:text-sky-400 cursor-pointer">Returns & Refunds</li>
            <li className="hover:text-sky-400 cursor-pointer">Contact Us</li>
            <li className="hover:text-sky-400 cursor-pointer">Warranty Policy</li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Earn With {BRAND.name}</h4>
          <ul className="space-y-2 text-sm">
            <li className="hover:text-sky-400 cursor-pointer">Become a Seller</li>
            <li className="hover:text-sky-400 cursor-pointer">{BRAND.name} University</li>
            <li className="hover:text-sky-400 cursor-pointer">Affiliate Program</li>
            <li className="hover:text-sky-400 cursor-pointer">Service Center</li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Categories</h4>
          <ul className="space-y-2 text-sm max-h-40 overflow-y-auto">
            {categories.slice(0, 8).map((c) => (
              <li
                key={c.id}
                onClick={() => navigate({ name: 'category', categoryId: c.id, categoryName: c.name })}
                className="hover:text-sky-400 cursor-pointer flex items-center gap-1.5"
              >
                <span>{c.icon ? CATEGORY_ICONS[c.icon] || '🛍️' : '🛍️'}</span>
                {c.name}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Payment Methods</h4>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-pink-600 text-white px-2 py-1 rounded">bKash</span>
            <span className="bg-sky-600 text-white px-2 py-1 rounded">Nagad</span>
            <span className="bg-green-600 text-white px-2 py-1 rounded">Rocket</span>
            <span className="bg-blue-700 text-white px-2 py-1 rounded">VISA</span>
            <span className="bg-yellow-500 text-white px-2 py-1 rounded">COD</span>
          </div>
          <h4 className="text-white font-semibold mb-3 mt-6">Follow Us</h4>
          <div className="flex gap-3 text-xl">
            <span className="hover:text-sky-400 cursor-pointer">📘</span>
            <span className="hover:text-sky-400 cursor-pointer">📷</span>
            <span className="hover:text-sky-400 cursor-pointer">🐦</span>
            <span className="hover:text-sky-400 cursor-pointer">▶️</span>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-4 text-xs text-gray-500 text-center">
          © {new Date().getFullYear()} {BRAND.copyrightName}{BRAND.footerNote ? ` — ${BRAND.footerNote}` : ''}
        </div>
      </div>
    </footer>
  )
}
