import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutDashboard, Sparkles, Grid3X3, Bell, Settings } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6', // Royal blue active tint
        tabBarInactiveTintColor: '#6B7280', // Slate gray inactive
        tabBarStyle: {
          backgroundColor: '#0B0F19', // Dark premium midnight background
          borderTopWidth: 1,
          borderTopColor: '#1F2937',
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: '#0B0F19', // Deep dark screen header
          borderBottomWidth: 1,
          borderBottomColor: '#1F2937',
        },
        headerTitleStyle: {
          color: '#F9FAFB',
          fontSize: 18,
          fontWeight: '700',
          letterSpacing: 0.5,
        },
        headerShown: true,
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          headerShown: false, // Dashboard handles its own custom top welcome greet
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size || 22} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'AI Assistant',
          headerTitle: 'AI Financial Advisor',
          tabBarIcon: ({ color, size }) => <Sparkles size={size || 22} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          headerTitle: 'Financial Vault Modules',
          tabBarIcon: ({ color, size }) => <Grid3X3 size={size || 22} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          headerTitle: 'Security Audit logs',
          tabBarIcon: ({ color, size }) => <Bell size={size || 22} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerTitle: 'Vault Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size || 22} color={color} />,
        }}
      />
    </Tabs>
  );
}
