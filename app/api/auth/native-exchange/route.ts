import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function timeoutSignal(timeoutMs: number) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId),
  }
}

export async function POST(request: Request) {
  try {
    const { code, codeVerifier } = await request.json().catch(() => ({}))

    if (!code || !codeVerifier) {
      return NextResponse.json(
        { error: 'Missing OAuth code or verifier' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Missing Supabase auth config' },
        { status: 500 }
      )
    }

    const timeout = timeoutSignal(12000)

    let response: Response
    try {
      response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=pkce`, {
        method: 'POST',
        signal: timeout.signal,
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_code: code,
          code_verifier: codeVerifier,
        }),
      })
    } catch (error: any) {
      const message = error?.name === 'AbortError'
        ? 'Supabase token exchange timed out'
        : 'Supabase token exchange failed'

      return NextResponse.json({ error: message }, { status: 504 })
    } finally {
      timeout.cleanup()
    }

    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      return NextResponse.json(
        {
          error: payload.error_description || payload.msg || payload.error || 'Google login handshake failed',
        },
        { status: response.status }
      )
    }

    if (!payload.access_token || !payload.refresh_token || !payload.user) {
      return NextResponse.json(
        { error: 'Supabase did not return a valid session' },
        { status: 502 }
      )
    }

    const session = {
      ...payload,
      expires_at: payload.expires_at || Math.round(Date.now() / 1000) + (payload.expires_in || 3600),
    }

    return NextResponse.json({
      session,
      user: payload.user,
    })
  } catch (error) {
    console.error('[Native Exchange] Fatal error:', error)
    return NextResponse.json(
      { error: 'Native OAuth exchange failed' },
      { status: 500 }
    )
  }
}
