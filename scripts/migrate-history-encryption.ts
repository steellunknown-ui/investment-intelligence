import { createClient } from '@supabase/supabase-js';
import { encryptNumber } from '../src/lib/encryption';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const encryptionKey = process.env.ENCRYPTION_KEY;

if (!supabaseUrl || !supabaseKey || !encryptionKey) {
    console.error('Missing required environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateHistoryEncryption() {
    console.log('Starting net_worth_snapshots encryption migration...');

    const { data: snapshots, error: fetchError } = await supabase
        .from('net_worth_snapshots')
        .select('*');

    if (fetchError) {
        console.error('Error fetching snapshots:', fetchError);
        return;
    }

    if (!snapshots || snapshots.length === 0) {
        console.log('No snapshots found to encrypt.');
        return;
    }

    console.log(`Found ${snapshots.length} snapshots. Encrypting...`);

    let successCount = 0;
    let errorCount = 0;

    for (const snapshot of snapshots) {
        try {
            // Check if already encrypted (contains ':')
            if (typeof snapshot.net_worth === 'string' && snapshot.net_worth.includes(':')) {
                console.log(`Snapshot ${snapshot.id} already encrypted, skipping.`);
                continue;
            }

            const updates = {
                net_worth: encryptNumber(snapshot.net_worth),
                bank_balance: encryptNumber(snapshot.bank_balance),
                assets_value: encryptNumber(snapshot.assets_value),
                belongings_value: encryptNumber(snapshot.belongings_value),
                receivables_value: encryptNumber(snapshot.receivables_value),
                liabilities_value: encryptNumber(snapshot.liabilities_value)
            };

            const { error: updateError } = await supabase
                .from('net_worth_snapshots')
                .update(updates)
                .eq('id', snapshot.id);

            if (updateError) {
                console.error(`Error updating snapshot ${snapshot.id}:`, updateError);
                errorCount++;
            } else {
                successCount++;
            }
        } catch (err) {
            console.error(`Failed to process snapshot ${snapshot.id}:`, err);
            errorCount++;
        }
    }

    console.log(`Migration complete! Successfully encrypted: ${successCount}. Errors: ${errorCount}.`);
}

migrateHistoryEncryption();
