import { NextRequest } from 'next/server'
import { BRAND } from '@/lib/brand'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const provider = searchParams.get('provider') || 'google'
  const state = searchParams.get('state') || ''
  const isGoogle = provider === 'google'

  const title = isGoogle ? 'Google OAuth 2.0 Setup' : 'Facebook Login OAuth Setup'
  const providerName = isGoogle ? 'Google' : 'Facebook'
  const envVars = isGoogle
    ? `GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"\nGOOGLE_CLIENT_SECRET="your_google_client_secret"`
    : `FACEBOOK_APP_ID="your_facebook_app_id"\nFACEBOOK_APP_SECRET="your_facebook_app_secret"`

  const callbackUrl = isGoogle
    ? `http://localhost:3000/api/auth/google/callback`
    : `http://localhost:3000/api/auth/facebook/callback`

  const testCallbackUrl = isGoogle
    ? `/api/auth/google/callback?sandbox=true&state=${state}&name=Google+Demo+User&email=google.shopper@gmail.com`
    : `/api/auth/facebook/callback?sandbox=true&state=${state}&name=Facebook+Demo+User&email=fb.shopper@facebook.com`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${BRAND.name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-800 font-sans min-h-screen flex items-center justify-center p-4">
  <div class="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
    <!-- Header -->
    <div class="bg-gradient-to-r from-[#0284C7] to-[#38BDF8] p-6 text-white text-center">
      <div class="inline-flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur rounded-2xl mb-3">
        ${
          isGoogle
            ? `<svg class="w-8 h-8" viewBox="0 0 24 24"><path fill="#FFFFFF" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#FFFFFF" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FFFFFF" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#FFFFFF" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>`
            : `<svg class="w-8 h-8 fill-white" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`
        }
      </div>
      <h1 class="text-xl font-bold">${title}</h1>
      <p class="text-xs text-sky-100 mt-1">Real OAuth architecture is fully implemented and waiting for your provider keys.</p>
    </div>

    <!-- Body -->
    <div class="p-6 space-y-5">
      <div class="bg-sky-50 border border-sky-200 rounded-xl p-4 text-xs text-sky-900 space-y-2">
        <div class="font-bold text-sky-950 flex items-center gap-1.5">
          <span>🚀</span> Ready for Production Credentials
        </div>
        <p>The code is ready to connect to ${providerName}'s live authorization servers. To enable live login for users, add these two environment variables to your <code class="bg-white px-1.5 py-0.5 rounded font-mono text-sky-700 font-bold">.env</code> file:</p>
        <pre class="bg-slate-900 text-sky-200 p-3 rounded-lg font-mono text-[11px] overflow-x-auto">${envVars}</pre>
      </div>

      <div class="space-y-2 text-xs text-slate-600">
        <div class="font-semibold text-slate-800">Authorized Redirect URI to set in ${providerName} Console:</div>
        <div class="bg-slate-100 p-2.5 rounded-lg font-mono text-[11px] text-slate-700 select-all border border-slate-200">
          ${callbackUrl}
        </div>
      </div>

      <!-- Action buttons -->
      <div class="pt-3 border-t border-slate-100 space-y-2.5">
        <a href="${testCallbackUrl}"
           class="w-full flex items-center justify-center gap-2 bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition shadow-sm">
          <span>⚡</span> Verify OAuth Flow &amp; Sign In with Test Profile
        </a>
        <a href="/login"
           class="w-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded-xl text-xs transition">
          Return to Login Page
        </a>
      </div>
    </div>
  </div>
</body>
</html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

