import { createClient } from '@supabase/supabase-js';
import { decryptFields, decryptNumericFields } from '../src/lib/encryption';

async function testDecryptHoldings() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase keys');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: holdings, error } = await supabase.from('holdings').select('*').limit(1);
    
    let decryptedHoldings = holdings?.map(holding => decryptFields(holding, [
        'symbol', 'name', 'broker', 'notes', 'account_number'
    ]));
    
    decryptedHoldings = decryptedHoldings?.map(holding => decryptNumericFields(holding, [
        'quantity', 'avg_buy_price'
    ]));
    
    console.log('Decrypted holding:', decryptedHoldings?.[0]);
}

testDecryptHoldings();
