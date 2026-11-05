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
    return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent('Facebook login was cancelled')}`)
  }

  const cookieStore = await cookies()
  const savedState = cookieStore.get('fb_oauth_state')?.value

  // Verify state
  if (!state || !savedState || state !== savedState) {
    return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent('Invalid OAuth state. Please try again.')}`)
  }

  // Clear state cookie
  cookieStore.delete('fb_oauth_state')

  try {
    let profileData = {
      id: '',
      email: '',
      name: '',
      picture: '',
    }

    if (isDevSandbox) {
      // Sandbox test profile for testing without Facebook App credentials
      profileData = {
        id: `fb_demo_${Date.now()}`,
        email: searchParams.get('email') || `fb.shopper.${Date.now().toString().slice(-4)}@facebook.com`,
        name: searchParams.get('name') || 'Facebook Verified Shopper',
        picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
      }
    } else {
      // Real Facebook OAuth Token Exchange
      const appId = process.env.FACEBOOK_APP_ID || process.env.FACEBOOK_CLIENT_ID
      const appSecret = process.env.FACEBOOK_APP_SECRET || process.env.FACEBOOK_CLIENT_SECRET
      const redirectUri = `${appUrl}/api/auth/facebook/callback`

      if (!appId || !appSecret || !code) {
        return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent('Missing Facebook credentials or authorization code')}`)
      }

      const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token')
      tokenUrl.searchParams.set('client_id', appId)
      tokenUrl.searchParams.set('client_secret', appSecret)
      tokenUrl.searchParams.set('redirect_uri', redirectUri)
      tokenUrl.searchParams.set('code', code)

      const tokenRes = await fetch(tokenUrl.toString())
      if (!tokenRes.ok) {
        const errText = await tokenRes.text()
        console.error('Facebook token exchange failed:', errText)
        return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent('Failed to verify with Facebook')}`)
      }

      const tokenData = await tokenRes.json()
      const accessToken = tokenData.access_token

      // Fetch user profile from Graph API
      const profileUrl = new URL('https://graph.facebook.com/me')
      profileUrl.searchParams.set('fields', 'id,name,email,picture.type(large)')
      profileUrl.searchParams.set('access_token', accessToken)

      const userRes = await fetch(profileUrl.toString())
      if (!userRes.ok) {
        return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent('Failed to fetch Facebook profile')}`)
      }

      const fbUser = await userRes.json()
      profileData = {
        id: fbUser.id,
        email: fbUser.email,
        name: fbUser.name || 'Facebook User',
        picture: fbUser.picture?.data?.url || '',
      }
    }

    // Find or create user in database
    const user = await findOrCreateOAuthUser({
      provider: 'facebook',
      providerId: profileData.id,
      email: profileData.email,
      name: profileData.name,
      avatar: profileData.picture,
    })

    // Issue JWT session and set HttpOnly session cookie
    await completeOAuthLogin(user)

    return NextResponse.redirect(`${appUrl}/?oauth_login=success&provider=facebook`)
  } catch (err) {
    console.error('Facebook OAuth callback error:', err)
    return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`)
  }
}

