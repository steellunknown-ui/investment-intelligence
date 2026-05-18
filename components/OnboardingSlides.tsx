"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Shield,
  Users,
  Sparkles,
  Bell,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

const slides = [
  {
    icon: TrendingUp,
    color: "bg-emerald-500",
    glowColor: "#10b981",
    bgFrom: "#022c22",
    bgTo: "#0f172a",
    title: "Track All Your\nInvestments",
    subtitle: "Stocks, mutual funds, banking, insurance — everything in one secure place.",
    accent: "text-emerald-400",
    tag: "Portfolio",
  },
  {
    icon: Shield,
    color: "bg-blue-500",
    glowColor: "#3b82f6",
    bgFrom: "#0c1a3a",
    bgTo: "#0f172a",
    title: "Bank-Grade\nSecurity",
    subtitle: "Your data is encrypted with 256-bit SSL. We never share your information.",
    accent: "text-blue-400",
    tag: "Security",
  },
  {
    icon: Sparkles,
    color: "bg-violet-500",
    glowColor: "#8b5cf6",
    bgFrom: "#1e0a3c",
    bgTo: "#0f172a",
    title: "AI-Powered\nInsights",
    subtitle: "Our AI analyzes your portfolio, detects risks, and gives smart recommendations — 24/7.",
    accent: "text-violet-400",
    tag: "AI",
    isAI: true,
  },
  {
    icon: Users,
    color: "bg-pink-500",
    glowColor: "#ec4899",
    bgFrom: "#3b0a2a",
    bgTo: "#0f172a",
    title: "Protect Your\nLoved Ones",
    subtitle: "Add nominees who get access to your portfolio when you need them most.",
    accent: "text-pink-400",
    tag: "Nominees",
  },
  {
    icon: Bell,
    color: "bg-amber-500",
    glowColor: "#f59e0b",
    bgFrom: "#2d1a00",
    bgTo: "#0f172a",
    title: "Smart Inactivity\nAlerts",
    subtitle: "Auto-alerts to nominees if you're inactive. Your legacy, always protected.",
    accent: "text-amber-400",
    tag: "Alerts",
  },
];

const iconEntrance = [
  { initial: { y: 70, opacity: 0, scale: 0.5 }, animate: { y: 0, opacity: 1, scale: 1 }, transition: { type: "spring" as const, stiffness: 320, damping: 20, delay: 0.1 } },
  { initial: { scale: 0, opacity: 0, rotate: -90 }, animate: { scale: 1, opacity: 1, rotate: 0 }, transition: { type: "spring" as const, stiffness: 380, damping: 16, delay: 0.1 } },
  { initial: { scale: 0.3, opacity: 0, rotate: 180 }, animate: { scale: 1, opacity: 1, rotate: 0 }, transition: { type: "spring" as const, stiffness: 300, damping: 18, delay: 0.1 } },
  { initial: { scaleX: 0, scaleY: 0.4, opacity: 0 }, animate: { scaleX: 1, scaleY: 1, opacity: 1 }, transition: { type: "spring" as const, stiffness: 280, damping: 18, delay: 0.1 } },
  { initial: { y: -90, opacity: 0, rotate: 20 }, animate: { y: 0, opacity: 1, rotate: 0 }, transition: { type: "spring" as const, stiffness: 500, damping: 22, delay: 0.1 } },
];

