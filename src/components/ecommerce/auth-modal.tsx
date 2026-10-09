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

  // login form
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // register form
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regRole, setRegRole] = useState<'CUSTOMER' | 'RETAILER'>('CUSTOMER')
  const [regStoreName, setRegStoreName] = useState('')
  const [regPhone, setRegPhone] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
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
          email: regEmail,
          password: regPassword,
          role: regRole,
          phone: regPhone,
          storeName: regStoreName,
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
      admin: { email: 'admin@daraz.local', password: 'admin123' },
      retailer: { email: 'retailer@daraz.local', password: 'retailer123' },
      customer: { email: 'customer@daraz.local', password: 'customer123' },
    }[role]
    setLoginEmail(creds.email)
    setLoginPassword(creds.password)
  }

  return (
    <Dialog open={authModal !== null} onOpenChange={(o) => !o && closeAuth()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-orange-600">Welcome to Daraz</DialogTitle>
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
                <Label htmlFor="lemail">Email</Label>
                <Input
                  id="lemail"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
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
                />
              </div>
              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white" disabled={loading}>
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
                <Label htmlFor="rname">Full Name</Label>
                <Input id="rname" value={regName} onChange={(e) => setRegName(e.target.value)} required placeholder="Your name" />
              </div>
              <div>
                <Label htmlFor="remail">Email</Label>
                <Input id="remail" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required placeholder="you@example.com" />
              </div>
              <div>
                <Label htmlFor="rpass">Password</Label>
                <Input id="rpass" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" />
              </div>
              <div>
                <Label htmlFor="rphone">Phone (optional)</Label>
                <Input id="rphone" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="+8801XXXXXXXXX" />
              </div>
              <div>
                <Label>Account Type</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={regRole === 'CUSTOMER' ? 'default' : 'outline'}
                    onClick={() => setRegRole('CUSTOMER')}
                    className={regRole === 'CUSTOMER' ? 'bg-orange-600 text-white' : ''}
                  >
                    Customer
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={regRole === 'RETAILER' ? 'default' : 'outline'}
                    onClick={() => setRegRole('RETAILER')}
                    className={regRole === 'RETAILER' ? 'bg-orange-600 text-white' : ''}
                  >
                    Retailer / Seller
                  </Button>
                </div>
              </div>
              {regRole === 'RETAILER' && (
                <div>
                  <Label htmlFor="rstore">Store Name</Label>
                  <Input id="rstore" value={regStoreName} onChange={(e) => setRegStoreName(e.target.value)} required placeholder="Your store name" />
                </div>
              )}
              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Account
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
