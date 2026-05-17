import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';
import { apiFetch } from '../../lib/api';
import { User, LogOut, Shield, Key, Mail, Info } from 'lucide-react-native';

export default function SettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await apiFetch('/api/profile');
        setUserProfile(profile);
      } catch (error) {
        console.error('Failed to load profile settings:', error);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  async function handleLogout() {
    Alert.alert(
      'Confirm Sign Out',
      'Are you sure you want to sign out of your secure financial vault?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const { error } = await supabase.auth.signOut();
              if (error) {
                Alert.alert('Error', error.message);
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to sign out');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading Vault Settings...</Text>
      </View>
    );
  }

  const userName = userProfile?.full_name || userProfile?.email?.split('@')[0] || 'User';
  const userEmail = userProfile?.email || 'No email associated';
  const avatarUrl = userProfile?.avatar_url;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={36} color="#9CA3AF" />
              </View>
            )}
          </View>
          <Text style={styles.profileName}>{userName}</Text>
          <Text style={styles.profileEmail}>{userEmail}</Text>
          
          <View style={styles.shieldBadge}>
            <Shield size={14} color="#10B981" style={{ marginRight: 6 }} />
            <Text style={styles.shieldBadgeText}>Level 3 Encrypted Security</Text>
          </View>
        </View>

        {/* Security Settings Section */}
        <Text style={styles.sectionHeader}>Vault Configurations</Text>
        
        <View style={styles.menuContainer}>
          <View style={styles.menuItem}>
            <Mail size={18} color="#9CA3AF" style={styles.menuIcon} />
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Auth Channel</Text>
              <Text style={styles.menuValue}>{userEmail}</Text>
            </View>
          </View>

          <View style={styles.menuItem}>
            <Key size={18} color="#9CA3AF" style={styles.menuIcon} />
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Multi-Factor Authentication</Text>
              <Text style={styles.menuValue}>Standard Enabled</Text>
            </View>
          </View>

          <View style={styles.menuItem}>
            <Info size={18} color="#9CA3AF" style={styles.menuIcon} />
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>App Engine Version</Text>
              <Text style={styles.menuValue}>Expo v2.0 (Native React Native)</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={18} color="#FFFFFF" style={{ marginRight: 10 }} />
          <Text style={styles.logoutButtonText}>Sign Out of Vault</Text>
        </TouchableOpacity>

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
    alignItems: 'center',
  },
  profileCard: {
    width: '100%',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 10,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#3B82F6',
    overflow: 'hidden',
    marginBottom: 16,
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
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 6,
  },
  profileEmail: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  shieldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98115',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 0.5,
    borderColor: '#10B98150',
  },
  shieldBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#34D399',
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
    alignSelf: 'flex-start',
    marginBottom: 12,
    paddingLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuContainer: {
    width: '100%',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 32,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  menuIcon: {
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F3F4F6',
  },
  menuValue: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  logoutButton: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#EF4444',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
