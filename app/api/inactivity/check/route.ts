import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

/**
 * GET /api/inactivity/check
 * 
 * Cron-secured endpoint that checks all users for inactivity
 * and sets reminder stage flags accordingly.
 * 
 * Secured with CRON_SECRET header.
 * 
 * Testing mode: stages at 5/10/15/20 MINUTES
 * Production mode: stages at 15/30/45/60 DAYS (or custom per user)
 */
export async function GET(request: Request) {
    try {
        // Verify cron secret
        const authHeader = request.headers.get('authorization')
        const cronSecret = process.env.CRON_SECRET

        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Use service role for cross-user operations
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json(
                { error: 'Missing Supabase configuration' },
                { status: 500 }
            )
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey)

        // 1. Fetch system config
        const { data: configRows, error: configError } = await supabase
            .from('system_config')
            .select('key, value')

        if (configError) {
            console.error('Failed to fetch system config:', configError)
            return NextResponse.json(
                { error: 'Failed to fetch config' },
                { status: 500 }
            )
        }

        const config: Record<string, string> = {}
        configRows?.forEach(row => {
            config[row.key] = row.value
        })

        const timeUnit = config['TIME_UNIT'] || 'minutes'
        const isMinutes = timeUnit === 'minutes'

        const stage1 = parseInt(config['INACTIVITY_STAGE_1'] || (isMinutes ? '5' : '15'))
        const stage2 = parseInt(config['INACTIVITY_STAGE_2'] || (isMinutes ? '10' : '30'))
        const stage3 = parseInt(config['INACTIVITY_STAGE_3'] || (isMinutes ? '15' : '45'))
        const stage4 = parseInt(config['INACTIVITY_STAGE_4'] || (isMinutes ? '20' : '60'))

        // 2. Fetch all users and their emails (from auth schema if possible, or we might need a join or separate fetch)
        // Since we are in a cron job with service role, we can fetch from inactivity_tracker
        const { data: trackers, error: trackerError } = await supabase
            .from('inactivity_tracker')
            .select(`*`)

        if (trackerError) {
            console.error('Failed to fetch trackers:', trackerError)
            return NextResponse.json(
                { error: 'Failed to fetch trackers' },
                { status: 500 }
            )
        }

        if (!trackers || trackers.length === 0) {
            return NextResponse.json({
                message: 'No users to check',
                processed: 0
            })
        }

        const now = new Date()
        const results: Array<{
            user_id: string
            inactive_time: number
            unit: string
            stage_triggered: string | null
        }> = []

        // 3. Process each user
        for (const tracker of trackers) {
            const lastLogin = new Date(tracker.last_login_at)
            const diffMs = now.getTime() - lastLogin.getTime()

            // Calculate inactive time in the configured unit
            let inactiveTime: number
            if (timeUnit === 'minutes') {
                inactiveTime = Math.floor(diffMs / (1000 * 60))
            } else {
                inactiveTime = Math.floor(diffMs / (1000 * 60 * 60 * 24))
            }

        // Check per-user custom settings from inactivity_config
            let userStages = { s1: stage1, s2: stage2, s3: stage3, s4: stage4 }

            const { data: userSettings } = await supabase
                .from('inactivity_config')
                .select('inactivity_days, enabled')
                .eq('user_id', tracker.user_id)
                .single()

            if (userSettings?.enabled && userSettings.inactivity_days >= 20) {
                const total = userSettings.inactivity_days;
                const stages = Math.floor(total / 20);
                const interval = Math.floor(total / stages);
                // Build dynamic stages array
                const stageValues = Array.from({ length: stages }, (_, i) => interval * (i + 1));
                userStages = {
                    s1: stageValues[0],
                    s2: stageValues[Math.floor(stages * 0.5)] ?? stageValues[stageValues.length - 1],
                    s3: stageValues[Math.floor(stages * 0.75)] ?? stageValues[stageValues.length - 1],
                    s4: stageValues[stageValues.length - 1],
                }
            } else if (userSettings && !userSettings.enabled) {
                // Skip this user — inactivity detection disabled
                results.push({ user_id: tracker.user_id, inactive_time: inactiveTime, unit: timeUnit, stage_triggered: null })
                continue;
            }

            let stageTriggered: string | null = null
            const updates: Record<string, boolean> = {}

            // We removed the profile join to fix a 500 error. For now, fetch from Auth admin API.
            let userEmail = undefined;
            try {
                const { data: userData } = await supabase.auth.admin.getUserById(tracker.user_id)
                if (userData?.user?.email) {
                    userEmail = userData.user.email
                }
            } catch (err) {
                console.error(`Error fetching email for user ${tracker.user_id}:`, err)
            }

            // Stage 4 — Nominee triggered (highest priority)
            if (inactiveTime >= userStages.s4 && !tracker.nominee_triggered) {
                updates.nominee_triggered = true
                updates.reminder_stage_3_sent = true
                updates.reminder_stage_2_sent = true
                updates.reminder_stage_1_sent = true
                stageTriggered = 'stage_4_nominee_triggered'

                // Fetch nominees to send guidance
                const { data: nominees } = await supabase
                    .from('nominees')
                    .select('*')
                    .eq('user_id', tracker.user_id)

                // Notify User & Nominees via SendGrid
                try {
                    if (userEmail) {
                        await sendEmail(
                            userEmail, 
                            "Nominee Access Activation", 
                            `Inactivity threshold triggers. Your portfolio access has been granted to your designated nominees.`
                        )
                        console.log(`[Stage 4] Email sent to user: ${userEmail}`)
                    }

                    if (nominees && nominees.length > 0) {
                        for (const nominee of nominees) {
                            if (nominee.email) {
                                await sendEmail(
                                    nominee.email, 
                                    "Nominee Access Activation", 
                                    `You have been granted read-only access to a portfolio due to inactivity period limit. Visit ${process.env.NEXT_PUBLIC_SITE_URL}/nominee-portal/${nominee.id}`
                                )
                                console.log(`[Stage 4] Email sent to nominee: ${nominee.email}`)
                            }
                        }
                    }
                } catch (err) {
                    console.error(`[Stage 4] SendGrid error for ${tracker.user_id}:`, err)
                }

                // Log audit event (Safe call)
                await safeLogAudit(supabase, tracker.user_id, 'INACTIVITY_STAGE_4', 
                    `Critical: Inactivity threshold reached (${inactiveTime} ${timeUnit}). Nominee access granted.`,
                    { inactive_time: inactiveTime, unit: timeUnit, nominees_count: nominees?.length || 0 }
                )
            }
            // Stage 3 — Warning
            else if (inactiveTime >= userStages.s3 && !tracker.reminder_stage_3_sent) {
                updates.reminder_stage_3_sent = true
                updates.reminder_stage_2_sent = true
                updates.reminder_stage_1_sent = true
                stageTriggered = 'stage_3_warning'
                // Notify User
                try {
                    if (userEmail) {
                        await sendEmail(
                            userEmail, 
                            "Final Warning – Account Access Risk", 
                            `Your account has been highly inactive. designated nominees will be granted access shortly unless you log in.`
                        )
                        console.log(`[Stage 3] Email sent to user: ${userEmail}`)
                    }
                } catch (err) {
                    console.error(`[Stage 3] SendGrid error for ${tracker.user_id}:`, err)
                }

                // Log audit event (Safe call)
                await safeLogAudit(supabase, tracker.user_id, 'INACTIVITY_STAGE_3', 
                    `Warning: User inactive for ${inactiveTime} ${timeUnit}. Stage 3 notification sent.`,
                    { inactive_time: inactiveTime, unit: timeUnit }
                )
            }
            // Stage 2 — Second reminder
            else if (inactiveTime >= userStages.s2 && !tracker.reminder_stage_2_sent) {
                updates.reminder_stage_2_sent = true
                updates.reminder_stage_1_sent = true
                stageTriggered = 'stage_2_reminder'
                // Notify User
                try {
                    if (userEmail) {
                        await sendEmail(
                            userEmail, 
                            "Second Reminder – Account Inactivity", 
                            `Your account is reaching inactivity limits. Please log in to prevent emergency threshold alerts.`
                        )
                        console.log(`[Stage 2] Email sent to user: ${userEmail}`)
                    }
                } catch (err) {
                    console.error(`[Stage 2] SendGrid error for ${tracker.user_id}:`, err)
                }

                // Log audit event (Safe call)
                await safeLogAudit(supabase, tracker.user_id, 'INACTIVITY_STAGE_2', 
                    `Notice: User inactive for ${inactiveTime} ${timeUnit}. Stage 2 notification sent.`,
                    { inactive_time: inactiveTime, unit: timeUnit }
                )
            }
            // Stage 1 — First reminder
            else if (inactiveTime >= userStages.s1 && !tracker.reminder_stage_1_sent) {
                updates.reminder_stage_1_sent = true
                stageTriggered = 'stage_1_reminder'
                // Notify User
                try {
                    if (userEmail) {
                        await sendEmail(
                            userEmail, 
                            "Account Inactivity Reminder", 
                            `You have not logged in recently. Please login to keep your account active.`
                        )
                        console.log(`[Stage 1] Email sent to user: ${userEmail}`)
                    }
                } catch (err) {
                    console.error(`[Stage 1] SendGrid error for ${tracker.user_id}:`, err)
                }

                // Log audit event (Safe call)
                await safeLogAudit(supabase, tracker.user_id, 'INACTIVITY_STAGE_1', 
                    `Reminder: User inactive for ${inactiveTime} ${timeUnit}. Stage 1 notification sent.`,
                    { inactive_time: inactiveTime, unit: timeUnit }
                )
            }

            // Update tracker if any stage was triggered
            if (Object.keys(updates).length > 0) {
                const { error: updateError } = await supabase
                    .from('inactivity_tracker')
                    .update({
                        ...updates,
                        updated_at: now.toISOString(),
                    })
                    .eq('user_id', tracker.user_id)

                if (updateError) {
                    console.error(`Failed to update tracker for ${tracker.user_id}:`, updateError)
                }
            }

            results.push({
                user_id: tracker.user_id,
                inactive_time: inactiveTime,
                unit: timeUnit,
                stage_triggered: stageTriggered,
            })
        }

        const triggered = results.filter(r => r.stage_triggered !== null)

        console.log(`\n📊 Inactivity Check Complete: ${trackers.length} users checked, ${triggered.length} stages triggered\n`)

        return NextResponse.json({
            message: 'Inactivity check complete',
            processed: trackers.length,
            stages_triggered: triggered.length,
            results,
        })

    } catch (error) {
        console.error('Inactivity check fatal error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * Safe wrapper for audit logging to prevent breaking the main flow
 */
async function safeLogAudit(supabase: any, userId: string, eventType: string, description: string, metadata: any = {}) {
    try {
        const { error } = await supabase.from('audit_logs').insert({
            user_id: userId,
            event_type: eventType,
            description,
            metadata
        })
        if (error) console.error(`[Audit Log Fail] ${eventType}:`, error)
    } catch (err) {
        console.error(`[Audit Log Fatal] ${eventType}:`, err)
    }
}
