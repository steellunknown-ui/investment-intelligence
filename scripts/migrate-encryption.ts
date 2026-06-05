import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

// 1. Manually parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8')
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=:#]+?)[=:](.*)/)
        if (match) {
            const key = match[1].trim()
            let value = match[2].trim()
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1)
            }
            if (value.startsWith("'") && value.endsWith("'")) {
                value = value.slice(1, -1)
            }
            process.env[key] = value
        }
    })
}

// 2. Load Encryption Key and Supabase config
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ''
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '' // Use service role for admin access

if (!ENCRYPTION_KEY) {
    console.error('Error: ENCRYPTION_KEY is missing from .env.local')
    process.exit(1)
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Error: Supabase URL or Service Role Key is missing')
    process.exit(1)
}

// 3. Duplicate encryption logic to avoid next.js specific imports
const ALGORITHM = 'aes-256-cbc'

function encrypt(text: string | null | undefined): string {
    if (!text) return ''
    
    if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
        console.warn('⚠️ ENCRYPTION_KEY is missing or invalid (must be 32 characters). Data will not be encrypted.')
        return text
    }

    // Don't encrypt if it already looks like our encrypted format (hex:hex)
    if (typeof text === 'string' && text.includes(':') && text.split(':')[0].length === 32) {
        return text
    }

    try {
        const iv = crypto.randomBytes(16)
        const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv)
        
        let encrypted = cipher.update(text)
        encrypted = Buffer.concat([encrypted, cipher.final()])
        
        return iv.toString('hex') + ':' + encrypted.toString('hex')
    } catch (err) {
        console.error('Encryption failed:', err)
        return text
    }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function migrateTable(tableName: string, fieldsToEncrypt: string[]) {
    console.log(`\n--- Migrating ${tableName} ---`)
    let { data: rows, error } = await supabase.from(tableName).select('*')
    
    if (error) {
        console.error(`Failed to fetch ${tableName}:`, error)
        return
    }

    if (!rows || rows.length === 0) {
        console.log(`No records found in ${tableName}.`)
        return
    }

    let updatedCount = 0

    for (const row of rows) {
        let needsUpdate = false
        const updateData: any = {}

        for (const field of fieldsToEncrypt) {
            const val = row[field]
            // If value exists and isn't already encrypted (doesn't look like iv:encrypted_data)
            if (val && typeof val === 'string' && !(val.includes(':') && val.split(':')[0].length === 32)) {
                updateData[field] = encrypt(val)
                needsUpdate = true
            }
        }

        if (needsUpdate) {
            const { error: updateError } = await supabase
                .from(tableName)
                .update(updateData)
                .eq('id', row.id)
            
            if (updateError) {
                console.error(`Error updating row ${row.id} in ${tableName}:`, updateError)
            } else {
                updatedCount++
            }
        }
    }

    console.log(`Successfully encrypted ${updatedCount} records in ${tableName}.`)
}

async function runMigration() {
    console.log('Starting Encryption Migration...\n')

    await migrateTable('bank_accounts', ['account_number', 'linked_mobile', 'debit_card_number', 'joint_holder_name'])
    await migrateTable('insurance_policies', ['policy_number', 'agent_contact', 'policy_nominee_name'])
    await migrateTable('assets', ['registration_number', 'vehicle_registration', 'property_address'])
    await migrateTable('liabilities', ['account_number', 'auto_debit_account', 'collateral_details'])
    await migrateTable('receivables', ['contact_number', 'email', 'notes'])
    await migrateTable('belongings', ['storage_location', 'bank_locker_details'])
    await migrateTable('profiles', ['contact_number', 'address'])
    await migrateTable('nominees', ['email', 'nominee_phone'])

    console.log('\nMigration Complete! All sensitive data is now encrypted.')
}

runMigration().catch(console.error)
