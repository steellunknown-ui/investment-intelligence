import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { hashIdNumber } from '@/lib/aadhaar'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { access_token, nominee_phone, aadhaar, pan } = body

        if (!access_token || !nominee_phone) {
            return NextResponse.json({ error: 'Access token and Phone Number are required' }, { status: 400 })
        }

        const supabase = createSupabaseServerClient()

        // 1. Verify token & nominee existence
        const { data: nominee, error: nomineeError } = await supabase
            .from('nominees')
            .select(`
                *,
                inactivity_tracker!inner(nominee_triggered)
            `)
            .eq('id', access_token)
            .single()

        if (nomineeError || !nominee) {
            return NextResponse.json({ error: 'Invalid access link' }, { status: 404 })
        }

        // Must be in Stage 4 triggered mode to login 
        if (!nominee.inactivity_tracker.nominee_triggered) {
            return NextResponse.json({ error: 'Access is not currently enabled for this portfolio.' }, { status: 403 })
        }

        // 2. Check if blocked
        if (nominee.is_blocked) {
            const blockedUntil = new Date(nominee.blocked_until)
            if (new Date() < blockedUntil) {
                return NextResponse.json({
                    error: 'Account temporarily blocked due to too many failed attempts. Please contact the administrator.',
                    is_blocked: true
                }, { status: 403 })
            } else {
                // Block expired, reset counters
                await supabase.from('nominees').update({ is_blocked: false, failed_attempts: 0, blocked_until: null }).eq('id', nominee.id)
                nominee.failed_attempts = 0
                nominee.is_blocked = false
            }
        }

        // 3. Verify Identity
        let isValid = false;

        switch (nominee.verification_method) {
            case 'phone_aadhaar':
                if (!aadhaar) return NextResponse.json({ error: 'Aadhaar Number is required' }, { status: 400 })
                isValid = (nominee.nominee_phone === nominee_phone && nominee.aadhaar_hash === hashIdNumber(aadhaar));
                break;
            case 'phone_pan_email':
                if (!pan) return NextResponse.json({ error: 'PAN Number is required' }, { status: 400 })
                isValid = (nominee.nominee_phone === nominee_phone && nominee.pan_hash === hashIdNumber(pan));
                break;
            case 'phone_only':
            default:
                isValid = (nominee.nominee_phone === nominee_phone);
                break;
        }

        // 4. Handle Failure (Record Attempt / Block)
        if (!isValid) {
            const newAttempts = (nominee.failed_attempts || 0) + 1;
            const updates: any = { failed_attempts: newAttempts };

            // max 3 attempts
            if (newAttempts >= 3) {
                updates.is_blocked = true;
                // Block for 24 hours
                const tomorrow = new Date();
                tomorrow.setHours(tomorrow.getHours() + 24);
                updates.blocked_until = tomorrow.toISOString();
            }

            await supabase.from('nominees').update(updates).eq('id', nominee.id);

            return NextResponse.json({
                error: updates.is_blocked
                    ? 'Maximum attempts reached. Account blocked for security.'
                    : 'Invalid verification details provided.'
            }, { status: 401 })
        }

        // 5. Success - Reset attempts and Create Session!
        await supabase.from('nominees').update({ failed_attempts: 0 }).eq('id', nominee.id);

        // Setup nominee session token in database (using pre-existing DB migration structure)
        const sessionToken = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 12); // 12 hour session

        const { error: sessionError } = await supabase.from('nominee_sessions').insert({
            nominee_id: nominee.id,
            user_id: nominee.user_id,
            session_token: sessionToken,
            expires_at: expiresAt.toISOString(),
            is_active: true
        });

        if (sessionError) throw sessionError

        // Note: Realistically we'd set an HTTP-Only cookie here with the `sessionToken`
        // For standard localstorage usage in this build, we return it.
        return NextResponse.json({
            success: true,
            message: 'Identity Verified',
            session_token: sessionToken,
            redirect: `/nominee-dashboard/${sessionToken}`
        })

    } catch (error) {
        console.error('Nominee access verification logic error:', error)
        return NextResponse.json({ error: 'Internal server error processing access request' }, { status: 500 })
    }
}
