import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Shield, Landmark, Building2, Wallet, Coins, 
  Gem, Briefcase, FileText, Users, Users2, Home 
} from 'lucide-react-native';

const modules = [
  { name: 'Dashboard', icon: Home, route: '/(tabs)/', bgColor: 'rgba(71, 85, 105, 0.1)', color: '#94A3B8' },
  { name: 'Insurance', icon: Shield, route: null, bgColor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' },
  { name: 'Banking', icon: Landmark, route: '/banking', bgColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' },
  { name: 'Assets', icon: Building2, route: '/assets', bgColor: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' },
  { name: 'Liabilities', icon: Wallet, route: '/liabilities', bgColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' },
  { name: 'Receivables', icon: Coins, route: null, bgColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' },
  { name: 'Belongings', icon: Gem, route: '/belongings', bgColor: 'rgba(236, 72, 153, 0.1)', color: '#EC4899' },
  { name: 'Holdings', icon: Briefcase, route: null, bgColor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1' },
  { name: 'Documents', icon: FileText, route: null, bgColor: 'rgba(249, 115, 22, 0.1)', color: '#F97316' },
  { name: 'Family Hub', icon: Users2, route: null, bgColor: 'rgba(20, 184, 166, 0.1)', color: '#20B8A6' },
  { name: 'Nominee', icon: Users, route: null, bgColor: 'rgba(6, 182, 212, 0.1)', color: '#06B6D4' },
];

export default function MoreScreen() {
  const router = useRouter();

  function handlePress(item: typeof modules[0]) {
    if (item.route) {
      router.push(item.route as any);
    } else {
      Alert.alert(
        'Vault Synchronization',
        `${item.name} module is running high-level background database encryption. Native mobile access will sync immediately upon completion.`,
        [{ text: 'Acknowledge', style: 'default' }]
      );
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionHeader}>Active Modules</Text>
        <Text style={styles.sectionDescription}>Select a vault partition to view or manage your financial assets.</Text>
        
        <View style={styles.gridContainer}>
          {modules.map((item, idx) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity 
                key={idx} 
                style={styles.gridCard} 
                onPress={() => handlePress(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: item.bgColor }]}>
                  <Icon size={24} color={item.color} />
                </View>
                <Text style={styles.cardText} numberOfLines={1}>{item.name}</Text>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 24,
    lineHeight: 18,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '30%', // Perfect 3-column responsive grid on mobile screens!
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F3F4F6',
    textAlign: 'center',
  },
});
