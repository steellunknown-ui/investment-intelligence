import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '../lib/api';
import { Building2, Landmark, Shield, User, ArrowLeft } from 'lucide-react-native';

export default function BankingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);

  const fetchAccounts = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await apiFetch('/api/banking/accounts');
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const onRefresh = useCallback(() => {
    fetchAccounts(true);
  }, [fetchAccounts]);

  // Utility to format numbers to Indian standard currency (INR)
  function formatCurrency(value: number) {
    if (value === undefined || value === null) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  }

  // Mask bank account numbers for safety (e.g. •••• 5678)
  function maskAccountNumber(accNum: string) {
    if (!accNum) return '••••';
    const cleanNum = accNum.toString().trim();
    if (cleanNum.length <= 4) return cleanNum;
    return `•••• ${cleanNum.slice(-4)}`;
  }

  // Calculate total balance
  const totalBalance = accounts.reduce((acc, current) => acc + (current.current_balance || 0), 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Syncing Bank Vault...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color="#F9FAFB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Banking Portfolio</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        
        {/* Cash & Bank Balance Overview Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>TOTAL CASH & BANK BALANCE</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalBalance)}</Text>
          <View style={styles.summaryFooter}>
            <View style={styles.shieldWrapper}>
              <Shield size={14} color="#10B981" />
              <Text style={styles.summaryFooterText}>Secure Bank-level Encryption</Text>
            </View>
            <Text style={styles.summaryCount}>{accounts.length} Linked {accounts.length === 1 ? 'Account' : 'Accounts'}</Text>
          </View>
        </View>

        {/* Bank Accounts Section */}
        <Text style={styles.sectionHeader}>Your Bank Accounts</Text>
        
        {accounts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Building2 size={48} color="#4B5563" />
            <Text style={styles.emptyTitle}>No Bank Accounts Linked</Text>
            <Text style={styles.emptyDesc}>
              Log in to the web platform to link your bank accounts and manage financial intelligence configurations securely.
            </Text>
          </View>
        ) : (
          accounts.map((account) => (
            <View key={account.id} style={styles.accountCard}>
              <View style={styles.cardHeader}>
                <View style={styles.bankLogoWrapper}>
                  <Landmark size={24} color="#3B82F6" />
                </View>
                <View style={styles.bankDetails}>
                  <Text style={styles.bankName}>{account.bank_name}</Text>
                  <Text style={styles.accNumber}>
                    {account.account_type.toUpperCase()} • {maskAccountNumber(account.account_number)}
                  </Text>
                </View>
                <View style={[styles.statusBadge, account.status === 'active' ? styles.statusActive : styles.statusInactive]}>
                  <Text style={styles.statusText}>{account.status.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.cardMain}>
                <Text style={styles.balanceLabel}>Current Balance</Text>
                <Text style={styles.balanceValue}>{formatCurrency(account.current_balance)}</Text>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.holderWrapper}>
                  <User size={12} color="#9CA3AF" style={{ marginRight: 6 }} />
                  <Text style={styles.holderName} numberOfLines={1}>
                    {account.account_holder_name}
                  </Text>
                </View>
                <Text style={styles.branchName} numberOfLines={1}>
                  {account.branch_name || 'Main Branch'}
                </Text>
              </View>
            </View>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    backgroundColor: '#0B0F19',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0F19',
  },
  loadingText: {
    marginTop: 12,
    color: '#9CA3AF',
    fontSize: 14,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#374151',
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  summaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  shieldWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryFooterText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 6,
    fontWeight: '500',
  },
  summaryCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 16,
    paddingLeft: 4,
  },
  emptyContainer: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  accountCard: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bankLogoWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  bankDetails: {
    flex: 1,
  },
  bankName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  accNumber: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  statusActive: {
    backgroundColor: '#10B98115',
    borderColor: '#10B98160',
  },
  statusInactive: {
    backgroundColor: '#EF444415',
    borderColor: '#EF444460',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#10B981',
  },
  cardMain: {
    marginBottom: 16,
    backgroundColor: '#1F293760',
    padding: 12,
    borderRadius: 12,
  },
  balanceLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#1F2937',
    paddingTop: 12,
  },
  holderWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  holderName: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  branchName: {
    fontSize: 12,
    color: '#9CA3AF',
    maxWidth: 120,
  },
});
