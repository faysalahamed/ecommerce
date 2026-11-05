import { Metadata } from 'next'
import { BRAND } from '@/lib/brand'
import { Header } from '@/components/ecommerce/header'
import { Footer } from '@/components/ecommerce/footer'
import { LoginView } from '@/components/views/login-view'

export const metadata: Metadata = {
  title: `Create Account - ${BRAND.name}`,
  description: `Create your free account on ${BRAND.name} to shop from thousands of products with nationwide delivery.`,
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header categories={[]} />
      <main className="flex-1 flex items-center justify-center py-4 sm:py-8">
        <LoginView initialMode="register" />
      </main>
      <Footer categories={[]} />
    </div>
  )
}