const iconIdle = [
  { animate: { rotate: [0, 12, -8, 0] }, transition: { duration: 3, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" as const } },
  { animate: { scale: [1, 1.18, 1] }, transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as const } },
  { animate: { rotate: [0, 360], scale: [1, 1.1, 1] }, transition: { rotate: { duration: 8, repeat: Infinity, ease: "linear" as const }, scale: { duration: 2, repeat: Infinity, ease: "easeInOut" as const } } },
  { animate: { x: [0, 6, -6, 0] }, transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" as const } },
  { animate: { rotate: [0, -10, 10, -6, 6, 0] }, transition: { duration: 0.7, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" as const } },
];

export function OnboardingSlides() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const goNext = () => {
    if (current < slides.length - 1) {
      setDirection(1);
      setCurrent((prev) => prev + 1);
    } else {
      handleGetStarted();
    }
  };

  const goTo = (index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };

  const handleGetStarted = () => {
    localStorage.setItem("onboarding_done", "true");
    router.push("/login");
  };

  const slide = slides[current];
  const Icon = slide.icon;
  const entrance = iconEntrance[current];
  const idle = iconIdle[current];

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${slide.bgFrom} 0%, ${slide.bgTo} 100%)`, transition: "background 0.7s ease" }}
    >
      {/* Background glow orbs */}
      <motion.div
        key={`orb1-${current}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.25, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="absolute -top-32 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: slide.glowColor }}
      />
      <motion.div
        key={`orb2-${current}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.15, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="absolute bottom-24 -left-20 w-64 h-64 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: slide.glowColor }}
      />
      {/* Extra center glow for AI slide */}
      {slide.isAI && (
        <motion.div
          key="ai-glow"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{ backgroundColor: slide.glowColor }}
        />
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-12 pb-2 relative z-10">
        {/* Tag pill */}
        <motion.div
          key={`tag-${current}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className={`px-3 py-1 rounded-full text-xs font-semibold text-white/80 border border-white/10`}
          style={{ backgroundColor: `${slide.glowColor}33` }}
        >
          {slide.tag}
        </motion.div>

        <button
          onClick={handleGetStarted}
          className="text-white/40 text-sm font-medium hover:text-white/70 transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-4 relative z-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            initial={{ opacity: 0, x: direction * 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: direction * -80, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex flex-col items-center text-center w-full"
          >
            {/* Icon */}
            <motion.div initial={entrance.initial} animate={entrance.animate} transition={entrance.transition}>
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              >
                <div className="relative mb-10">
                  {/* Glow ring pulse */}
                  <motion.div
                    className={`absolute inset-0 rounded-3xl blur-2xl ${slide.color}`}
                    animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0.05, 0.4] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                  {/* AI extra ring */}
                  {slide.isAI && (
                    <motion.div
                      className="absolute -inset-3 rounded-3xl border border-violet-400/30"
                      animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  {/* Icon box */}
                  <div
                    className={`relative w-32 h-32 rounded-3xl ${slide.color} flex items-center justify-center shadow-2xl`}
                    style={{ boxShadow: `0 24px 64px ${slide.glowColor}66` }}
                  >
                    <motion.div animate={idle.animate} transition={idle.transition}>
                      <Icon className="h-16 w-16 text-white" strokeWidth={1.6} />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.45 }}
              className="text-4xl font-bold text-white leading-tight whitespace-pre-line tracking-tight"
            >
              {slide.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.45 }}
              className="mt-5 text-base text-white/55 leading-relaxed max-w-xs"
            >
              {slide.subtitle}
            </motion.p>

            {/* AI badge */}
            {slide.isAI && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="mt-5 flex items-center gap-2 px-4 py-2 rounded-full border border-violet-400/30 bg-violet-500/10"
              >
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-violet-400"
                />
                <span className="text-xs text-violet-300 font-medium">Powered by Gemini AI</span>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom section */}
      <div className="px-8 pb-12 space-y-5 relative z-10">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {slides.map((s, i) => (
            <motion.button
              key={i}
              onClick={() => goTo(i)}
              animate={{ width: i === current ? 28 : 8, opacity: i === current ? 1 : 0.3 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="h-2 rounded-full"
              style={{ backgroundColor: i === current ? slide.glowColor : "#ffffff" }}
            />
          ))}
        </div>

        {/* Next / Get Started button */}
        <motion.button
          onClick={goNext}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          className={`w-full h-14 rounded-2xl ${slide.color} text-white font-semibold text-base flex items-center justify-center gap-2`}
          style={{ boxShadow: `0 8px 32px ${slide.glowColor}55` }}
        >
          {current === slides.length - 1 ? (
            <>
              Get Started
              <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 0.9, repeat: Infinity }}>
                <ArrowRight className="h-5 w-5" />
              </motion.div>
            </>
          ) : (
            <>
              Next
              <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 0.9, repeat: Infinity }}>
                <ChevronRight className="h-5 w-5" />
              </motion.div>
            </>
          )}
        </motion.button>

        {/* Sign in link — last slide only */}
        <AnimatePresence>
          {current === slides.length - 1 && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center text-white/40 text-sm"
            >
              Already have an account?{" "}
              <button
                onClick={() => { localStorage.setItem("onboarding_done", "true"); router.push("/login"); }}
                className="text-white font-semibold underline underline-offset-2"
              >
                Sign in
              </button>
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
