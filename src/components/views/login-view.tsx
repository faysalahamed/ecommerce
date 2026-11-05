'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { BRAND } from '@/lib/brand'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Phone,
  User,
  Store,
  ShieldCheck,
  Truck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  Tag,
  ArrowLeft,
  ChevronRight,
  ShoppingBag,
  BadgePercent,
  Star,
  Check,
} from 'lucide-react'

export type AuthMode = 'login' | 'register' | 'forgot'

interface LoginViewProps {
  initialMode?: AuthMode
  onSuccess?: () => void
  isModal?: boolean
}

export function LoginView({ initialMode = 'login', onSuccess, isModal = false }: LoginViewProps) {
  const { setUser, refreshCart, navigate, closeAuth } = useStore()
  const siteConfig = useStore((s) => s.siteConfig)
  const fetchSiteConfig = useStore((s) => s.fetchSiteConfig)

  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form state
  const [regStep, setRegStep] = useState<1 | 2>(1)
  const [regName, setRegName] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regRole, setRegRole] = useState<'CUSTOMER' | 'RETAILER'>('CUSTOMER')
  const [regStoreName, setRegStoreName] = useState('')
  const [regOtp, setRegOtp] = useState('')
  const [regCooldown, setRegCooldown] = useState(0)

  // Forgot Password state
  const [fpStep, setFpStep] = useState<1 | 2 | 3>(1)
  const [fpIdentifier, setFpIdentifier] = useState('')
  const [fpOtp, setFpOtp] = useState('')
  const [fpNewPassword, setFpNewPassword] = useState('')
  const [fpCooldown, setFpCooldown] = useState(0)
  const [fpMaskedPhone, setFpMaskedPhone] = useState('')

  // OTP server configuration
  const [otpEnabled, setOtpEnabled] = useState(true)

  useEffect(() => {
    fetchSiteConfig()
  }, [fetchSiteConfig])

  useEffect(() => {
    if (siteConfig) {
      setOtpEnabled(siteConfig.otpEnabled !== false)
    }
  }, [siteConfig])

  // Cooldown timer
  useEffect(() => {
    if (regCooldown <= 0 && fpCooldown <= 0) return
    const t = setInterval(() => {
      setRegCooldown((s) => (s > 0 ? s - 1 : 0))
      setFpCooldown((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => clearInterval(t)
  }, [regCooldown, fpCooldown])

  // Check URL query parameters for OAuth status or errors
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const oauthError = params.get('error')
      const oauthSuccess = params.get('oauth_login')
      const provider = params.get('provider')

      if (oauthError) {
        toast.error(decodeURIComponent(oauthError))
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
      } else if (oauthSuccess === 'success') {
        toast.success(`Successfully signed in with ${provider === 'google' ? 'Google' : 'Facebook'}!`)
        refreshCart()
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
      }
    }
  }, [refreshCart])

  // Quick fill for demo accounts
  const handleQuickFill = (role: 'customer' | 'retailer' | 'admin') => {
    if (role === 'customer') {
      setLoginIdentifier('+8801700000004')
      setLoginPassword('customer123')
    } else if (role === 'retailer') {
      setLoginIdentifier('+8801700000002')
      setLoginPassword('retailer123')
    } else if (role === 'admin') {
      setLoginIdentifier(`admin@${BRAND.demoEmailDomain}`)
      setLoginPassword('admin123')
    }
    toast.info(`Filled ${role.toUpperCase()} credentials. Click Sign In to test.`)
  }

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginIdentifier.trim()) {
      toast.error('Please enter your email or mobile number')
      return
    }
    if (!loginPassword) {
      toast.error('Please enter your password')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneOrEmail: loginIdentifier.trim(),
          password: loginPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Login failed. Please check your credentials.')
        return
      }

      setUser(data.user)
      toast.success(`Welcome back, ${data.user.name}!`)
      await refreshCart()

      if (onSuccess) {
        onSuccess()
      } else {
        closeAuth()
        navigate({ name: 'home' })
      }
    } catch {
      toast.error('Unable to connect to the login service. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Registration step 1: Request OTP or Direct Register
  const handleRegisterStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regName.trim()) {
      toast.error('Please enter your full name')
      return
    }
    if (!regPhone.trim()) {
      toast.error('Please enter your mobile phone number')
      return
    }
    if (regPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (regRole === 'RETAILER' && !regStoreName.trim()) {
      toast.error('Please enter your store or business name')
      return
    }

    // If OTP is disabled on the server, create account directly
    if (!otpEnabled) {
      await registerDirect()
      return
    }

    // Otherwise, send OTP
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: regPhone.trim(), purpose: 'REGISTER' }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to send verification code')
        if (data.cooldownSeconds) setRegCooldown(data.cooldownSeconds)
        return
      }
      toast.success(`Verification code sent! Demo OTP: ${data.code}`, { duration: 9000 })
      setRegStep(2)
      setRegCooldown(60)
    } catch {
      toast.error('Failed to send verification code')
    } finally {
      setLoading(false)
    }
  }

  // Direct registration when OTP is disabled
  const registerDirect = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          phone: regPhone.trim(),
          email: regEmail.trim() || undefined,
          password: regPassword,
          role: regRole,
          storeName: regStoreName.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Registration failed')
        return
      }
      setUser(data.user)
      toast.success('Account created successfully! Welcome to ' + BRAND.name)
      await refreshCart()
      if (onSuccess) {
        onSuccess()
      } else {
        closeAuth()
        if (regRole === 'RETAILER') {
          navigate({ name: 'dashboard' })
        } else {
          navigate({ name: 'home' })
        }
      }
    } catch {
      toast.error('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Registration step 2: Verify OTP and finalize
  const handleRegisterStep2 = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regOtp.trim()) {
      toast.error('Please enter the 6-digit verification code')
      return
    }

    setLoading(true)
    try {
      // 1. Verify OTP
      const verifyRes = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: regPhone.trim(),
          code: regOtp.trim(),
          purpose: 'REGISTER',
        }),
      })
      const verifyData = await verifyRes.json()
      if (!verifyRes.ok) {
        toast.error(verifyData.error || 'Invalid verification code')
        return
      }

      // 2. Create account
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          phone: regPhone.trim(),
          email: regEmail.trim() || undefined,
          password: regPassword,
          role: regRole,
          storeName: regStoreName.trim() || undefined,
          otpVerified: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Registration failed')
        return
      }

      setUser(data.user)
      toast.success('Account created successfully!')
      await refreshCart()
      if (onSuccess) {
        onSuccess()
      } else {
        closeAuth()
        navigate({ name: regRole === 'RETAILER' ? 'dashboard' : 'home' })
      }
    } catch {
      toast.error('Registration failed')
    } finally {
      setLoading(false)
    }
  }

  // Forgot password step 1: Send OTP
  const handleFpStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fpIdentifier.trim()) {
      toast.error('Please enter your registered phone or email')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneOrEmail: fpIdentifier.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to locate account')
        return
      }
      setFpMaskedPhone(data.phoneMasked || fpIdentifier)
      setFpStep(2)
      setFpCooldown(60)
      toast.success(`Reset code sent! Demo OTP: ${data.code}`, { duration: 9000 })
    } catch {
      toast.error('Failed to send reset code')
    } finally {
      setLoading(false)
    }
  }

  // Forgot password step 2: Verify OTP
  const handleFpStep2 = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fpOtp.trim()) {
      toast.error('Please enter the verification code')
      return
    }
    setFpStep(3)
  }

  // Forgot password step 3: Set new password
  const handleFpStep3 = async (e: React.FormEvent) => {
    e.preventDefault()
    if (fpNewPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneOrEmail: fpIdentifier.trim(),
          code: fpOtp.trim(),
          newPassword: fpNewPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to reset password')
        return
      }
      toast.success('Password reset successfully! Please sign in with your new password.')
      setMode('login')
      setLoginIdentifier(fpIdentifier)
      setLoginPassword(fpNewPassword)
      setFpStep(1)
    } catch {
      toast.error('Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  // OAuth triggers
  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google'
  }

  const handleFacebookLogin = () => {
    window.location.href = '/api/auth/facebook'
  }

  return (
    <div className={`w-full ${isModal ? 'p-0' : 'min-h-[calc(100vh-140px)] py-6 sm:py-10 flex items-center justify-center bg-[#F8FAFC]'}`}>
      <div className={`w-full max-w-5xl mx-auto ${isModal ? '' : 'px-3 sm:px-6'}`}>
        <div className="bg-white rounded-3xl shadow-xl border border-[#E2E8F0] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">

          {/* ========================================================================= */}
          {/* LEFT PROMOTIONAL SECTION: SKY BLUE BRANDED E-COMMERCE SHOWCASE (Desktop)  */}
          {/* ========================================================================= */}
          <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#075985] via-[#0284C7] to-[#38BDF8] p-8 sm:p-10 text-white flex-col justify-between relative overflow-hidden select-none">
            {/* Background Decorative Circles & Lighting */}
            <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-[#38BDF8]/30 blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/5 blur-2xl pointer-events-none" />

            {/* Top Brand Logo & Pill */}
            <div className="relative z-10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate({ name: 'home' })}
                className="flex items-center gap-2 group text-left"
              >
                <div className="bg-white text-[#0284C7] px-3.5 py-1.5 rounded-xl text-xl font-black tracking-tight shadow-md group-hover:scale-105 transition-transform">
                  {BRAND.name}
                </div>
              </button>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-sky-100 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-sky-200" /> Premium Shopping
              </span>
            </div>

            {/* Center Dynamic Illustration & Value Card Showcase */}
            <div className="relative z-10 my-8 space-y-6">
              {/* E-commerce Visual Composition */}
              <div className="relative w-full aspect-[4/3] max-w-sm mx-auto flex items-center justify-center">
                {/* Central Glowing Shopping Card */}
                <div className="w-56 h-40 bg-white/15 backdrop-blur-md rounded-2xl border border-white/30 p-4 shadow-2xl flex flex-col justify-between transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-white text-[#0284C7] flex items-center justify-center shadow-sm">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold bg-white/25 px-2 py-0.5 rounded-full text-white">
                      Top Verified
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-sky-100 font-medium">Flash Deals &amp; Lifestyle</div>
                    <div className="text-base font-black text-white mt-0.5">Up to 70% OFF</div>
                  </div>
                </div>

                {/* Floating Gadget & Fashion Badge Top-Right */}
                <div className="absolute -top-3 right-2 bg-white text-[#1E293B] px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-2 transform rotate-3 hover:scale-105 transition">
                  <div className="w-7 h-7 rounded-lg bg-[#F0F9FF] text-[#0284C7] flex items-center justify-center font-bold text-xs">
                    🎧
                  </div>
                  <div>
                    <div className="text-[11px] font-bold leading-none">Smart Electronics</div>
                    <div className="text-[9px] text-[#64748B] font-medium mt-0.5">100% Genuine</div>
                  </div>
                </div>

                {/* Floating Rating Badge Bottom-Left */}
                <div className="absolute -bottom-2 left-2 bg-white text-[#1E293B] px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-2 transform -rotate-3 hover:scale-105 transition">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center font-bold text-xs">
                    <Star className="h-4 w-4 fill-amber-400" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold leading-none">4.9 / 5 Rating</div>
                    <div className="text-[9px] text-[#64748B] font-medium mt-0.5">50,000+ Happy Shoppers</div>
                  </div>
                </div>
              </div>

              {/* Headline & Subtitle */}
              <div className="space-y-2 text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  Everything You Love,<br />All in One Place
                </h2>
                <p className="text-xs sm:text-sm text-sky-100 leading-relaxed font-normal">
                  Discover amazing products and enjoy a smarter shopping experience with authentic brands and verified sellers.
                </p>
              </div>

              {/* 3 Core Highlights */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs px-3.5 py-2.5 rounded-xl border border-white/15">
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                    <Tag className="h-4 w-4 text-sky-200" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-white">Exclusive Deals:</span>{' '}
                    <span className="text-sky-100">Special seasonal vouchers &amp; flash price drops</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs px-3.5 py-2.5 rounded-xl border border-white/15">
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-4 w-4 text-sky-200" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-white">Secure Shopping:</span>{' '}
                    <span className="text-sky-100">100% verified buyer protection &amp; encrypted payments</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs px-3.5 py-2.5 rounded-xl border border-white/15">
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                    <Truck className="h-4 w-4 text-sky-200" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-white">Fast Delivery:</span>{' '}
                    <span className="text-sky-100">Nationwide home delivery &amp; neighborhood pickup hubs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Trust Seal */}
            <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-[11px] text-sky-100">
              <span>Authentic Bangladesh Marketplace</span>
              <span>🔒 256-Bit SSL Encrypted</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT SECTION: CLEAN, MODERN WHITE AUTH CARD                              */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white">
            <div>
              {/* Mobile / Tablet Header Branding */}
              <div className="flex lg:hidden items-center justify-between pb-4 mb-4 border-b border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => navigate({ name: 'home' })}
                  className="bg-[#0284C7] text-white px-3.5 py-1.5 rounded-lg text-lg font-black tracking-tight"
                >
                  {BRAND.name}
                </button>
                <span className="text-xs text-[#64748B] font-medium">Sky Blue Shopping</span>
              </div>

              {/* ===================================================================== */}
              {/* 1. SIGN IN (LOGIN) FORM VIEW                                          */}
              {/* ===================================================================== */}
              {mode === 'login' && (
                <div className="space-y-6">
                  {/* Title & Subtitle */}
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight">
                      Welcome Back
                    </h1>
                    <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                      Enter your mobile number or email address to access your account.
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleLogin} className="space-y-4">
                    {/* Identifier Input */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-[#1E293B]">
                        Email or Mobile Number
                      </Label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none">
                          <User className="h-4 w-4" />
                        </div>
                        <Input
                          type="text"
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          placeholder="e.g. 01700000004 or name@email.com"
                          className="pl-10 h-11 text-xs sm:text-sm bg-[#F8FAFC] border-[#E2E8F0] focus-visible:ring-[#0284C7] focus-visible:border-[#0284C7] text-[#1E293B] rounded-xl transition"
                          required
                          autoComplete="username"
                        />
                      </div>
                    </div>

                    {/* Password Input with Show/Hide toggle */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-[#1E293B]">Password</Label>
                        <button
                          type="button"
                          onClick={() => setMode('forgot')}
                          className="text-xs font-semibold text-[#0284C7] hover:text-[#075985] hover:underline"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none">
                          <Lock className="h-4 w-4" />
                        </div>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="pl-10 pr-10 h-11 text-xs sm:text-sm bg-[#F8FAFC] border-[#E2E8F0] focus-visible:ring-[#0284C7] focus-visible:border-[#0284C7] text-[#1E293B] rounded-xl transition"
                          required
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1E293B] transition"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember Me Checkbox */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <input
                        type="checkbox"
                        id="rememberMe"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-[#0284C7] border-[#E2E8F0] rounded focus:ring-[#0284C7] cursor-pointer"
                      />
                      <label htmlFor="rememberMe" className="text-xs text-[#1E293B] font-medium cursor-pointer select-none">
                        Remember me on this browser
                      </label>
                    </div>

                    {/* Primary Sky Blue Login Button */}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-1" /> Signing in...
                        </>
                      ) : (
                        <>
                          Sign In <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Divider: Or Continue With */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#E2E8F0]" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-3 text-[#64748B] font-medium">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  {/* Social Authentication Buttons: Google & Facebook */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Google Button */}
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className="w-full h-11 px-4 border border-[#E2E8F0] hover:border-[#38BDF8] bg-white hover:bg-[#F0F9FF] text-[#1E293B] rounded-xl text-xs font-semibold flex items-center justify-center gap-2.5 transition shadow-2xs hover:shadow-xs group"
                    >
                      {/* Official Google 4-Color Logo */}
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </button>

                    {/* Facebook Button */}
                    <button
                      type="button"
                      onClick={handleFacebookLogin}
                      className="w-full h-11 px-4 border border-[#E2E8F0] hover:border-[#38BDF8] bg-white hover:bg-[#F0F9FF] text-[#1E293B] rounded-xl text-xs font-semibold flex items-center justify-center gap-2.5 transition shadow-2xs hover:shadow-xs group"
                    >
                      {/* Official Facebook Blue Logo */}
                      <svg className="h-4 w-4 shrink-0 fill-[#1877F2]" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      <span>Continue with Facebook</span>
                    </button>
                  </div>

                  {/* Create Account Link */}
                  <div className="pt-2 text-center text-xs text-[#64748B]">
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="font-bold text-[#0284C7] hover:text-[#075985] hover:underline cursor-pointer ml-1"
                    >
                      Create Account
                    </button>
                  </div>

                  {/* 1-Click Demo Accounts Bar (Convenient evaluation helper) */}
                  <div className="pt-4 border-t border-[#E2E8F0]">
                    <div className="text-[11px] font-semibold text-[#64748B] flex items-center justify-between mb-2">
                      <span>Quick Demo Logins (1-Click Fill):</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickFill('customer')}
                        className="py-1.5 px-2 bg-[#F0F9FF] hover:bg-sky-100 text-[#0284C7] rounded-lg text-[11px] font-bold border border-sky-200 transition"
                      >
                        👤 Customer
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('retailer')}
                        className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold border border-emerald-200 transition"
                      >
                        🏪 Seller
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('admin')}
                        className="py-1.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[11px] font-bold border border-purple-200 transition"
                      >
                        ⚡ Admin
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ===================================================================== */}
              {/* 2. CREATE ACCOUNT (REGISTRATION) FORM VIEW                            */}
              {/* ===================================================================== */}
              {mode === 'register' && (
                <div className="space-y-5">
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login')
                        setRegStep(1)
                      }}
                      className="inline-flex items-center gap-1 text-xs text-[#0284C7] hover:underline font-semibold mb-2"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight">
                      Create Your Account
                    </h1>
                    <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                      Join {BRAND.name} for exclusive deals, fast delivery, and rewards.
                    </p>
                  </div>

                  {/* Role Selector: Customer vs Retailer */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                    <button
                      type="button"
                      onClick={() => setRegRole('CUSTOMER')}
                      className={`py-2 text-xs font-bold rounded-lg transition ${regRole === 'CUSTOMER'
                          ? 'bg-white text-[#0284C7] shadow-xs'
                          : 'text-[#64748B] hover:text-[#1E293B]'
                        }`}
                    >
                      👤 Regular Shopper
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegRole('RETAILER')}
                      className={`py-2 text-xs font-bold rounded-lg transition ${regRole === 'RETAILER'
                          ? 'bg-white text-[#0284C7] shadow-xs'
                          : 'text-[#64748B] hover:text-[#1E293B]'
                        }`}
                    >
                      🏪 Seller / Merchant
                    </button>
                  </div>

                  {regStep === 1 ? (
                    <form onSubmit={handleRegisterStep1} className="space-y-3.5">
                      {/* Name */}
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-[#1E293B]">Full Name *</Label>
                        <Input
                          type="text"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="e.g. Rahim Ahmed"
                          className="h-10 text-xs sm:text-sm bg-[#F8FAFC] border-[#E2E8F0] rounded-xl"
                          required
                        />
                      </div>

                      {/* Phone Number */}
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-[#1E293B]">Mobile Number *</Label>
                        <div className="relative">
                          <Input
                            type="tel"
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            placeholder="e.g. +880 1712-345678"
                            className="h-10 text-xs sm:text-sm bg-[#F8FAFC] border-[#E2E8F0] rounded-xl"
                            required
                          />
                        </div>
                      </div>

                      {/* Store Name if Retailer */}
                      {regRole === 'RETAILER' && (
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-[#1E293B]">Shop / Business Name *</Label>
                          <Input
                            type="text"
                            value={regStoreName}
                            onChange={(e) => setRegStoreName(e.target.value)}
                            placeholder="e.g. Dhaka Fashion Hub"
                            className="h-10 text-xs sm:text-sm bg-[#F8FAFC] border-[#E2E8F0] rounded-xl"
                            required
                          />
                        </div>
                      )}

                      {/* Email (Optional) */}
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-[#1E293B]">
                          Email Address <span className="text-[#64748B] font-normal">(Optional)</span>
                        </Label>
                        <Input
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="h-10 text-xs sm:text-sm bg-[#F8FAFC] border-[#E2E8F0] rounded-xl"
                        />
                      </div>

                      {/* Password */}
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-[#1E293B]">Create Password *</Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            className="pr-10 h-10 text-xs sm:text-sm bg-[#F8FAFC] border-[#E2E8F0] rounded-xl"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-1" /> Processing...
                          </>
                        ) : otpEnabled ? (
                          <>
                            Verify Mobile &amp; Continue <ArrowRight className="h-4 w-4 ml-1" />
                          </>
                        ) : (
                          <>
                            Create Account <Check className="h-4 w-4 ml-1" />
                          </>
                        )}
                      </Button>
                    </form>
                  ) : (
                    /* Step 2: OTP Entry */
                    <form onSubmit={handleRegisterStep2} className="space-y-4">
                      <div className="bg-[#F0F9FF] border border-sky-200 p-3 rounded-xl text-xs text-[#075985] space-y-1">
                        <p className="font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-[#0284C7]" /> Verification Code Sent
                        </p>
                        <p>We sent a 6-digit verification code to <strong>{regPhone}</strong>.</p>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-[#1E293B]">Enter 6-Digit OTP</Label>
                        <Input
                          type="text"
                          maxLength={6}
                          value={regOtp}
                          onChange={(e) => setRegOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="123456"
                          className="h-12 text-center text-lg font-mono tracking-widest bg-[#F8FAFC] border-[#E2E8F0] rounded-xl font-bold text-[#0284C7]"
                          required
                          autoFocus
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => setRegStep(1)}
                          className="text-[#64748B] hover:text-[#1E293B] underline"
                        >
                          Change phone number
                        </button>
                        <button
                          type="button"
                          disabled={regCooldown > 0 || loading}
                          onClick={() => handleRegisterStep1({ preventDefault: () => { } } as any)}
                          className={`font-semibold ${regCooldown > 0 ? 'text-[#64748B]' : 'text-[#0284C7] hover:underline'
                            }`}
                        >
                          {regCooldown > 0 ? `Resend in ${regCooldown}s` : 'Resend Code'}
                        </button>
                      </div>

                      <Button
                        type="submit"
                        disabled={loading || regOtp.length < 4}
                        className="w-full h-11 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition"
                      >
                        {loading ? 'Verifying...' : 'Complete Registration'}
                      </Button>
                    </form>
                  )}

                  <div className="text-center text-xs text-[#64748B]">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="font-bold text-[#0284C7] hover:underline ml-1"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              )}

              {/* ===================================================================== */}
              {/* 3. FORGOT PASSWORD FORM VIEW                                          */}
              {/* ===================================================================== */}
              {mode === 'forgot' && (
                <div className="space-y-5">
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login')
                        setFpStep(1)
                      }}
                      className="inline-flex items-center gap-1 text-xs text-[#0284C7] hover:underline font-semibold mb-2"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight">
                      Reset Password
                    </h1>
                    <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                      {fpStep === 1
                        ? 'Enter your registered phone or email to receive a password reset code.'
                        : fpStep === 2
                          ? 'Enter the 6-digit reset code sent to your device.'
                          : 'Choose a new password for your account.'}
                    </p>
                  </div>

                  {fpStep === 1 && (
                    <form onSubmit={handleFpStep1} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-[#1E293B]">
                          Registered Mobile Number or Email
                        </Label>
                        <Input
                          type="text"
                          value={fpIdentifier}
                          onChange={(e) => setFpIdentifier(e.target.value)}
                          placeholder="e.g. +8801700000004 or name@email.com"
                          className="h-11 text-xs sm:text-sm bg-[#F8FAFC] border-[#E2E8F0] rounded-xl"
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition"
                      >
                        {loading ? 'Sending Code...' : 'Send Reset Code'}
                      </Button>
                    </form>
                  )}

                  {fpStep === 2 && (
                    <form onSubmit={handleFpStep2} className="space-y-4">
                      <div className="bg-[#F0F9FF] border border-sky-200 p-3 rounded-xl text-xs text-[#075985]">
                        Reset code sent to <strong>{fpMaskedPhone}</strong>.
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-[#1E293B]">6-Digit Code</Label>
                        <Input
                          type="text"
                          maxLength={6}
                          value={fpOtp}
                          onChange={(e) => setFpOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="123456"
                          className="h-12 text-center text-lg font-mono tracking-widest bg-[#F8FAFC] border-[#E2E8F0] rounded-xl font-bold text-[#0284C7]"
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full h-11 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition"
                      >
                        Verify &amp; Continue
                      </Button>
                    </form>
                  )}

                  {fpStep === 3 && (
                    <form onSubmit={handleFpStep3} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-[#1E293B]">New Password</Label>
                        <Input
                          type="password"
                          value={fpNewPassword}
                          onChange={(e) => setFpNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="h-11 text-xs sm:text-sm bg-[#F8FAFC] border-[#E2E8F0] rounded-xl"
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition"
                      >
                        {loading ? 'Saving...' : 'Update Password & Sign In'}
                      </Button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Security Guarantee Note */}
            <div className="pt-6 mt-6 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-[#0284C7]" /> Protected by {BRAND.name} Security
              </span>
              <span className="text-[#64748B]">Terms &amp; Privacy Policy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

