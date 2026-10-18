/**
 * Centralized brand configuration
 * -------------------------------
 * Change ANY of these values to rebrand the entire app.
 * No need to hunt through components — every page, modal, footer,
 * metadata title, OTP SMS, and cookie name reads from this file.
 */

export const BRAND = {
  /** Public-facing brand name shown in the header logo, footer, auth modal, page title, etc. */
  name: 'ShopZilla',

  /** Short tagline used in the auth modal description and meta description. */
  tagline: 'Online Shopping in Bangladesh',

  /** Hero section main title shown on the home page slider's first slide.
   *  Override per-slide below if you want different hero text per slide. */
  heroTitle: 'Mega Bonanza Sale',

  /** Footer copyright name (defaults to brand name) */
  copyrightName: 'ShopZilla',

  /** Footer note — set to empty string to hide entirely */
  footerNote: 'Built for demonstration purposes. Not affiliated with any real e-commerce site.',

  /** Top promo bar text (above the search bar in the header) */
  promoBarText: 'Save more with our App — Download now! 📱',

  /** Contact phone shown in the top promo bar (right side) */
  contactPhone: '+880 9678 123 456',

  /** Email domain used for demo accounts when seeding.
   *  Change this if you want demo accounts like admin@yourbrand.local */
  demoEmailDomain: 'shopzilla.local',

  /** Cookie name used for the JWT session cookie.
   *  Change this when deploying a new brand to avoid cookie collisions. */
  cookieName: 'shopzilla_session',

  /** JWT secret fallback — only used if JWT_SECRET env var is missing.
   *  In production ALWAYS set JWT_SECRET in .env. */
  jwtSecretFallback: 'shopzilla-dev-secret-change-in-production-2024-a8f3c2e9',

  /** SMS sender defaults used when env vars are not set */
  sms: {
    vonageFrom: 'ShopZilla',
    sslCompuzFrom: 'ShopZilla',
    reveSenderId: 'ShopZilla',
    metechSenderId: 'ShopZilla',
  },
} as const

/**
 * Home page hero slider slides.
 * Each slide has a title, subtitle, button label, optional search query
 * (used when the button is clicked), and a tailwind gradient class for the background.
 *
 * Replace `image` with a real URL to use an image as the slide background instead of a gradient.
 */
export interface HeroSlide {
  id: string
  title: string
  subtitle: string
  ctaLabel: string
  ctaSearchQuery?: string
  gradient: string  // tailwind gradient classes, e.g., 'from-sky-500 to-cyan-500'
  image?: string    // optional image URL; if present, used as background image
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    title: 'Up to 70% OFF',
    subtitle: 'Discover amazing deals across all categories — Electronics, Fashion, Home & more!',
    ctaLabel: 'Shop Now',
    ctaSearchQuery: 'sale',
    gradient: 'from-sky-500 to-cyan-500',
  },
  {
    id: 'slide-2',
    title: 'New Smartphones Arrived',
    subtitle: 'Xiaomi, Samsung, Realme — official warranty, sealed box, best prices in town.',
    ctaLabel: 'Browse Smartphones',
    ctaSearchQuery: 'smartphone',
    gradient: 'from-indigo-500 to-purple-500',
  },
  {
    id: 'slide-3',
    title: 'Fashion Week Sale',
    subtitle: "Men's, Women's & Kids fashion at unbeatable prices. Free shipping over ৳1000.",
    ctaLabel: 'Shop Fashion',
    ctaSearchQuery: 'fashion',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    id: 'slide-4',
    title: 'Free Shipping Nationwide',
    subtitle: 'On all orders above ৳1000. COD available in all 64 districts of Bangladesh.',
    ctaLabel: 'Start Shopping',
    ctaSearchQuery: 'home',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'slide-5',
    title: 'New User? Get ৳200 Coupon',
    subtitle: 'First-time customers get an instant ৳200 discount coupon. Sign up today!',
    ctaLabel: 'Create Account',
    gradient: 'from-sky-500 to-cyan-500',
  },
]
