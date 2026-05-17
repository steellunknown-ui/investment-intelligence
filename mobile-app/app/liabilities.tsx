import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '../lib/api';
import { TrendingDown, Calendar, Percent, ShieldAlert, ArrowLeft } from 'lucide-react-native';

export default function LiabilitiesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [liabilities, setLiabilities] = useState<any[]>([]);

  const fetchLiabilities = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await apiFetch('/api/liabilities');
      setLiabilities(data.liabilities || []);
    } catch (error) {
      console.error('Error fetching liabilities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLiabilities();
  }, [fetchLiabilities]);

  const onRefresh = useCallback(() => {
    fetchLiabilities(true);
  }, [fetchLiabilities]);

  // Utility to format numbers to Indian standard currency (INR)
  function formatCurrency(value: number) {
    if (value === undefined || value === null) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  }

  // Calculate total outstanding
  const totalOutstanding = liabilities.reduce((acc, current) => {
    if (current.status === 'active') {
      return acc + (current.outstanding_amount || 0);
    }
    return acc;
  }, 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EF4444" />
        <Text style={styles.loadingText}>Syncing Debts Ledger...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color="#F9FAFB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Outstanding Debts</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EF4444" />
        }
      >
        
        {/* Liabilities Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>TOTAL OUTSTANDING DEBT</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalOutstanding)}</Text>
          <View style={styles.summaryFooter}>
            <View style={styles.alertWrapper}>
              <ShieldAlert size={14} color="#F59E0B" />
              <Text style={styles.summaryFooterText}>Active Collaterals Tracked</Text>
            </View>
            <Text style={styles.summaryCount}>
              {liabilities.filter(l => l.status === 'active').length} Active {liabilities.length === 1 ? 'Debt' : 'Debts'}
            </Text>
          </View>
        </View>

        {/* Real Assets Section */}
        <Text style={styles.sectionHeader}>Your Outstanding Liabilities</Text>
        
        {liabilities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <TrendingDown size={48} color="#4B5563" />
            <Text style={styles.emptyTitle}>Congratulations! No Debts Found</Text>
            <Text style={styles.emptyDesc}>
              Log in to the web platform to record any home loans, car loans, or active credit card cycles if needed.
            </Text>
          </View>
        ) : (
          liabilities.map((loan) => (
            <View key={loan.id} style={styles.loanCard}>
              <View style={styles.cardHeader}>
                <View style={styles.loanIconWrapper}>
                  <TrendingDown size={22} color="#EF4444" />
                </View>
                <View style={styles.loanMeta}>
                  <Text style={styles.loanName} numberOfLines={1}>
                    {loan.loan_name || loan.loan_type.toUpperCase()}
                  </Text>
                  <Text style={styles.lenderText}>
                    LENDER: {loan.taken_from.toUpperCase()}
                  </Text>
                </View>
                <View style={[styles.statusBadge, loan.status === 'active' ? styles.statusActive : styles.statusClosed]}>
                  <Text style={styles.statusText}>{loan.status.toUpperCase()}</Text>
                </View>
              </View>

              {/* Valuation Panel */}
              <View style={styles.valuationPanel}>
                <View style={styles.valuationCol}>
                  <Text style={styles.valLabel}>Outstanding</Text>
                  <Text style={styles.valAmount}>{formatCurrency(loan.outstanding_amount)}</Text>
                </View>
                <View style={styles.valuationDivider} />
                <View style={styles.valuationCol}>
                  <Text style={styles.valLabel}>EMI / Month</Text>
                  <Text style={styles.valAmountSecondary}>{formatCurrency(loan.emi_amount)}</Text>
                </View>
              </View>

              {/* Footer Details */}
              <View style={styles.cardFooter}>
                {loan.interest_rate && (
                  <View style={styles.interestWrapper}>
                    <Percent size={12} color="#9CA3AF" style={{ marginRight: 6 }} />
                    <Text style={styles.interestText}>{loan.interest_rate}% Interest</Text>
                  </View>
                )}
                {loan.loan_end_date && (
                  <View style={styles.dateWrapper}>
                    <Calendar size={12} color="#9CA3AF" style={{ marginRight: 6 }} />
                    <Text style={styles.dateText}>
                      Ends: {loan.loan_end_date}
                    </Text>
                  </View>
                )}
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
  alertWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryFooterText: {
    fontSize: 12,
    color: '#F59E0B',
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
  loanCard: {
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
  loanIconWrapper: {
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
  loanMeta: {
    flex: 1,
  },
  loanName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  lenderText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  statusActive: {
    backgroundColor: '#EF444415',
    borderColor: '#EF444450',
  },
  statusClosed: {
    backgroundColor: '#10B98115',
    borderColor: '#10B98150',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#EF4444',
  },
  valuationPanel: {
    flexDirection: 'row',
    backgroundColor: '#1F293760',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  valuationCol: {
    flex: 1,
  },
  valuationDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#374151',
    marginHorizontal: 12,
  },
  valLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  valAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  valAmountSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#1F2937',
    paddingTop: 12,
  },
  interestWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  interestText: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  dateWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
