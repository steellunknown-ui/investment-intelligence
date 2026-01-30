import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server';
import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Authenticate user
        const supabase = createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Fetch all data
        const [
            bankingData,
            insuranceData,
            insurancePaymentsData,
            assetsData,
            liabilitiesData,
            liabilityPaymentsData,
            receivablesData,
            belongingsData,
            documentsData,
            holdingsData,
            nomineesData,
            inactivityData
        ] = await Promise.all([
            supabase.from('bank_accounts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('insurance_policies').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('insurance_payments').select('*').eq('user_id', user.id).order('payment_date', { ascending: false }),
            supabase.from('assets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('liabilities').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('liability_payments').select('*').eq('user_id', user.id).order('payment_date', { ascending: false }),
            supabase.from('receivables').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('belongings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('holdings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('nominees').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('inactivity_config').select('*').eq('user_id', user.id).single()
        ]);

        const banking = bankingData.data || [];
        const insurance = insuranceData.data || [];
        const insurancePayments = insurancePaymentsData.data || [];
        const assets = assetsData.data || [];
        const liabilities = liabilitiesData.data || [];
        const liabilityPayments = liabilityPaymentsData.data || [];
        const receivables = receivablesData.data || [];
        const belongings = belongingsData.data || [];
        const documents = documentsData.data || [];
        const holdings = holdingsData.data || [];
        const nominees = nomineesData.data || [];
        const inactivityConfig = inactivityData.data;

        // Calculate summary
        const totalBanking = banking.reduce((sum: number, acc: any) => sum + Number(acc.current_balance || 0), 0);
        const totalAssets = assets.reduce((sum: number, asset: any) => sum + Number(asset.current_market_value || 0), 0);
        const totalLiabilities = liabilities.reduce((sum: number, lib: any) => sum + Number(lib.outstanding_amount || 0), 0);
        const totalReceivables = receivables.reduce((sum: number, rec: any) => sum + Number(rec.outstanding_amount || 0), 0);
        const totalBelongings = belongings.reduce((sum: number, bel: any) => sum + Number(bel.current_estimated_value || 0), 0);
        const netWorth = totalBanking + totalAssets + totalBelongings + totalReceivables - totalLiabilities;
        const insuranceCount = insurance.length;
        const insuranceOverdue = insurance.filter((p: any) =>
            p.next_premium_due && new Date(p.next_premium_due) < new Date() && p.status === 'active'
        ).length;

        // Create workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Personal Finance Vault';
        workbook.created = new Date();

        // Helper functions
        const formatDate = (dateStr: string | null | undefined) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            return date.toLocaleString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        const formatCurrency = (amount: number | null | undefined) => {
            if (amount === null || amount === undefined) return '₹0';
            return `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
        };

        const maskAccountNumber = (accNum: string) => {
            if (!accNum || accNum.length < 4) return '****';
            return '****' + accNum.slice(-4);
        };

        // Sheet 1: Summary
        const summarySheet = workbook.addWorksheet('Summary');
        summarySheet.columns = [
            { header: 'Metric', key: 'metric', width: 30 },
            { header: 'Value', key: 'value', width: 25 }
        ];

        summarySheet.addRows([
            { metric: 'Total Net Worth', value: formatCurrency(netWorth) },
            { metric: 'Total Assets', value: formatCurrency(totalAssets) },
            { metric: 'Total Liabilities', value: formatCurrency(totalLiabilities) },
            { metric: 'Total Cash (Banking)', value: formatCurrency(totalBanking) },
            { metric: 'Total Receivables Outstanding', value: formatCurrency(totalReceivables) },
            { metric: 'Total Belongings Value', value: formatCurrency(totalBelongings) },
            { metric: 'Insurance Policies Count', value: insuranceCount },
            { metric: 'Insurance Overdue Count', value: insuranceOverdue },
            { metric: 'Export Timestamp', value: formatDate(new Date().toISOString()) }
        ]);

        // Style summary sheet
        summarySheet.getRow(1).font = { bold: true, size: 12 };
        summarySheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        summarySheet.getRow(1).font = { ...summarySheet.getRow(1).font, color: { argb: 'FFFFFFFF' } };

        // Sheet 2: Banking
        const bankingSheet = workbook.addWorksheet('Banking');
        bankingSheet.columns = [
            { header: 'Bank Name', key: 'bank_name', width: 20 },
            { header: 'Account Type', key: 'account_type', width: 15 },
            { header: 'Account Number', key: 'account_number', width: 18 },
            { header: 'IFSC', key: 'ifsc_code', width: 15 },
            { header: 'Balance', key: 'current_balance', width: 15 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Created At', key: 'created_at', width: 20 },
            { header: 'Updated At', key: 'updated_at', width: 20 }
        ];

        banking.forEach((acc: any) => {
            bankingSheet.addRow({
                bank_name: acc.bank_name,
                account_type: acc.account_type,
                account_number: maskAccountNumber(acc.account_number),
                ifsc_code: acc.ifsc_code,
                current_balance: formatCurrency(acc.current_balance),
                status: acc.status,
                created_at: formatDate(acc.created_at),
                updated_at: formatDate(acc.updated_at)
            });
        });

        bankingSheet.getRow(1).font = { bold: true };
        bankingSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9E1F2' }
        };

        // Sheet 3: Insurance
        const insuranceSheet = workbook.addWorksheet('Insurance');
        insuranceSheet.columns = [
            { header: 'Provider', key: 'provider_name', width: 20 },
            { header: 'Policy Number', key: 'policy_number', width: 18 },
            { header: 'Policy Type', key: 'policy_type', width: 15 },
            { header: 'Sum Insured', key: 'sum_insured', width: 15 },
            { header: 'Premium Amount', key: 'premium_amount', width: 15 },
            { header: 'Premium Frequency', key: 'premium_frequency', width: 18 },
            { header: 'Next Due Date', key: 'next_premium_due', width: 15 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Created At', key: 'created_at', width: 20 },
            { header: 'Updated At', key: 'updated_at', width: 20 }
        ];

        insurance.forEach((policy: any) => {
            insuranceSheet.addRow({
                provider_name: policy.provider_name,
                policy_number: policy.policy_number,
                policy_type: policy.policy_type,
                sum_insured: formatCurrency(policy.sum_insured),
                premium_amount: formatCurrency(policy.premium_amount),
                premium_frequency: policy.premium_frequency,
                next_premium_due: policy.next_premium_due ? formatDate(policy.next_premium_due) : '',
                status: policy.status,
                created_at: formatDate(policy.created_at),
                updated_at: formatDate(policy.updated_at)
            });
        });

        insuranceSheet.getRow(1).font = { bold: true };
        insuranceSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9E1F2' }
        };

        // Insurance Payments
        if (insurancePayments.length > 0) {
            const insurancePaymentsSheet = workbook.addWorksheet('Insurance Payments');
            insurancePaymentsSheet.columns = [
                { header: 'Policy ID', key: 'policy_id', width: 38 },
                { header: 'Amount', key: 'amount', width: 15 },
                { header: 'Payment Date', key: 'payment_date', width: 15 },
                { header: 'Payment Mode', key: 'payment_mode', width: 15 },
                { header: 'Created At', key: 'created_at', width: 20 }
            ];

            insurancePayments.forEach((payment: any) => {
                insurancePaymentsSheet.addRow({
                    policy_id: payment.policy_id,
                    amount: formatCurrency(payment.amount),
                    payment_date: formatDate(payment.payment_date),
                    payment_mode: payment.payment_mode || '',
                    created_at: formatDate(payment.created_at)
                });
            });

            insurancePaymentsSheet.getRow(1).font = { bold: true };
            insurancePaymentsSheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9E1F2' }
            };
        }

        // Sheet 4: Assets
        const assetsSheet = workbook.addWorksheet('Assets');
        assetsSheet.columns = [
            { header: 'Name', key: 'asset_name', width: 25 },
            { header: 'Category', key: 'asset_category', width: 15 },
            { header: 'Type', key: 'asset_type', width: 15 },
            { header: 'Current Market Value', key: 'current_market_value', width: 20 },
            { header: 'Purchase Value', key: 'purchase_value', width: 18 },
            { header: 'Ownership Type', key: 'ownership_type', width: 15 },
            { header: 'Ownership %', key: 'ownership_percentage', width: 12 },
            { header: 'Under Loan?', key: 'is_under_loan', width: 12 },
            { header: 'Loan Outstanding', key: 'loan_outstanding', width: 18 },
            { header: 'Address/Notes', key: 'notes', width: 30 },
            { header: 'Created At', key: 'created_at', width: 20 },
            { header: 'Updated At', key: 'updated_at', width: 20 }
        ];

        assets.forEach((asset: any) => {
            assetsSheet.addRow({
                asset_name: asset.asset_name,
                asset_category: asset.asset_category,
                asset_type: asset.asset_type,
                current_market_value: formatCurrency(asset.current_market_value),
                purchase_value: formatCurrency(asset.purchase_value),
                ownership_type: asset.ownership_type || '',
                ownership_percentage: asset.ownership_percentage || '',
                is_under_loan: asset.is_under_loan ? 'Yes' : 'No',
                loan_outstanding: formatCurrency(asset.loan_outstanding),
                notes: asset.notes || (asset.property_address || ''),
                created_at: formatDate(asset.created_at),
                updated_at: formatDate(asset.updated_at)
            });
        });

        assetsSheet.getRow(1).font = { bold: true };
        assetsSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9E1F2' }
        };

        // Sheet 5: Liabilities
        const liabilitiesSheet = workbook.addWorksheet('Liabilities');
        liabilitiesSheet.columns = [
            { header: 'Type', key: 'loan_type', width: 15 },
            { header: 'Lender Name', key: 'taken_from', width: 20 },
            { header: 'Interest Rate', key: 'interest_rate', width: 12 },
            { header: 'Principal Amount', key: 'principal_amount', width: 18 },
            { header: 'Outstanding Amount', key: 'outstanding_amount', width: 20 },
            { header: 'Monthly EMI', key: 'emi_amount', width: 15 },
            { header: 'Tenure (months)', key: 'tenure_months', width: 15 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Linked Asset', key: 'linked_asset_id', width: 38 },
            { header: 'Created At', key: 'created_at', width: 20 },
            { header: 'Updated At', key: 'updated_at', width: 20 }
        ];

        liabilities.forEach((liability: any) => {
            liabilitiesSheet.addRow({
                loan_type: liability.loan_type,
                taken_from: liability.taken_from,
                interest_rate: liability.interest_rate ? `${liability.interest_rate}%` : '',
                principal_amount: formatCurrency(liability.principal_amount),
                outstanding_amount: formatCurrency(liability.outstanding_amount),
                emi_amount: formatCurrency(liability.emi_amount),
                tenure_months: liability.tenure_months || '',
                status: liability.status || '',
                linked_asset_id: liability.linked_asset_id || '',
                created_at: formatDate(liability.created_at),
                updated_at: formatDate(liability.updated_at)
            });
        });

        liabilitiesSheet.getRow(1).font = { bold: true };
        liabilitiesSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9E1F2' }
        };

        // Liability Payments
        if (liabilityPayments.length > 0) {
            const liabilityPaymentsSheet = workbook.addWorksheet('Liability Payments');
            liabilityPaymentsSheet.columns = [
                { header: 'Liability ID', key: 'liability_id', width: 38 },
                { header: 'Amount', key: 'amount', width: 15 },
                { header: 'Payment Date', key: 'payment_date', width: 15 },
                { header: 'Mode', key: 'payment_mode', width: 15 },
                { header: 'Created At', key: 'created_at', width: 20 }
            ];

            liabilityPayments.forEach((payment: any) => {
                liabilityPaymentsSheet.addRow({
                    liability_id: payment.liability_id,
                    amount: formatCurrency(payment.amount),
                    payment_date: formatDate(payment.payment_date),
                    payment_mode: payment.payment_mode || '',
                    created_at: formatDate(payment.created_at)
                });
            });

            liabilityPaymentsSheet.getRow(1).font = { bold: true };
            liabilityPaymentsSheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9E1F2' }
            };
        }

        // Sheet 6: Receivables
        const receivablesSheet = workbook.addWorksheet('Receivables');
        receivablesSheet.columns = [
            { header: 'Person Name', key: 'given_to', width: 20 },
            { header: 'Relationship', key: 'relationship', width: 15 },
            { header: 'Contact Number', key: 'contact_number', width: 15 },
            { header: 'Principal Amount', key: 'principal_amount', width: 18 },
            { header: 'Interest Type', key: 'interest_type', width: 15 },
            { header: 'Interest Rate', key: 'interest_rate', width: 12 },
            { header: 'Interest Amount', key: 'interest_amount', width: 15 },
            { header: 'Total Expected', key: 'total_receivable', width: 15 },
            { header: 'Total Received', key: 'amount_received', width: 15 },
            { header: 'Outstanding', key: 'outstanding_amount', width: 15 },
            { header: 'Expected Return Date', key: 'expected_return_date', width: 20 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Created At', key: 'created_at', width: 20 },
            { header: 'Updated At', key: 'updated_at', width: 20 }
        ];

        receivables.forEach((rec: any) => {
            receivablesSheet.addRow({
                given_to: rec.given_to,
                relationship: rec.relationship || '',
                contact_number: rec.contact_number || '',
                principal_amount: formatCurrency(rec.principal_amount),
                interest_type: rec.interest_type || '',
                interest_rate: rec.interest_rate ? `${rec.interest_rate}%` : '',
                interest_amount: formatCurrency(rec.interest_amount),
                total_receivable: formatCurrency(rec.total_receivable),
                amount_received: formatCurrency(rec.amount_received),
                outstanding_amount: formatCurrency(rec.outstanding_amount),
                expected_return_date: rec.expected_return_date ? formatDate(rec.expected_return_date) : '',
                status: rec.status,
                created_at: formatDate(rec.created_at),
                updated_at: formatDate(rec.updated_at)
            });
        });

        receivablesSheet.getRow(1).font = { bold: true };
        receivablesSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9E1F2' }
        };

        // Sheet 7: Belongings
        const belongingsSheet = workbook.addWorksheet('Belongings');
        belongingsSheet.columns = [
            { header: 'Item Name', key: 'item_name', width: 25 },
            { header: 'Category', key: 'category', width: 15 },
            { header: 'Purchase Value', key: 'purchase_value', width: 18 },
            { header: 'Current Estimated Value', key: 'current_estimated_value', width: 22 },
            { header: 'Location', key: 'storage_location', width: 20 },
            { header: 'In Locker?', key: 'in_locker', width: 12 },
            { header: 'Locker Details', key: 'bank_locker_details', width: 25 },
            { header: 'Is Insured?', key: 'is_insured', width: 12 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Created At', key: 'created_at', width: 20 },
            { header: 'Updated At', key: 'updated_at', width: 20 }
        ];

        belongings.forEach((item: any) => {
            belongingsSheet.addRow({
                item_name: item.item_name,
                category: item.category,
                purchase_value: formatCurrency(item.purchase_value),
                current_estimated_value: formatCurrency(item.current_estimated_value),
                storage_location: item.storage_location || '',
                in_locker: item.status === 'in_locker' ? 'Yes' : 'No',
                bank_locker_details: item.bank_locker_details || '',
                is_insured: item.is_insured ? 'Yes' : 'No',
                status: item.status,
                created_at: formatDate(item.created_at),
                updated_at: formatDate(item.updated_at)
            });
        });

        belongingsSheet.getRow(1).font = { bold: true };
        belongingsSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9E1F2' }
        };

        // Sheet 8: Documents
        const documentsSheet = workbook.addWorksheet('Documents');
        documentsSheet.columns = [
            { header: 'Title', key: 'title', width: 30 },
            { header: 'File Name', key: 'file_name', width: 30 },
            { header: 'Document Type', key: 'document_type', width: 18 },
            { header: 'Tags', key: 'tags', width: 25 },
            { header: 'Is Archived', key: 'is_archived', width: 12 },
            { header: 'Created At', key: 'created_at', width: 20 },
            { header: 'Updated At', key: 'updated_at', width: 20 }
        ];

        documents.forEach((doc: any) => {
            documentsSheet.addRow({
                title: doc.title || '',
                file_name: doc.file_name,
                document_type: doc.document_type || '',
                tags: doc.tags ? doc.tags.join(', ') : '',
                is_archived: doc.is_archived ? 'Yes' : 'No',
                created_at: formatDate(doc.created_at),
                updated_at: formatDate(doc.updated_at)
            });
        });

        documentsSheet.getRow(1).font = { bold: true };
        documentsSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9E1F2' }
        };

        // Sheet 9: Holdings
        const holdingsSheet = workbook.addWorksheet('Holdings');
        holdingsSheet.columns = [
            { header: 'Symbol', key: 'symbol', width: 15 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Quantity', key: 'quantity', width: 12 },
            { header: 'Avg Buy Price', key: 'avg_buy_price', width: 15 },
            { header: 'Asset Type', key: 'asset_type', width: 15 },
            { header: 'Notes', key: 'notes', width: 30 },
            { header: 'Created At', key: 'created_at', width: 20 },
            { header: 'Updated At', key: 'updated_at', width: 20 }
        ];

        holdings.forEach((holding: any) => {
            holdingsSheet.addRow({
                symbol: holding.symbol,
                name: holding.name || '',
                quantity: holding.quantity,
                avg_buy_price: formatCurrency(holding.avg_buy_price),
                asset_type: holding.asset_type,
                notes: holding.notes || '',
                created_at: formatDate(holding.created_at),
                updated_at: formatDate(holding.updated_at)
            });
        });

        holdingsSheet.getRow(1).font = { bold: true };
        holdingsSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9E1F2' }
        };

        // Sheet 10: Nominees
        const nomineesSheet = workbook.addWorksheet('Nominees');
        nomineesSheet.columns = [
            { header: 'Full Name', key: 'name', width: 25 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Relationship', key: 'relationship', width: 15 },
            { header: 'Access Level', key: 'access_level', width: 15 },
            { header: 'Is Verified', key: 'is_verified', width: 12 },
            { header: 'Created At', key: 'created_at', width: 20 },
            { header: 'Updated At', key: 'updated_at', width: 20 }
        ];

        nominees.forEach((nominee: any) => {
            nomineesSheet.addRow({
                name: nominee.name,
                email: nominee.email,
                relationship: nominee.relationship || '',
                access_level: nominee.access_level,
                is_verified: nominee.is_verified ? 'Yes' : 'No',
                created_at: formatDate(nominee.created_at),
                updated_at: formatDate(nominee.updated_at)
            });
        });

        nomineesSheet.getRow(1).font = { bold: true };
        nomineesSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9E1F2' }
        };

        // Sheet 11: Legacy Config
        if (inactivityConfig) {
            const legacySheet = workbook.addWorksheet('Legacy Config');
            legacySheet.columns = [
                { header: 'Setting', key: 'setting', width: 25 },
                { header: 'Value', key: 'value', width: 30 }
            ];

            legacySheet.addRows([
                { setting: 'Inactivity Days', value: inactivityConfig.inactivity_days },
                { setting: 'Last Activity At', value: formatDate(inactivityConfig.last_activity_at) },
                { setting: 'Enabled', value: inactivityConfig.enabled ? 'Yes' : 'No' },
                { setting: 'Created At', value: formatDate(inactivityConfig.created_at) },
                { setting: 'Updated At', value: formatDate(inactivityConfig.updated_at) }
            ]);

            legacySheet.getRow(1).font = { bold: true };
            legacySheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9E1F2' }
            };
        }

        // Generate Excel file
        const buffer = await workbook.xlsx.writeBuffer();

        // Create filename with current date
        const today = new Date().toISOString().split('T')[0];
        const filename = `vault_export_${today}.xlsx`;

        // Return file as download
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });

    } catch (error) {
        console.error('Excel export error:', error);
        return NextResponse.json(
            { error: 'Failed to generate Excel export' },
            { status: 500 }
        );
    }
}
