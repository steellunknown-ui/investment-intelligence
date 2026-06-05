import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { updateLastActivity } from '@/src/lib/activity'
import { validateInsurancePolicyNumber } from '@/src/lib/financialValidationRules'
import { encrypt, decrypt } from '@/src/lib/encryption'

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createSupabaseServerClient()
        const { id } = params

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        updateLastActivity(supabase, user.id)

        const body = await request.json()

        // Sanitize empty strings to null (only for fields that exist in body)
        const sanitizedBody = { ...body }
        for (const key of Object.keys(sanitizedBody)) {
            if (sanitizedBody[key] === '') {
                sanitizedBody[key] = null
            }
        }

        // Validation for numeric fields if present
        if (sanitizedBody.sum_insured !== undefined && Number(sanitizedBody.sum_insured) < 0) {
            return NextResponse.json({ error: 'Sum insured cannot be negative' }, { status: 400 })
        }
        if (sanitizedBody.premium_amount !== undefined && Number(sanitizedBody.premium_amount) < 0) {
            return NextResponse.json({ error: 'Premium amount cannot be negative' }, { status: 400 })
        }
        if (sanitizedBody.premium_frequency && !['monthly', 'quarterly', 'half_yearly', 'yearly'].includes(sanitizedBody.premium_frequency)) {
            return NextResponse.json({ error: 'Invalid premium frequency' }, { status: 400 })
        }

        // Policy Number Validation (if provided or provider changed)
        if (sanitizedBody.policy_number || sanitizedBody.provider_name) {
            const { data: existing } = await supabase
                .from('insurance_policies')
                .select('provider_name, policy_number')
                .eq('id', id)
                .single();
            
            if (existing) {
                const provider = sanitizedBody.provider_name || existing.provider_name;
                const policy = sanitizedBody.policy_number || decrypt(existing.policy_number);
                const validation = validateInsurancePolicyNumber(provider, policy);
                if (!validation.isValid) {
                    return NextResponse.json({ error: "Invalid policy number format for selected provider." }, { status: 400 });
                }
            }
        }

        const updateData = { ...sanitizedBody }
        if (updateData.policy_number !== undefined) updateData.policy_number = encrypt(updateData.policy_number)
        if (updateData.agent_contact !== undefined) updateData.agent_contact = encrypt(updateData.agent_contact)
        if (updateData.policy_nominee_name !== undefined) updateData.policy_nominee_name = encrypt(updateData.policy_nominee_name)

        const { data: policy, error } = await supabase
            .from('insurance_policies')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id) // Extra safety + RLS
            .select()
            .single()

        if (error) {
            console.error('Insurance policy update error:', error)
            return NextResponse.json(
                { error: error.message || 'Failed to update policy' },
                { status: 500 }
            )
        }

        const decryptedPolicy = {
            ...policy,
            policy_number: decrypt(policy.policy_number),
            agent_contact: decrypt(policy.agent_contact),
            policy_nominee_name: decrypt(policy.policy_nominee_name)
        }

        return NextResponse.json({ policy: decryptedPolicy })
    } catch (error) {
        console.error('Insurance policy PATCH error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createSupabaseServerClient()
        const { id } = params

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        updateLastActivity(supabase, user.id)

        const { error } = await supabase
            .from('insurance_policies')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) {
            console.error('Insurance policy delete error:', error)
            return NextResponse.json(
                { error: 'Failed to delete policy' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Insurance policy DELETE error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
