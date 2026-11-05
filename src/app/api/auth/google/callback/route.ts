import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getBaseAppUrl, findOrCreateOAuthUser, completeOAuthLogin } from '@/lib/oauth'

export async function GET(req: NextRequest) {
  const appUrl = getBaseAppUrl(req)
  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const isDevSandbox = searchParams.get('sandbox') === 'true'

  if (error) {
    return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent('Google login was cancelled')}`)
  }

  const cookieStore = await cookies()
  const savedState = cookieStore.get('oauth_state')?.value

  // Verify state
  if (!state || !savedState || state !== savedState) {
    return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent('Invalid OAuth state. Please try again.')}`)
  }

  // Clear state cookie
  cookieStore.delete('oauth_state')

  try {
    let profileData = {
      sub: '',
      email: '',
      name: '',
      picture: '',
    }

    if (isDevSandbox) {
      // Sandbox test profile for testing without Google Cloud credentials
      profileData = {
        sub: `google_demo_${Date.now()}`,
        email: searchParams.get('email') || `google.user.${Date.now().toString().slice(-4)}@gmail.com`,
        name: searchParams.get('name') || 'Google Verified Shopper',
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      }
    } else {
      // Real Google OAuth Token Exchange
      const clientId = process.env.GOOGLE_CLIENT_ID
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET
      const redirectUri = `${appUrl}/api/auth/google/callback`

      if (!clientId || !clientSecret || !code) {
        return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent('Missing Google credentials or authorization code')}`)
      }

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      })

      if (!tokenRes.ok) {
        const errText = await tokenRes.text()
        console.error('Google token exchange failed:', errText)
        return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent('Failed to verify with Google')}`)
      }

      const tokenData = await tokenRes.json()
      const accessToken = tokenData.access_token

      // Fetch user profile from Google UserInfo endpoint
      const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!userRes.ok) {
        return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent('Failed to fetch Google profile')}`)
      }

      const googleUser = await userRes.json()
      profileData = {
        sub: googleUser.sub,
        email: googleUser.email,
        name: googleUser.name || 'Google User',
        picture: googleUser.picture || '',
      }
    }

    // Find or create user in database
    const user = await findOrCreateOAuthUser({
      provider: 'google',
      providerId: profileData.sub,
      email: profileData.email,
      name: profileData.name,
      avatar: profileData.picture,
    })

    // Issue JWT session and set HttpOnly session cookie
    await completeOAuthLogin(user)

    return NextResponse.redirect(`${appUrl}/?oauth_login=success&provider=google`)
  } catch (err) {
    console.error('Google OAuth callback error:', err)
    return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`)
  }
}

