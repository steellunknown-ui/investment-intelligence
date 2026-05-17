import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '../lib/api';
import { Gem, MapPin, Scale, Lock, ArrowLeft } from 'lucide-react-native';

export default function BelongingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [belongings, setBelongings] = useState<any[]>([]);

  const fetchBelongings = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await apiFetch('/api/belongings');
      setBelongings(data.belongings || []);
    } catch (error) {
      console.error('Error fetching belongings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBelongings();
  }, [fetchBelongings]);

  const onRefresh = useCallback(() => {
    fetchBelongings(true);
  }, [fetchBelongings]);

  // Utility to format numbers to Indian standard currency (INR)
  function formatCurrency(value: number) {
    if (value === undefined || value === null) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  }

  // Calculate total belongings value
  const totalBelongingsValue = belongings.reduce((acc, current) => acc + (current.current_estimated_value || 0), 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Syncing Valuables Vault...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color="#F9FAFB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Valuables Vault</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        
        {/* Belongings Total Value Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>TOTAL ESTIMATED VALUABLES VALUE</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalBelongingsValue)}</Text>
          <View style={styles.summaryFooter}>
            <Text style={styles.summaryFooterText}>Jewelry, Collectibles & Assets</Text>
            <Text style={styles.summaryCount}>{belongings.length} Registered {belongings.length === 1 ? 'Item' : 'Items'}</Text>
          </View>
        </View>

        {/* Real Assets Section */}
        <Text style={styles.sectionHeader}>Your Personal Valuables</Text>
        
        {belongings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Gem size={48} color="#4B5563" />
            <Text style={styles.emptyTitle}>No Valuables Registered</Text>
            <Text style={styles.emptyDesc}>
              Log in to the web platform to add personal belongings, gold jewelry, or high-value items to your vault.
            </Text>
          </View>
        ) : (
          belongings.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.cardHeader}>
                <View style={styles.itemIconWrapper}>
                  <Gem size={22} color="#8B5CF6" />
                </View>
                <View style={styles.itemMeta}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.item_name}</Text>
                  <Text style={styles.itemCategory}>
                    {item.category.toUpperCase()} {item.material ? `• ${item.material.toUpperCase()}` : ''}
                  </Text>
                </View>
                <View style={[styles.statusBadge, item.status === 'in_locker' ? styles.statusLocker : styles.statusPossession]}>
                  {item.status === 'in_locker' ? (
                    <Lock size={10} color="#F59E0B" style={{ marginRight: 2 }} />
                  ) : null}
                  <Text style={[styles.statusText, item.status === 'in_locker' ? styles.textLocker : styles.textPossession]}>
                    {item.status === 'in_locker' ? 'IN LOCKER' : 'POSSESSION'}
                  </Text>
                </View>
              </View>

              {/* Valuation Panel */}
              <View style={styles.valuationPanel}>
                <View style={styles.valuationCol}>
                  <Text style={styles.valLabel}>Est. Value</Text>
                  <Text style={styles.valAmount}>{formatCurrency(item.current_estimated_value)}</Text>
                </View>
                <View style={styles.valuationDivider} />
                <View style={styles.valuationCol}>
                  <Text style={styles.valLabel}>Purchase Value</Text>
                  <Text style={styles.valAmountSecondary}>{formatCurrency(item.purchase_value)}</Text>
                </View>
              </View>

              {/* Footer Details */}
              <View style={styles.cardFooter}>
                <View style={styles.locationWrapper}>
                  <MapPin size={12} color="#9CA3AF" style={{ marginRight: 6 }} />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {item.storage_location || 'Not Specified'}
                  </Text>
                </View>
                {item.weight_grams && (
                  <View style={styles.weightWrapper}>
                    <Scale size={12} color="#9CA3AF" style={{ marginRight: 6 }} />
                    <Text style={styles.weightText}>{item.weight_grams} g</Text>
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
  summaryFooterText: {
    fontSize: 12,
    color: '#A78BFA',
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
  itemCard: {
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
  itemIconWrapper: {
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
  itemMeta: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  itemCategory: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  statusLocker: {
    backgroundColor: '#F59E0B15',
    borderColor: '#F59E0B50',
  },
  statusPossession: {
    backgroundColor: '#8B5CF615',
    borderColor: '#8B5CF650',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '600',
  },
  textLocker: {
    color: '#F59E0B',
  },
  textPossession: {
    color: '#A78BFA',
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
  locationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  locationText: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  weightWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
