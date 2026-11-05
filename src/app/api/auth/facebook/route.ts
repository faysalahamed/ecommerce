import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { generateOAuthState, getBaseAppUrl } from '@/lib/oauth'

export async function GET(req: NextRequest) {
  const appId = process.env.FACEBOOK_APP_ID || process.env.FACEBOOK_CLIENT_ID
  const appSecret = process.env.FACEBOOK_APP_SECRET || process.env.FACEBOOK_CLIENT_SECRET
  const appUrl = getBaseAppUrl(req)
  const redirectUri = `${appUrl}/api/auth/facebook/callback`

  const state = generateOAuthState()
  const cookieStore = await cookies()

  cookieStore.set('fb_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  })

  // If credentials are configured in .env, redirect to real Facebook OAuth dialog
  if (appId && appSecret) {
    const fbAuthUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth')
    fbAuthUrl.searchParams.set('client_id', appId)
    fbAuthUrl.searchParams.set('redirect_uri', redirectUri)
    fbAuthUrl.searchParams.set('scope', 'email,public_profile')
    fbAuthUrl.searchParams.set('state', state)

    return NextResponse.redirect(fbAuthUrl.toString())
  }

  // If credentials are not yet configured in .env, redirect to OAuth guide / dev sandbox
  return NextResponse.redirect(`${appUrl}/api/auth/oauth-dev-notice?provider=facebook&state=${state}`)
}

