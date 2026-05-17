import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { safeStorage } from '../lib/safe-storage';
import { TrendingUp, Shield, Users, Lock, ArrowRight, ChevronRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const slides = [
  {
    icon: TrendingUp,
    color: '#10B981', // Emerald
    bgHex: '#022C22',
    glowColor: 'rgba(16, 185, 129, 0.25)',
    title: 'Track All Your\nInvestments',
    subtitle: 'Stocks, mutual funds, banking, insurance — everything in one secure place.',
    accent: '#34D399',
  },
  {
    icon: Shield,
    color: '#3B82F6', // Blue
    bgHex: '#172554',
    glowColor: 'rgba(59, 130, 246, 0.25)',
    title: 'Bank-Grade\nSecurity',
    subtitle: 'Your data is encrypted with 256-bit SSL. We never share your information.',
    accent: '#60A5FA',
  },
  {
    icon: Users,
    color: '#A855F7', // Purple
    bgHex: '#3B0764',
    glowColor: 'rgba(168, 85, 247, 0.25)',
    title: 'Protect Your\nLoved Ones',
    subtitle: 'Add nominees who get access to your portfolio when you need them most.',
    accent: '#C084FC',
  },
  {
    icon: Lock,
    color: '#F59E0B', // Amber
    bgHex: '#451A03',
    glowColor: 'rgba(245, 158, 11, 0.25)',
    title: 'Smart Inactivity\nDetection',
    subtitle: "Auto-alerts to nominees if you're inactive. Your legacy, always protected.",
    accent: '#FBBF24',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);

  const handleGetStarted = async () => {
    await safeStorage.setItem('onboarding_done', 'true');
    router.replace('/(auth)/login');
  };

  const goNext = () => {
    if (current < slides.length - 1) {
      setCurrent((prev) => prev + 1);
    } else {
      handleGetStarted();
    }
  };

  const slide = slides[current];
  const IconComponent = slide.icon;

  return (
    <View style={[styles.container, { backgroundColor: slide.bgHex }]}>
      
      {/* Background Glow Orbs */}
      <View style={[styles.glowOrbTop, { backgroundColor: slide.color }]} />
      <View style={[styles.glowOrbBottom, { backgroundColor: slide.color }]} />

      <SafeAreaView style={styles.safeArea}>
        
        {/* Skip button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGetStarted} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Slide Content */}
        <View style={styles.slideContent}>
          
          {/* Icon Box with Outer Glow Ring */}
          <View style={styles.iconGlowContainer}>
            <View style={[styles.glowRing, { backgroundColor: slide.glowColor }]} />
            <View style={[
              styles.iconWrapper, 
              { 
                backgroundColor: slide.color,
                shadowColor: slide.color,
                shadowOffset: { width: 0, height: 16 },
                shadowOpacity: 0.3,
                shadowRadius: 30,
              }
            ]}>
              <IconComponent size={48} color="#FFFFFF" strokeWidth={1.8} />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{slide.title}</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>{slide.subtitle}</Text>

        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          
          {/* Progress dots */}
          <View style={styles.progressContainer}>
            {slides.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setCurrent(i)}
                style={[
                  styles.dot,
                  i === current ? [styles.activeDot, { backgroundColor: slide.color }] : styles.inactiveDot
                ]}
              />
            ))}
          </View>

          {/* Next / Get Started button */}
          <TouchableOpacity
            style={[
              styles.primaryButton, 
              { 
                backgroundColor: slide.color,
                shadowColor: slide.color,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 16,
              }
            ]}
            onPress={goNext}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>
              {current === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            {current === slides.length - 1 ? (
              <ArrowRight size={18} color="#FFFFFF" style={styles.btnIcon} />
            ) : (
              <ChevronRight size={18} color="#FFFFFF" style={styles.btnIcon} />
            )}
          </TouchableOpacity>

          {/* Login link — last slide only */}
          {current === slides.length - 1 ? (
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={handleGetStarted}>
                <Text style={styles.signInText}>Sign in</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.footerPlaceholder} />
          )}

        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glowOrbTop: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.15,
  },
  glowOrbBottom: {
    position: 'absolute',
    bottom: 80,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  slideContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconGlowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.8,
  },
  iconWrapper: {
    width: 104,
    height: 104,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  primaryButton: {
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  btnIcon: {
    marginLeft: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 20,
  },
  footerPlaceholder: {
    height: 20,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
  },
  signInText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
