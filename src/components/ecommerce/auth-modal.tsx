'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useStore } from '@/lib/store'
import { BRAND } from '@/lib/brand'
import { toast } from 'sonner'
import { Loader2, Phone, ShieldCheck, KeyRound } from 'lucide-react'

type Mode = 'login' | 'register' | 'forgot'

export function AuthModal() {
  const { authModal, closeAuth, setUser, refreshCart, navigate } = useStore()
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<Mode>('login')

  // Sync mode with authModal changes
  useEffect(() => {
    if (authModal === 'register') setMode('register')
    else if (authModal === 'login') setMode('login')
  }, [authModal])

  // login form — accepts phone OR email
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // register form — two steps
  const [regStep, setRegStep] = useState<1 | 2>(1)
  const [regName, setRegName] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regRole, setRegRole] = useState<'CUSTOMER' | 'RETAILER'>('CUSTOMER')
  const [regStoreName, setRegStoreName] = useState('')
  const [regOtp, setRegOtp] = useState('')
  const [regCooldown, setRegCooldown] = useState(0)

  // forgot password form — three steps
  const [fpStep, setFpStep] = useState<1 | 2 | 3>(1)
  const [fpIdentifier, setFpIdentifier] = useState('')
  const [fpOtp, setFpOtp] = useState('')
  const [fpNewPassword, setFpNewPassword] = useState('')
  const [fpCooldown, setFpCooldown] = useState(0)
  const [fpMaskedPhone, setFpMaskedPhone] = useState('')

  // Cooldown timer effect
  useEffect(() => {
    if (regCooldown <= 0 && fpCooldown <= 0) return
    const t = setInterval(() => {
      setRegCooldown((s) => (s > 0 ? s - 1 : 0))
      setFpCooldown((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => clearInterval(t)
  }, [regCooldown, fpCooldown])

  const resetForms = () => {
    setLoginIdentifier('')
    setLoginPassword('')
    setRegStep(1)
    setRegName('')
    setRegPhone('')
    setRegEmail('')
    setRegPassword('')
    setRegRole('CUSTOMER')
    setRegStoreName('')
    setRegOtp('')
    setRegCooldown(0)
    setFpStep(1)
    setFpIdentifier('')
    setFpOtp('')
    setFpNewPassword('')
    setFpCooldown(0)
    setFpMaskedPhone('')
  }

  const handleClose = () => {
    resetForms()
    setMode('login')
    closeAuth()
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneOrEmail: loginIdentifier, password: loginPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Login failed')
        return
      }
      setUser(data.user)
      toast.success('Welcome back, ' + data.user.name)
      handleClose()
      await refreshCart()
    } catch {
      toast.error('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const sendRegOtp = async () => {
    if (!regPhone.trim()) {
      toast.error('Please enter your phone number')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: regPhone, purpose: 'REGISTER' }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to send OTP')
        if (data.cooldownSeconds) setRegCooldown(data.cooldownSeconds)
        return
      }
      // Dev mode: show the OTP code so the user can see it
      toast.success(`OTP sent! Demo code: ${data.code}`, { duration: 8000 })
      setRegStep(2)
    } catch {
      toast.error('Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const verifyRegOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Step A: verify the OTP
      const verifyRes = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: regPhone, code: regOtp, purpose: 'REGISTER' }),
      })
      const verifyData = await verifyRes.json()
      if (!verifyRes.ok) {
        toast.error(verifyData.error || 'OTP verification failed')
        return
      }
      // Step B: create the account
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          phone: regPhone,
          email: regEmail || undefined,
          password: regPassword,
          role: regRole,
          storeName: regStoreName || undefined,
          otpVerified: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Registration failed')
        setRegStep(1)
        return
      }
      setUser(data.user)
      toast.success('Account created & phone verified!')
      handleClose()
      await refreshCart()
      if (regRole === 'RETAILER') {
        navigate({ name: 'dashboard' })
      }
    } catch {
      toast.error('Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fpIdentifier.trim()) {
      toast.error('Please enter your phone or email')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneOrEmail: fpIdentifier }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to send OTP')
        if (data.cooldownSeconds) setFpCooldown(data.cooldownSeconds)
        return
      }
      if (data.code) {
        toast.success(`OTP sent! Demo code: ${data.code}`, { duration: 8000 })
      } else {
        toast.info(data.message || 'If the account exists, an OTP has been sent.')
      }
      if (data.phone) setFpMaskedPhone(data.phone)
      setFpStep(2)
    } catch {
      toast.error('Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneOrEmail: fpIdentifier,
          code: fpOtp,
          newPassword: fpNewPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Password reset failed')
        return
      }
      toast.success('Password reset successfully! Please login with your new password.')
      handleClose()
      setMode('login')
    } catch {
      toast.error('Password reset failed')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (role: 'admin' | 'retailer' | 'customer') => {
    const creds = {
      admin: { id: `admin@${BRAND.demoEmailDomain}`, password: 'admin123' },
      retailer: { id: '+8801700000002', password: 'retailer123' },
      customer: { id: '+8801700000004', password: 'customer123' },
    }[role]
    setLoginIdentifier(creds.id)
    setLoginPassword(creds.password)
  }

  const open = authModal !== null
  const dialogMode = mode === 'forgot' ? 'forgot' : authModal === 'register' ? 'register' : 'login'

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose()
      }}
    >
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sky-600">
            {dialogMode === 'forgot' ? 'Reset Password' : `Welcome to ${BRAND.name}`}
          </DialogTitle>
          <DialogDescription>
            {dialogMode === 'forgot'
              ? 'Verify your phone to set a new password'
              : 'Sign in or create a new account'}
          </DialogDescription>
        </DialogHeader>

        {/* FORGOT PASSWORD FLOW */}
        {dialogMode === 'forgot' ? (
          <div className="space-y-3 mt-2">
            {/* Step indicator */}
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <div className={`flex items-center gap-1 ${fpStep >= 1 ? 'text-sky-600' : ''}`}>
                <span className={`rounded-full w-5 h-5 flex items-center justify-center ${fpStep >= 1 ? 'bg-sky-600 text-white' : 'bg-gray-200'}`}>1</span>
                Identify
              </div>
              <div className="flex-1 border-t border-gray-200" />
              <div className={`flex items-center gap-1 ${fpStep >= 2 ? 'text-sky-600' : ''}`}>
                <span className={`rounded-full w-5 h-5 flex items-center justify-center ${fpStep >= 2 ? 'bg-sky-600 text-white' : 'bg-gray-200'}`}>2</span>
                Verify
              </div>
              <div className="flex-1 border-t border-gray-200" />
              <div className={`flex items-center gap-1 ${fpStep >= 3 ? 'text-sky-600' : ''}`}>
                <span className={`rounded-full w-5 h-5 flex items-center justify-center ${fpStep >= 3 ? 'bg-sky-600 text-white' : 'bg-gray-200'}`}>3</span>
                Reset
              </div>
            </div>

            {fpStep === 1 && (
              <form onSubmit={handleForgotSendOtp} className="space-y-3">
                <div>
                  <Label htmlFor="fp-id">Phone Number or Email</Label>
                  <Input
                    id="fp-id"
                    value={fpIdentifier}
                    onChange={(e) => setFpIdentifier(e.target.value)}
                    required
                    placeholder="01XXXXXXXXX or you@example.com"
                    autoFocus
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    We'll send an OTP to the phone number associated with this account.
                  </p>
                </div>
                <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white" disabled={loading || fpCooldown > 0}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {fpCooldown > 0 ? `Resend in ${fpCooldown}s` : 'Send OTP'}
                </Button>
                <button
                  type="button"
                  onClick={() => { handleClose(); setMode('login') }}
                  className="w-full text-xs text-sky-600 hover:underline"
                >
                  ← Back to Login
                </button>
              </form>
            )}

            {fpStep === 2 && (
              <form
                onSubmit={(e) => { e.preventDefault(); setFpStep(3) }}
                className="space-y-3"
              >
                <div>
                  <Label htmlFor="fp-otp">OTP Code{fpMaskedPhone && ` (sent to ${fpMaskedPhone})`}</Label>
                  <Input
                    id="fp-otp"
                    value={fpOtp}
                    onChange={(e) => setFpOtp(e.target.value)}
                    required
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit code"
                    className="text-lg tracking-widest text-center"
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white" disabled={loading}>
                  Verify OTP
                </Button>
                <button
                  type="button"
                  onClick={handleForgotSendOtp}
                  disabled={fpCooldown > 0}
                  className="w-full text-xs text-sky-600 hover:underline disabled:opacity-50"
                >
                  {fpCooldown > 0 ? `Resend OTP in ${fpCooldown}s` : 'Resend OTP'}
                </button>
              </form>
            )}

            {fpStep === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div>
                  <Label htmlFor="fp-newpass">New Password</Label>
                  <Input
                    id="fp-newpass"
                    type="password"
                    value={fpNewPassword}
                    onChange={(e) => setFpNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Reset Password
                </Button>
              </form>
            )}
          </div>
        ) : (
          /* LOGIN / REGISTER TABS */
          <Tabs defaultValue={dialogMode === 'register' ? 'register' : 'login'} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" onClick={() => setMode('login')}>Login</TabsTrigger>
              <TabsTrigger value="register" onClick={() => { setMode('register'); setRegStep(1) }}>Register</TabsTrigger>
            </TabsList>

            {/* LOGIN */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-3 mt-2">
                <div>
                  <Label htmlFor="lpid">Phone Number or Email</Label>
                  <Input
                    id="lpid"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    required
                    placeholder="01XXXXXXXXX or you@example.com"
                    autoComplete="username"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="lpass">Password</Label>
                    <button
                      type="button"
                      onClick={() => { resetForms(); setMode('forgot'); setFpStep(1) }}
                      className="text-xs text-sky-600 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    id="lpass"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Login
                </Button>

                {/* Demo accounts */}
                <div className="border-t pt-3 mt-3">
                  <p className="text-xs text-gray-500 mb-2 text-center">Try a demo account:</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => fillDemo('admin')}>Admin</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => fillDemo('retailer')}>Retailer</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => fillDemo('customer')}>Customer</Button>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2 text-center">
                    Click a role to autofill, then click Login.
                  </p>
                </div>
              </form>
            </TabsContent>

            {/* REGISTER — TWO STEPS */}
            <TabsContent value="register">
              {/* Step indicator */}
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3 mt-2">
                <div className={`flex items-center gap-1 ${regStep >= 1 ? 'text-sky-600' : ''}`}>
                  <span className={`rounded-full w-5 h-5 flex items-center justify-center ${regStep >= 1 ? 'bg-sky-600 text-white' : 'bg-gray-200'}`}>1</span>
                  Details
                </div>
                <div className="flex-1 border-t border-gray-200" />
                <div className={`flex items-center gap-1 ${regStep >= 2 ? 'text-sky-600' : ''}`}>
                  <span className={`rounded-full w-5 h-5 flex items-center justify-center ${regStep >= 2 ? 'bg-sky-600 text-white' : 'bg-gray-200'}`}>2</span>
                  Verify OTP
                </div>
              </div>

              {regStep === 1 && (
                <form
                  onSubmit={(e) => { e.preventDefault(); sendRegOtp() }}
                  className="space-y-3"
                >
                  <div>
                    <Label htmlFor="rname">Full Name *</Label>
                    <Input id="rname" value={regName} onChange={(e) => setRegName(e.target.value)} required placeholder="Your name" />
                  </div>
                  <div>
                    <Label htmlFor="rphone">Phone Number *</Label>
                    <Input
                      id="rphone"
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      required
                      placeholder="01XXXXXXXXX (used to login)"
                      autoComplete="tel"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">An OTP will be sent to this number.</p>
                  </div>
                  <div>
                    <Label htmlFor="remail">Email (optional)</Label>
                    <Input
                      id="remail"
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="you@example.com (optional)"
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rpass">Password *</Label>
                    <Input
                      id="rpass"
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="Min 6 characters"
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <Label>Account Type</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={regRole === 'CUSTOMER' ? 'default' : 'outline'}
                        onClick={() => setRegRole('CUSTOMER')}
                        className={regRole === 'CUSTOMER' ? 'bg-sky-600 text-white' : ''}
                      >
                        Customer
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={regRole === 'RETAILER' ? 'default' : 'outline'}
                        onClick={() => setRegRole('RETAILER')}
                        className={regRole === 'RETAILER' ? 'bg-sky-600 text-white' : ''}
                      >
                        Retailer / Seller
                      </Button>
                    </div>
                  </div>
                  {regRole === 'RETAILER' && (
                    <div>
                      <Label htmlFor="rstore">Store Name *</Label>
                      <Input id="rstore" value={regStoreName} onChange={(e) => setRegStoreName(e.target.value)} required placeholder="Your store name" />
                    </div>
                  )}
                  <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    <Phone className="h-4 w-4 mr-2" /> Send OTP
                  </Button>
                </form>
              )}

              {regStep === 2 && (
                <form onSubmit={verifyRegOtp} className="space-y-3">
                  <div className="bg-sky-50 border border-sky-200 p-3 rounded text-sm text-sky-800 flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      Enter the 6-digit code sent to <strong>{regPhone}</strong>.
                      In demo mode the code is shown in the toast notification above.
                    </span>
                  </div>
                  <div>
                    <Label htmlFor="r-otp">OTP Code</Label>
                    <Input
                      id="r-otp"
                      value={regOtp}
                      onChange={(e) => setRegOtp(e.target.value)}
                      required
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="6-digit code"
                      className="text-lg tracking-widest text-center"
                      autoFocus
                    />
                  </div>
                  <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    <KeyRound className="h-4 w-4 mr-2" /> Verify & Create Account
                  </Button>
                  <div className="flex justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => setRegStep(1)}
                      className="text-gray-500 hover:underline"
                    >
                      ← Edit details
                    </button>
                    <button
                      type="button"
                      onClick={sendRegOtp}
                      disabled={regCooldown > 0 || loading}
                      className="text-sky-600 hover:underline disabled:opacity-50"
                    >
                      {regCooldown > 0 ? `Resend in ${regCooldown}s` : 'Resend OTP'}
                    </button>
                  </div>
                </form>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
