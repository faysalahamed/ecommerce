'use client'

import { useState } from 'react'
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
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function AuthModal() {
  const { authModal, closeAuth, setUser, refreshCart, navigate } = useStore()
  const [loading, setLoading] = useState(false)

  // login form — accepts phone OR email
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // register form
  const [regName, setRegName] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regRole, setRegRole] = useState<'CUSTOMER' | 'RETAILER'>('CUSTOMER')
  const [regStoreName, setRegStoreName] = useState('')

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
      closeAuth()
      await refreshCart()
    } catch {
      toast.error('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
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
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Registration failed')
        return
      }
      setUser(data.user)
      toast.success('Account created successfully')
      closeAuth()
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

  const fillDemo = (role: 'admin' | 'retailer' | 'customer') => {
    const creds = {
      admin: { id: 'admin@daraz.local', password: 'admin123' },
      retailer: { id: '+8801700000002', password: 'retailer123' },
      customer: { id: '+8801700000004', password: 'customer123' },
    }[role]
    setLoginIdentifier(creds.id)
    setLoginPassword(creds.password)
  }

  return (
    <Dialog open={authModal !== null} onOpenChange={(o) => !o && closeAuth()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sky-600">Welcome to Daraz</DialogTitle>
          <DialogDescription>Sign in or create a new account</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={authModal === 'register' ? 'register' : 'login'} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
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
                <Label htmlFor="lpass">Password</Label>
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
                  <Button type="button" size="sm" variant="outline" onClick={() => fillDemo('admin')}>
                    Admin
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => fillDemo('retailer')}>
                    Retailer
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => fillDemo('customer')}>
                    Customer
                  </Button>
                </div>
                <p className="text-[11px] text-gray-400 mt-2 text-center">
                  Click a role to autofill, then click Login.
                </p>
              </div>
            </form>
          </TabsContent>

          {/* REGISTER */}
          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-3 mt-2">
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
                <p className="text-[11px] text-gray-500 mt-1">You can use this phone to login.</p>
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
                Create Account
              </Button>
              <p className="text-[11px] text-gray-500 text-center">
                Your phone number is your account ID. Email is optional.
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
