import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/src/lib/supabase/admin';

// POST /api/jobs/check-inactivity
// Logic: 
// 1. Fetch enabled configs
// 2. Check inactivity threshold
// 3. Send alerts/trigger access
export async function POST(request: Request) {
    // 1. Verify Secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 2. Fetch all enabled + active configs
        // We need profiles too if we were sending emails, but for alerts just user_id is enough.
        const { data: configs, error } = await supabaseAdmin
            .from('inactivity_config')
            .select('user_id, inactivity_days, last_activity_at, warning_sent_at, triggered_at')
            .eq('enabled', true)
            .not('last_activity_at', 'is', null);

        if (error) {
            console.error('Job error fetching configs:', error);
            return NextResponse.json({ error: 'DB Error' }, { status: 500 });
        }

        if (!configs || configs.length === 0) {
            return NextResponse.json({ message: 'No active configs to check' });
        }

        const now = new Date();
        const results = {
            warnings_sent: 0,
            triggered: 0,
            errors: 0
        };

        // 3. Iterate and check
        for (const config of configs) {
            if (!config.last_activity_at) continue;

            const lastActivity = new Date(config.last_activity_at);
            const diffTime = Math.abs(now.getTime() - lastActivity.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            // Using ceil to be conservative? Or floor? Usually days passed. 
            // If 1.5 days have passed, is it 1 or 2? 
            // Let's use exact difference in ms compared to days*ms.

            const dayInMs = 1000 * 60 * 60 * 24;
            const daysInactive = (now.getTime() - lastActivity.getTime()) / dayInMs;

            const limit = config.inactivity_days; // e.g. 30

            try {
                // CONDITION 1: Access Triggered
                if (daysInactive >= limit && !config.triggered_at) {
                    // Trigger access!
                    await supabaseAdmin
                        .from('inactivity_config')
                        .update({ triggered_at: now.toISOString() })
                        .eq('user_id', config.user_id);

                    await supabaseAdmin
                        .from('alerts')
                        .insert({
                            user_id: config.user_id,
                            type: 'security',
                            title: 'Nominee access triggered',
                            message: `Your account has been inactive for ${limit} days. Nominee access has been enabled.`
                        });

                    // Generate access tokens for each nominee
                    const { data: nominees } = await supabaseAdmin
                        .from('nominees')
                        .select('id, name')
                        .eq('user_id', config.user_id)
                        .limit(3);

                    if (nominees && nominees.length > 0) {
                        const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

                        for (const nominee of nominees) {
                            // Check if active token already exists
                            const { data: existingToken } = await supabaseAdmin
                                .from('nominee_access_tokens')
                                .select('id')
                                .eq('user_id', config.user_id)
                                .eq('nominee_id', nominee.id)
                                .gt('expires_at', now.toISOString())
                                .limit(1)
                                .single();

                            if (existingToken) {
                                // Skip - active token already exists
                                continue;
                            }

                            // Generate 32-byte crypto-random token (64 hex chars)
                            const tokenBytes = new Uint8Array(32);
                            crypto.getRandomValues(tokenBytes);
                            const token = Array.from(tokenBytes)
                                .map(b => b.toString(16).padStart(2, '0'))
                                .join('');

                            await supabaseAdmin
                                .from('nominee_access_tokens')
                                .insert({
                                    user_id: config.user_id,
                                    nominee_id: nominee.id,
                                    token,
                                    expires_at: expiresAt.toISOString()
                                });

                            await supabaseAdmin
                                .from('alerts')
                                .insert({
                                    user_id: config.user_id,
                                    type: 'info',
                                    title: 'Nominee access link generated',
                                    message: `Access link generated for nominee: ${nominee.name}`
                                });
                        }
                    }

                    results.triggered++;
                }
                // CONDITION 2: Warning (2 days before)
                else if (daysInactive >= (limit - 2) && !config.warning_sent_at && !config.triggered_at) {
                    // Send warning
                    await supabaseAdmin
                        .from('inactivity_config')
                        .update({ warning_sent_at: now.toISOString() })
                        .eq('user_id', config.user_id);

                    await supabaseAdmin
                        .from('alerts')
                        .insert({
                            user_id: config.user_id,
                            type: 'warning',
                            title: 'Inactivity warning',
                            message: `Your account has been inactive. Login within 2 days to prevent nominee access.`
                        });

                    results.warnings_sent++;
                }
            } catch (err) {
                console.error(`Error processing user ${config.user_id}:`, err);
                results.errors++;
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error('Job internal error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
