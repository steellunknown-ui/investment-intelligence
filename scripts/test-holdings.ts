import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { decryptFields, decryptNumericFields, encryptFields, encryptNumericFields } from '../src/lib/encryption';

async function testHoldings() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase keys');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: holdings, error } = await supabase.from('holdings').select('*').limit(1);
    if (error) {
        console.error('Error fetching holdings:', error);
        return;
    }
    
    console.log('Raw holding from DB:', holdings[0]);
    
    let decryptedHoldings = holdings?.map(holding => decryptFields(holding, [
        'symbol', 'name', 'broker', 'notes', 'account_number'
    ]));
    
    decryptedHoldings = decryptedHoldings?.map(holding => decryptNumericFields(holding, [
        'quantity', 'avg_buy_price'
    ]));
    
    console.log('Decrypted holding:', decryptedHoldings[0]);

    // Test encryption logic as written in POST
    const rawHoldingData = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        quantity: 10,
        avg_buy_price: 150.5
    };

    let encryptedData = encryptFields(rawHoldingData, ['symbol', 'name']);
    encryptedData = encryptNumericFields(encryptedData, ['quantity', 'avg_buy_price']);

    console.log('Test Encrypted Data:', encryptedData);
}

testHoldings();
