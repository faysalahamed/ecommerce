'use client'

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { useStore } from '@/lib/store'
import { LoginView } from '@/components/views/login-view'

export function AuthModal() {
  const { authModal, closeAuth } = useStore()

  return (
    <Dialog open={Boolean(authModal)} onOpenChange={(open) => { if (!open) closeAuth() }}>
      <DialogContent className="max-w-4xl p-0 border-0 bg-transparent shadow-none overflow-hidden sm:max-w-4xl">
        <DialogTitle className="sr-only">Authentication - Sign In or Register</DialogTitle>
        {authModal && (
          <LoginView
            initialMode={authModal === 'register' ? 'register' : 'login'}
            isModal={true}
            onSuccess={closeAuth}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
