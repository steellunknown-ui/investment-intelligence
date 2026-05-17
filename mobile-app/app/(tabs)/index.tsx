import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Image, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { apiFetch } from '../../lib/api';
import { Wallet, Landmark, Gem, ArrowRightLeft, Briefcase, LogIn, RefreshCw, User } from 'lucide-react-native';

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [netWorthData, setNetWorthData] = useState<any>(null);
  const [lastLoginAt, setLastLoginAt] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // 1. Fetch Net Worth
      const netWorth = await apiFetch('/api/dashboard/net-worth');
      setNetWorthData(netWorth);

      // 2. Fetch Last Login
      try {
        const loginData = await apiFetch('/api/dashboard/last-login');
        setLastLoginAt(loginData.lastLoginAt || null);
      } catch (e) {
        console.warn('Failed to fetch last login timestamp:', e);
      }

      // 3. Fetch User Profile for greetings & avatar
      try {
        const profile = await apiFetch('/api/profile');
        setUserProfile(profile);
      } catch (e) {
        console.warn('Failed to fetch user profile:', e);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // Utility to format numbers to Indian standard currency (INR)
  function formatCurrency(value: number) {
    if (value === undefined || value === null) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  }

  // Utility to format relative date activity
  function formatLastActivity(dateString: string | null) {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  }

  // Quick Stat Cards Data
  const statBreakdown = [
    {
      label: 'Cash & Bank',
      value: formatCurrency(netWorthData?.bankBalanceTotal || 0),
      count: `${netWorthData?.bank_accounts || 0} Accounts`,
      icon: Wallet,
      color: '#3B82F6', // Blue
      route: '/banking',
    },
    {
      label: 'Real Assets',
      value: formatCurrency(netWorthData?.assetsTotalValue || 0),
      count: `${netWorthData?.assets_count || 0} Assets`,
      icon: Landmark,
      color: '#6366F1', // Indigo
      route: '/assets',
    },
    {
      label: 'Belongings',
      value: formatCurrency(netWorthData?.belongingsTotalValue || 0),
      count: `${netWorthData?.belongings_count || 0} Items`,
      icon: Gem,
      color: '#8B5CF6', // Violet
      route: '/belongings',
    },
    {
      label: 'Receivables',
      value: formatCurrency(netWorthData?.receivablesOutstandingTotal || 0),
      count: `${netWorthData?.receivables_count || 0} Items`,
      icon: ArrowRightLeft,
      color: '#06B6D4', // Cyan
      route: null, // Running background DB sync
    },
    {
      label: 'Liabilities',
      value: formatCurrency(netWorthData?.liabilitiesOutstandingTotal || 0),
      count: `${netWorthData?.liabilities_count || 0} Loans`,
      icon: Briefcase,
      color: '#EF4444', // Red
      route: '/liabilities',
    },
    {
      label: 'Last Login',
      value: formatLastActivity(lastLoginAt),
      count: 'Security Log',
      icon: LogIn,
      color: '#10B981', // Emerald
      route: null,
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Recalculating Portfolio...</Text>
      </View>
    );
  }

  // Retrieve user metadata details
  const userName = userProfile?.full_name || userProfile?.email?.split('@')[0] || 'User';
  const avatarUrl = userProfile?.avatar_url;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        
        {/* Top Header Greetings */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingText}>Welcome back,</Text>
            <Text style={styles.nameText}>{userName}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/settings')} style={styles.avatarButton}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={20} color="#9CA3AF" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Big Net Worth Card */}
        <View style={styles.netWorthCard}>
          <View style={styles.netWorthHeader}>
            <Text style={styles.netWorthLabel}>TOTAL NET WORTH</Text>
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>Live Aggregation</Text>
            </View>
          </View>

          <Text style={styles.netWorthValue}>{formatCurrency(netWorthData?.netWorth || 0)}</Text>

          <View style={styles.netWorthFooter}>
            <Text style={styles.updateText}>
              Updated {formatLastActivity(netWorthData?.updatedAt || null)}
            </Text>
            <TouchableOpacity onPress={() => fetchData(true)} style={styles.syncButton}>
              <RefreshCw size={14} color="#93C5FD" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Breakdown Grid Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Overview Dashboard</Text>
          <View style={styles.divider} />
        </View>

        {/* 6-Card Breakdown Grid */}
        <View style={styles.gridContainer}>
          {statBreakdown.map((item, idx) => {
            const IconComponent = item.icon;
            const isClickable = !!item.route;
            
            return (
              <TouchableOpacity
                key={idx}
                style={styles.gridCard}
                onPress={() => isClickable && router.push(item.route as any)}
                disabled={!isClickable}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconWrapper, { backgroundColor: `${item.color}15` }]}>
                    <IconComponent size={20} color={item.color} />
                  </View>
                  <Text style={styles.cardLabel} numberOfLines={1}>{item.label}</Text>
                </View>

                <Text style={styles.cardValue} numberOfLines={1}>{item.value}</Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.cardCount}>{item.count}</Text>
                  {isClickable && (
                    <Text style={[styles.viewLink, { color: item.color }]}>View</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  greetingText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  nameText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
    marginTop: 2,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  netWorthCard: {
    backgroundColor: '#1E293B', // Beautiful deep royal blue/indigo card color
    borderRadius: 24,
    padding: 24,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#2563EB40',
    // Premium indigo-royal blue shadow effect
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 6,
  },
  netWorthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  netWorthLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#93C5FD',
    letterSpacing: 1.5,
  },
  liveBadge: {
    backgroundColor: '#2563EB30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 0.5,
    borderColor: '#3B82F660',
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#60A5FA',
  },
  netWorthValue: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  netWorthFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  updateText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  syncButton: {
    padding: 4,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#F3F4F6',
  },
  divider: {
    height: 1,
    backgroundColor: '#1F2937',
    marginTop: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48%', // Sets up a neat 2-column grid layout
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    justifyContent: 'space-between',
    minHeight: 128,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    flex: 1,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardCount: {
    fontSize: 11,
    color: '#6B7280',
  },
  viewLink: {
    fontSize: 11,
    fontWeight: '600',
  },
});
