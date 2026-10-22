import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { BRAND } from '@/lib/brand'

export async function POST(req: NextRequest) {
  // Protect the seed endpoint with a secret key.
  // Set SEED_SECRET in your environment (any random string).
  // Call with:  POST /api/seed  and header  x-seed-secret: <your-secret>
  // If SEED_SECRET is not set, the endpoint is open (dev convenience).
  const secret = process.env.SEED_SECRET
  if (secret) {
    const provided = req.headers.get('x-seed-secret') || ''
    if (provided !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    // Cleanup existing data
    await db.review.deleteMany()
    await db.wishlist.deleteMany()
    await db.orderItem.deleteMany()
    await db.order.deleteMany()
    await db.cartItem.deleteMany()
    await db.product.deleteMany()
    await db.category.deleteMany()
    await db.user.deleteMany()

    // Create demo users
    const adminPass = await hashPassword('admin123')
    const retailerPass = await hashPassword('retailer123')
    const customerPass = await hashPassword('customer123')

    const admin = await db.user.create({
      data: {
        phone: '8801700000001',
        email: `admin@${BRAND.demoEmailDomain}`,
        password: adminPass,
        name: 'Site Admin',
        role: 'ADMIN',
        phoneVerified: true,
        address: 'Dhaka, Bangladesh',
      },
    })

    const retailer1 = await db.user.create({
      data: {
        phone: '8801700000002',
        email: `retailer@${BRAND.demoEmailDomain}`,
        password: retailerPass,
        name: 'Tech Bazar',
        role: 'RETAILER',
        phoneVerified: true,
        storeName: 'Tech Bazar',
        address: 'Gulshan, Dhaka',
      },
    })

    const retailer2 = await db.user.create({
      data: {
        phone: '8801700000003',
        email: `fashion@${BRAND.demoEmailDomain}`,
        password: retailerPass,
        name: 'Fashion Hub',
        role: 'RETAILER',
        phoneVerified: true,
        storeName: 'Fashion Hub BD',
        address: 'Dhanmondi, Dhaka',
      },
    })

    const customer = await db.user.create({
      data: {
        phone: '8801700000004',
        email: `customer@${BRAND.demoEmailDomain}`,
        password: customerPass,
        name: 'Rahim Ahmed',
        role: 'CUSTOMER',
        phoneVerified: true,
        address: 'Mirpur, Dhaka',
      },
    })

    // Create categories
    const catData = [
      { name: 'Electronics', icon: 'laptop' },
      { name: 'Fashion', icon: 'shirt' },
      { name: 'Home & Living', icon: 'sofa' },
      { name: 'Smartphones', icon: 'smartphone' },
      { name: 'Beauty & Health', icon: 'heart' },
      { name: 'Sports', icon: 'dumbbell' },
      { name: 'Groceries', icon: 'shopping-cart' },
      { name: 'Books', icon: 'book' },
    ]
    const cats = await Promise.all(
      catData.map((c) =>
        db.category.create({
          data: {
            name: c.name,
            slug: c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).slice(-4),
            icon: c.icon,
          },
        })
      )
    )

    const [electronics, fashion, home, smartphones, beauty, sports, groceries, books] = cats

    // Image URL generator — using picsum.photos for placeholder product images
    const img = (seed: number) => `https://picsum.photos/seed/${BRAND.name.toLowerCase().replace(/[^a-z]/g, '')}${seed}/600/600`

    // Create products
    const products = [
      // Electronics
      { name: 'Wireless Bluetooth Headphones Pro', desc: 'Premium over-ear wireless headphones with active noise cancellation, 30-hour battery life, and crystal-clear audio. Perfect for music lovers and professionals.', price: 2499, comparePrice: 3999, stock: 50, brand: 'SoundMax', cat: electronics.id, ret: retailer1.id, flash: true, featured: true },
      { name: 'Smart Watch Series 7', desc: 'Advanced fitness tracking, heart-rate monitor, GPS, water-resistant design. Compatible with iOS and Android.', price: 3299, comparePrice: 4599, stock: 80, brand: 'TechWear', cat: electronics.id, ret: retailer1.id, flash: true, featured: true },
      { name: 'USB-C Fast Charger 65W', desc: 'Universal fast charger with multiple USB-C ports. Supports PD 3.0 and QC 4.0 fast charging protocols.', price: 699, comparePrice: 999, stock: 200, brand: 'PowerTech', cat: electronics.id, ret: retailer1.id, flash: false, featured: false },
      { name: 'Mechanical RGB Gaming Keyboard', desc: 'Premium mechanical keyboard with blue switches, RGB backlight, and detachable wrist rest. Built for gaming.', price: 1899, comparePrice: 2599, stock: 65, brand: 'GamePro', cat: electronics.id, ret: retailer1.id, flash: true, featured: false },
      { name: 'Wireless Mouse Silent Click', desc: 'Ergonomic silent click wireless mouse with USB receiver. 2.4GHz stable connection up to 10 meters.', price: 449, comparePrice: 699, stock: 150, brand: 'ClickPro', cat: electronics.id, ret: retailer1.id, flash: false, featured: false },

      // Smartphones
      { name: 'Xiaomi Redmi Note 12 (4GB/128GB)', desc: '6.67-inch AMOLED display, Snapdragon 685, 50MP triple camera, 5000mAh battery. Official warranty included.', price: 18999, comparePrice: 21999, stock: 35, brand: 'Xiaomi', cat: smartphones.id, ret: retailer1.id, flash: true, featured: true },
      { name: 'Samsung Galaxy A14 (4GB/64GB)', desc: '6.6-inch display, 50MP camera, 5000mAh battery, expandable storage. Brand new sealed box.', price: 14999, comparePrice: 16999, stock: 40, brand: 'Samsung', cat: smartphones.id, ret: retailer1.id, flash: true, featured: false },
      { name: 'Realme C55 (6GB/128GB)', desc: '6.72-inch FHD display, 64MP camera, 5000mAh battery, 33W SuperVOOC charging.', price: 15999, comparePrice: 18999, stock: 25, brand: 'Realme', cat: smartphones.id, ret: retailer1.id, flash: false, featured: true },
      { name: 'iPhone Charger & Cable Combo', desc: 'Original Apple-certified 20W USB-C charger with lightning cable. Fast charging support.', price: 1299, comparePrice: 1799, stock: 100, brand: 'Apple', cat: smartphones.id, ret: retailer1.id, flash: false, featured: false },
      { name: 'Phone Case Premium Leather', desc: 'Handcrafted premium leather phone case. Fits all major phone models. Slim design with card pocket.', price: 599, comparePrice: 899, stock: 120, brand: 'LeatherCraft', cat: smartphones.id, ret: retailer1.id, flash: true, featured: false },

      // Fashion
      { name: "Men's Cotton Casual Shirt", desc: 'Premium 100% cotton casual shirt in classic fit. Breathable fabric perfect for daily wear. Available in multiple sizes.', price: 899, comparePrice: 1599, stock: 90, brand: 'UrbanWear', cat: fashion.id, ret: retailer2.id, flash: true, featured: true },
      { name: "Women's Embroidered Kameez Set", desc: 'Elegant three-piece kameez set with intricate embroidery. Includes kameez, salwar, and orna. Perfect for festive occasions.', price: 1799, comparePrice: 2999, stock: 60, brand: 'BD Fashion', cat: fashion.id, ret: retailer2.id, flash: true, featured: true },
      { name: 'Leather Wallet for Men', desc: 'Genuine leather bi-fold wallet with 8 card slots and cash compartment. Sleek minimalist design.', price: 749, comparePrice: 1199, stock: 110, brand: 'LeatherCraft', cat: fashion.id, ret: retailer2.id, flash: false, featured: false },
      { name: "Women's Handbag Designer", desc: 'Stylish designer handbag with adjustable strap and multiple compartments. Premium quality PU leather.', price: 1299, comparePrice: 2199, stock: 75, brand: 'BagStyle', cat: fashion.id, ret: retailer2.id, flash: true, featured: false },
      { name: 'Sports Running Shoes', desc: 'Lightweight running shoes with breathable mesh and cushioned sole. Perfect for jogging and gym.', price: 1499, comparePrice: 2499, stock: 95, brand: 'SpeedRun', cat: fashion.id, ret: retailer2.id, flash: false, featured: true },

      // Home & Living
      { name: 'Stainless Steel Cookware Set 7pc', desc: 'Premium 7-piece stainless steel cookware set with glass lids. Induction-compatible, dishwasher safe.', price: 2499, comparePrice: 3999, stock: 50, brand: 'HomeChef', cat: home.id, ret: retailer2.id, flash: true, featured: true },
      { name: 'LED Desk Lamp Dimmable', desc: 'Modern LED desk lamp with 3 brightness levels and USB charging port. Touch control, eye-care design.', price: 899, comparePrice: 1499, stock: 130, brand: 'BrightHome', cat: home.id, ret: retailer2.id, flash: false, featured: false },
      { name: 'Memory Foam Pillow Set', desc: 'Set of 2 premium memory foam pillows with removable washable cover. Neck support, anti-allergic.', price: 1199, comparePrice: 1899, stock: 85, brand: 'SleepWell', cat: home.id, ret: retailer2.id, flash: true, featured: false },
      { name: 'Air Fryer 5L Digital', desc: 'Healthy cooking digital air fryer with 8 preset menus. 5L capacity, 1500W power. Non-stick basket.', price: 4999, comparePrice: 6999, stock: 30, brand: 'FryMaster', cat: home.id, ret: retailer2.id, flash: true, featured: true },
      { name: 'Cotton Bed Sheet Queen Size', desc: 'Premium 100% cotton bed sheet with 2 pillow covers. Queen size 90x108 inches. Soft and breathable.', price: 1099, comparePrice: 1799, stock: 70, brand: 'HomeTextile', cat: home.id, ret: retailer2.id, flash: false, featured: false },

      // Beauty
      { name: 'Vitamin C Face Serum 30ml', desc: 'Brightening vitamin C serum for radiant skin. Reduces dark spots and improves skin texture. Suitable for all skin types.', price: 699, comparePrice: 1199, stock: 200, brand: 'GlowUp', cat: beauty.id, ret: retailer1.id, flash: true, featured: true },
      { name: 'Hair Oil Organic Coconut 200ml', desc: 'Pure organic coconut hair oil for nourishment. Cold-pressed, no chemicals. Promotes hair growth.', price: 349, comparePrice: 599, stock: 250, brand: 'Naturals', cat: beauty.id, ret: retailer1.id, flash: false, featured: false },
      { name: 'Sunscreen SPF 50 PA+++ 50ml', desc: 'Lightweight non-greasy sunscreen with SPF 50. Broad spectrum protection against UVA/UVB rays. Water-resistant.', price: 549, comparePrice: 849, stock: 180, brand: 'SunGuard', cat: beauty.id, ret: retailer1.id, flash: true, featured: false },

      // Sports
      { name: 'Yoga Mat Premium 6mm', desc: 'Non-slip premium TPE yoga mat. 6mm thick for extra comfort. Lightweight, eco-friendly, comes with carrying strap.', price: 799, comparePrice: 1299, stock: 100, brand: 'YogaFit', cat: sports.id, ret: retailer2.id, flash: true, featured: true },
      { name: 'Adjustable Dumbbell 20kg Pair', desc: 'Adjustable dumbbell pair up to 20kg each. Quick weight change system. Compact storage. Perfect for home gym.', price: 3499, comparePrice: 4999, stock: 25, brand: 'PowerFit', cat: sports.id, ret: retailer2.id, flash: false, featured: true },

      // Groceries
      { name: 'Basmati Rice Premium 5kg', desc: 'Long grain premium basmati rice. Aged for 2 years for enhanced flavor. Perfect for biryani and pulao.', price: 899, comparePrice: 1099, stock: 300, brand: 'RiceKing', cat: groceries.id, ret: retailer1.id, flash: false, featured: false },
      { name: 'Sunflower Cooking Oil 5L', desc: 'Refined sunflower cooking oil, cholesterol-free. Rich in Vitamin E. Perfect for healthy cooking.', price: 1299, comparePrice: 1599, stock: 200, brand: 'PureOil', cat: groceries.id, ret: retailer1.id, flash: true, featured: false },

      // Books
      { name: 'Novel: The Lost City of Bangladesh', desc: 'Best-selling Bengali novel exploring historical fiction set in ancient Bengal. Award-winning author.', price: 449, comparePrice: 699, stock: 150, brand: 'BookHouse', cat: books.id, ret: retailer2.id, flash: false, featured: false },
    ]

    let seed = 1
    const reviewPool = [
      { rating: 5, comment: 'Excellent product! Delivery was very fast and packaging was secure.' },
      { rating: 4, comment: 'Good value for money. Quality is nice and works as expected.' },
      { rating: 5, comment: 'Highly recommended! Exactly as shown in the pictures.' },
      { rating: 4, comment: 'Satisfied with the purchase. Will definitely order again from this seller.' },
      { rating: 5, comment: 'Original authentic item. 100% satisfied with the quality!' },
    ]

    for (const p of products) {
      const prod = await db.product.create({
        data: {
          name: p.name,
          slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + seed,
          description: p.desc,
          price: p.price,
          comparePrice: p.comparePrice,
          images: JSON.stringify([img(seed), img(seed + 100), img(seed + 200)]),
          stock: p.stock,
          brand: p.brand,
          categoryId: p.cat,
          retailerId: p.ret,
          isFlashSale: p.flash,
          isFeatured: p.featured,
          rating: 4.5,
          reviewCount: 2,
          soldCount: 50 + seed * 12,
        },
      })

      // Create initial demo reviews
      await db.review.create({
        data: {
          productId: prod.id,
          userId: customer.id,
          rating: reviewPool[seed % reviewPool.length].rating,
          comment: reviewPool[seed % reviewPool.length].comment,
        },
      })
      await db.review.create({
        data: {
          productId: prod.id,
          userId: admin.id,
          rating: reviewPool[(seed + 2) % reviewPool.length].rating,
          comment: reviewPool[(seed + 2) % reviewPool.length].comment,
        },
      })

      seed++
    }

    return NextResponse.json({
      success: true,
      counts: {
        users: 4,
        categories: cats.length,
        products: products.length,
      },
      demoAccounts: {
        admin: { phone: '8801700000001', email: `admin@${BRAND.demoEmailDomain}`, password: 'admin123' },
        retailer: { phone: '8801700000002', email: `retailer@${BRAND.demoEmailDomain}`, password: 'retailer123' },
        customer: { phone: '8801700000004', email: `customer@${BRAND.demoEmailDomain}`, password: 'customer123' },
      },
    })
  } catch (e) {
    console.error('Seed error:', e)
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 })
  }
}

// GET /api/seed — returns current DB counts without modifying anything
export async function GET(req: NextRequest) {
  const secret = process.env.SEED_SECRET
  if (secret) {
    const provided = req.headers.get('x-seed-secret') || ''
    if (provided !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  const [users, categories, products] = await Promise.all([
    db.user.count(),
    db.category.count(),
    db.product.count(),
  ])
  return NextResponse.json({ users, categories, products })
}
