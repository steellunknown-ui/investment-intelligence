import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { loadEnvConfig } from '@next/env'

// Load environment variables from .env.local
loadEnvConfig(process.cwd())

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
const encryptionKey = process.env.ENCRYPTION_KEY?.trim()

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local')
    process.exit(1)
}

if (!encryptionKey || encryptionKey.length !== 32) {
    console.error('Error: ENCRYPTION_KEY must be 32 characters')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Encryption utility functions
const ENCRYPTION_ALGORITHM = 'aes-256-cbc'

function encrypt(text: string | null | undefined): string | null {
    if (!text) return null
    try {
        const iv = crypto.randomBytes(16)
        const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, Buffer.from(encryptionKey as string), iv)
        let encrypted = cipher.update(text)
        encrypted = Buffer.concat([encrypted, cipher.final()])
        return iv.toString('hex') + ':' + encrypted.toString('hex')
    } catch (error) {
        console.error('Encryption failed:', error)
        return text
    }
}

function encryptNumber(num: number | null | undefined): string | null {
    if (num === null || num === undefined) return null
    return encrypt(num.toString())
}

function isEncrypted(value: any): boolean {
    if (typeof value !== 'string') return false
    const parts = value.split(':')
    return parts.length === 2 && parts[0].length === 32
}

const TABLES_TO_MIGRATE = [
    {
        name: 'bank_accounts',
        stringFields: ['bank_name', 'account_number', 'ifsc_code', 'branch_name', 'account_holder_name', 'joint_holder_name', 'nominee_name', 'nominee_relationship', 'customer_id', 'notes'],
        numericFields: ['current_balance']
    },
    {
        name: 'assets',
        stringFields: ['asset_name', 'owner_name', 'property_address', 'registration_number', 'vehicle_registration', 'vehicle_make', 'vehicle_model', 'loan_provider', 'document_reference', 'location', 'notes'],
        numericFields: ['current_market_value']
    },
    {
        name: 'liabilities',
        stringFields: ['loan_name', 'taken_from', 'auto_debit_account', 'collateral_details', 'account_number', 'notes'],
        numericFields: ['principal_amount', 'outstanding_amount', 'emi_amount']
    },
    {
        name: 'insurance_policies',
        stringFields: ['policy_number', 'policy_name', 'insured_name', 'insured_relationship', 'policy_nominee_name', 'policy_nominee_relationship', 'agent_name', 'agent_contact', 'notes'],
        numericFields: ['sum_insured', 'premium_amount']
    },
    {
        name: 'receivables',
        stringFields: ['given_to', 'relationship', 'contact_number', 'email', 'purpose', 'agreement_reference', 'notes'],
        numericFields: ['principal_amount', 'interest_amount', 'total_receivable', 'amount_received', 'outstanding_amount']
    },
    {
        name: 'nominees',
        stringFields: ['name', 'email', 'nominee_phone', 'aadhaar_hash', 'pan_hash'],
        numericFields: []
    },
    {
        name: 'holdings',
        stringFields: ['symbol', 'name', 'notes'],
        numericFields: ['quantity', 'avg_buy_price']
    },
    {
        name: 'profiles',
        stringFields: ['full_name', 'contact_number', 'address', 'city', 'state', 'pincode'],
        numericFields: []
    },
    {
        name: 'family_members',
        stringFields: ['member_name', 'relation'],
        numericFields: []
    },
    {
        name: 'belongings',
        stringFields: ['item_name', 'description', 'storage_location', 'bank_locker_details', 'location_details', 'notes', 'insurance_policy_reference'],
        numericFields: ['quantity', 'purchase_value', 'current_estimated_value', 'weight_grams']
    }
]

async function runMigration() {
    console.log('Starting encryption migration...')
    const BATCH_SIZE = 100

    for (const tableConfig of TABLES_TO_MIGRATE) {
        console.log(`\nMigrating table: ${tableConfig.name}...`)
        
        let lastId = '00000000-0000-0000-0000-000000000000'
        let hasMore = true
        let updatedCount = 0

        while (hasMore) {
            const { data: records, error } = await supabase
                .from(tableConfig.name)
                .select('*')
                .gt('id', lastId)
                .order('id', { ascending: true })
                .limit(BATCH_SIZE)

            if (error) {
                console.error(`Failed to fetch records:`, error)
                break
            }

            if (!records || records.length === 0) {
                hasMore = false
                break
            }

            for (const record of records) {
                lastId = record.id
                let needsUpdate = false
                const updateData: Record<string, any> = {}

                // Process string fields
                if (tableConfig.stringFields) {
                    for (const field of tableConfig.stringFields) {
                        const val = record[field]
                        if (val && typeof val === 'string' && !isEncrypted(val)) {
                            updateData[field] = encrypt(val)
                            needsUpdate = true
                        }
                    }
                }

                // Process numeric fields
                if (tableConfig.numericFields) {
                    for (const field of tableConfig.numericFields) {
                        let val = record[field]
                        
                        // Special case: if we are migrating receivables and outstanding_amount is missing (because we just recreated it)
                        if (tableConfig.name === 'receivables' && field === 'outstanding_amount' && (val === null || val === undefined)) {
                            const total = Number(record['total_receivable']) || 0
                            const received = Number(record['amount_received']) || 0
                            val = total - received
                        }

                        if (val !== null && val !== undefined && val !== '') {
                            if (typeof val === 'string' && isEncrypted(val)) {
                                continue
                            }
                            const parsed = Number(val)
                            if (!isNaN(parsed)) {
                                const encryptedVal = encryptNumber(parsed)
                                if (encryptedVal) {
                                    updateData[field] = encryptedVal
                                    needsUpdate = true
                                }
                            }
                        }
                    }
                }

                if (!needsUpdate) {
                    continue
                }

                const idField = record.id ? 'id' : (record.user_id ? 'user_id' : null)
                if (!idField) {
                    console.error(`Could not determine primary key for record in ${tableConfig.name}`, record)
                    continue
                }

                const { error: updateError } = await supabase
                    .from(tableConfig.name)
                    .update(updateData)
                    .eq(idField, record[idField])

                if (updateError) {
                    console.error(`Failed to update record ${record[idField]} in ${tableConfig.name}:`, updateError)
                } else {
                    updatedCount++
                }
            }
        }

        console.log(`Successfully migrated ${updatedCount} records in ${tableConfig.name}.`)
    }

    console.log('\nMigration complete.')
}

runMigration().catch(console.error)
