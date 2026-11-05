import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { generateOAuthState, getBaseAppUrl } from '@/lib/oauth'

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const appUrl = getBaseAppUrl(req)
  const redirectUri = `${appUrl}/api/auth/google/callback`

  const state = generateOAuthState()
  const cookieStore = await cookies()

  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  })

  // If credentials are configured in .env, redirect to real Google OAuth
  if (clientId && clientSecret) {
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    googleAuthUrl.searchParams.set('client_id', clientId)
    googleAuthUrl.searchParams.set('redirect_uri', redirectUri)
    googleAuthUrl.searchParams.set('response_type', 'code')
    googleAuthUrl.searchParams.set('scope', 'openid email profile')
    googleAuthUrl.searchParams.set('state', state)
    googleAuthUrl.searchParams.set('access_type', 'online')
    googleAuthUrl.searchParams.set('prompt', 'select_account')

    return NextResponse.redirect(googleAuthUrl.toString())
  }

  // If credentials are not yet configured in .env, redirect to OAuth guide / dev sandbox
  return NextResponse.redirect(`${appUrl}/api/auth/oauth-dev-notice?provider=google&state=${state}`)
}

