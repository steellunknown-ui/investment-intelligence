import { createClient } from '@supabase/supabase-js'
import { loadEnvConfig } from '@next/env'
import { decryptNumber } from '../src/lib/encryption'

loadEnvConfig(process.cwd())

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function test() {
    // Just fetch all for testing
    const [
        { data: bankAccounts },
        { data: assets },
        { data: belongings },
        { data: receivables },
        { data: liabilities }
    ] = await Promise.all([
        supabase.from('bank_accounts').select('current_balance, id'),
        supabase.from('assets').select('current_market_value, id'),
        supabase.from('belongings').select('current_estimated_value, id'),
        supabase.from('receivables').select('outstanding_amount, id'),
        supabase.from('liabilities').select('outstanding_amount, id')
    ])

    console.log('Bank Accounts Raw:', bankAccounts)
    console.log('ENCRYPTION_KEY length:', process.env.ENCRYPTION_KEY?.length)
    
    const bankBalanceTotal = bankAccounts?.reduce((sum, acc) => {
        const text = acc.current_balance as string
        const { decrypt } = require('../src/lib/encryption')
        const decryptedStr = decrypt(text)
        console.log(`Raw: ${text}`)
        console.log(`DecryptedStr: ${decryptedStr}`)
        const val = decryptNumber(text)
        console.log(`Bank ${acc.id} balance raw: ${text}, decrypted val: ${val}`)
        return sum + (val || 0)
    }, 0) || 0

    const assetsTotalValue = assets?.reduce((sum, a) => {
        const val = decryptNumber(a.current_market_value as string)
        return sum + (val || 0)
    }, 0) || 0

    const belongingsTotalValue = belongings?.reduce((sum, b) => {
        const val = decryptNumber(b.current_estimated_value as string)
        return sum + (val || 0)
    }, 0) || 0

    const receivablesTotal = receivables?.reduce((sum, r) => {
        const val = decryptNumber(r.outstanding_amount as string)
        return sum + (val || 0)
    }, 0) || 0

    const liabilitiesTotal = liabilities?.reduce((sum, l) => {
        const val = decryptNumber(l.outstanding_amount as string)
        return sum + (val || 0)
    }, 0) || 0

    console.log({
        bankBalanceTotal,
        assetsTotalValue,
        belongingsTotalValue,
        receivablesTotal,
        liabilitiesTotal
    })
}

test().catch(console.error)
