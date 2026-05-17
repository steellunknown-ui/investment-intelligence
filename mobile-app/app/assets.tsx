import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '../lib/api';
import { Landmark, Compass, Percent, Calendar, ArrowLeft } from 'lucide-react-native';

export default function AssetsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);

  const fetchAssets = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await apiFetch('/api/assets');
      setAssets(data.assets || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const onRefresh = useCallback(() => {
    fetchAssets(true);
  }, [fetchAssets]);

  // Utility to format numbers to Indian standard currency (INR)
  function formatCurrency(value: number) {
    if (value === undefined || value === null) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  }

  // Calculate total market value
  const totalMarketValue = assets.reduce((acc, current) => acc + (current.current_market_value || 0), 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading Assets Vault...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color="#F9FAFB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Real Assets Portfolio</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        
        {/* Assets Value Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>TOTAL REAL ASSETS VALUE</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalMarketValue)}</Text>
          <View style={styles.summaryFooter}>
            <Text style={styles.summaryFooterText}>Land, Properties & Valuables</Text>
            <Text style={styles.summaryCount}>{assets.length} Registered {assets.length === 1 ? 'Asset' : 'Assets'}</Text>
          </View>
        </View>

        {/* Real Assets Section */}
        <Text style={styles.sectionHeader}>Your Portfolio Assets</Text>
        
        {assets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Landmark size={48} color="#4B5563" />
            <Text style={styles.emptyTitle}>No Assets Registered</Text>
            <Text style={styles.emptyDesc}>
              Log in to the web platform to add real estate, land, or gold assets to your secure portfolio vault.
            </Text>
          </View>
        ) : (
          assets.map((asset) => (
            <View key={asset.id} style={styles.assetCard}>
              <View style={styles.cardHeader}>
                <View style={styles.assetIconWrapper}>
                  <Landmark size={22} color="#6366F1" />
                </View>
                <View style={styles.assetMeta}>
                  <Text style={styles.assetName} numberOfLines={1}>{asset.asset_name}</Text>
                  <Text style={styles.assetCategory}>
                    {asset.asset_category.toUpperCase()} • {asset.asset_type.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.ownershipBadge}>
                  <Percent size={10} color="#818CF8" style={{ marginRight: 2 }} />
                  <Text style={styles.ownershipText}>{asset.ownership_percentage}% Sole</Text>
                </View>
              </View>

              {/* Valuation Panel */}
              <View style={styles.valuationPanel}>
                <View style={styles.valuationCol}>
                  <Text style={styles.valLabel}>Current Valuation</Text>
                  <Text style={styles.valAmount}>{formatCurrency(asset.current_market_value)}</Text>
                </View>
                <View style={styles.valuationDivider} />
                <View style={styles.valuationCol}>
                  <Text style={styles.valLabel}>Purchase Value</Text>
                  <Text style={styles.valAmountSecondary}>{formatCurrency(asset.purchase_value)}</Text>
                </View>
              </View>

              {/* Footer Details */}
              <View style={styles.cardFooter}>
                <View style={styles.locationWrapper}>
                  <Compass size={12} color="#9CA3AF" style={{ marginRight: 6 }} />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {asset.location || 'Not Specified'}
                  </Text>
                </View>
                {asset.purchase_date && (
                  <View style={styles.dateWrapper}>
                    <Calendar size={12} color="#9CA3AF" style={{ marginRight: 6 }} />
                    <Text style={styles.dateText}>
                      {asset.purchase_date}
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
  summaryFooterText: {
    fontSize: 12,
    color: '#818CF8',
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
  assetCard: {
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
  assetIconWrapper: {
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
  assetMeta: {
    flex: 1,
  },
  assetName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  assetCategory: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  ownershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F115',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#6366F150',
  },
  ownershipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#818CF8',
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
  dateWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
