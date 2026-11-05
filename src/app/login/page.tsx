import { Metadata } from 'next'
import { BRAND } from '@/lib/brand'
import { Header } from '@/components/ecommerce/header'
import { Footer } from '@/components/ecommerce/footer'
import { LoginView } from '@/components/views/login-view'

export const metadata: Metadata = {
  title: `Sign In - ${BRAND.name}`,
  description: `Sign in to your ${BRAND.name} account to manage orders, wishlist, and enjoy exclusive deals.`,
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header categories={[]} />
      <main className="flex-1 flex items-center justify-center py-4 sm:py-8">
        <LoginView initialMode="login" />
      </main>
      <Footer categories={[]} />
    </div>
  )
}

