import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { updateLastActivity } from '@/src/lib/activity'
import { IFSC_REGEX, validateBankAccountNumber } from '@/src/lib/financialValidationRules'
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

        // Validation basic
        if (Number(body.current_balance) < 0) {
            return NextResponse.json({ error: 'Balance cannot be negative' }, { status: 400 })
        }
        if (body.is_joint_account && !body.joint_holder_name) {
            return NextResponse.json({ error: 'Joint holder name is required' }, { status: 400 })
        }

        // IFSC Validation (if provided)
        if (body.ifsc_code && !IFSC_REGEX.test(body.ifsc_code)) {
            return NextResponse.json({ error: 'Invalid IFSC format' }, { status: 400 })
        }

        // Account Number Validation (if provided or bank changed)
        if (body.account_number || body.bank_name) {
            const { data: existing } = await supabase
                .from('bank_accounts')
                .select('bank_name, account_number')
                .eq('id', id)
                .single();
            
            if (existing) {
                const bank = body.bank_name || existing.bank_name;
                const acc = body.account_number || decrypt(existing.account_number);
                const accValidation = validateBankAccountNumber(bank, acc);
                if (!accValidation.isValid) {
                    return NextResponse.json({ error: accValidation.error }, { status: 400 });
                }
            }
        }
        // Actually, let's just do basic checks for PATCH to avoid breaking partial updates
        // but IFSC is safe to check if present.

        const updateData = { ...body }
        if (updateData.account_number !== undefined) updateData.account_number = encrypt(updateData.account_number)
        if (updateData.linked_mobile !== undefined) updateData.linked_mobile = encrypt(updateData.linked_mobile)
        if (updateData.debit_card_number !== undefined) updateData.debit_card_number = encrypt(updateData.debit_card_number)
        if (updateData.joint_holder_name !== undefined) updateData.joint_holder_name = encrypt(updateData.joint_holder_name)

        const { data: account, error } = await supabase
            .from('bank_accounts')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single()

        if (error) {
            console.error('Bank account update error:', error)
            return NextResponse.json(
                { error: error.message || 'Failed to update account' },
                { status: 500 }
            )
        }

        const decryptedAccount = {
            ...account,
            account_number: decrypt(account.account_number),
            linked_mobile: decrypt(account.linked_mobile),
            debit_card_number: decrypt(account.debit_card_number),
            joint_holder_name: decrypt(account.joint_holder_name)
        }

        return NextResponse.json({ account: decryptedAccount })
    } catch (error) {
        console.error('Bank account PATCH error:', error)
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
            .from('bank_accounts')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) {
            console.error('Bank account delete error:', error)
            return NextResponse.json(
                { error: 'Failed to delete account' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Bank account DELETE error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
