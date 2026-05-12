"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Shield, Users, Lock, ArrowRight, ChevronRight } from "lucide-react";

const slides = [
  {
    icon: TrendingUp,
    color: "bg-emerald-500",
    glowColor: "#10b981",
    bgGradient: "from-emerald-950 via-emerald-900 to-slate-900",
    title: "Track All Your\nInvestments",
    subtitle: "Stocks, mutual funds, banking, insurance — everything in one secure place.",
    accent: "text-emerald-400",
  },
  {
    icon: Shield,
    color: "bg-blue-500",
    glowColor: "#3b82f6",
    bgGradient: "from-blue-950 via-blue-900 to-slate-900",
    title: "Bank-Grade\nSecurity",
    subtitle: "Your data is encrypted with 256-bit SSL. We never share your information.",
    accent: "text-blue-400",
  },
  {
    icon: Users,
    color: "bg-purple-500",
    glowColor: "#a855f7",
    bgGradient: "from-purple-950 via-purple-900 to-slate-900",
    title: "Protect Your\nLoved Ones",
    subtitle: "Add nominees who get access to your portfolio when you need them most.",
    accent: "text-purple-400",
  },
  {
    icon: Lock,
    color: "bg-amber-500",
    glowColor: "#f59e0b",
    bgGradient: "from-amber-950 via-amber-900 to-slate-900",
    title: "Smart Inactivity\nDetection",
    subtitle: "Auto-alerts to nominees if you're inactive. Your legacy, always protected.",
    accent: "text-amber-400",
  },
];

// Unique entrance animation per slide icon
const iconEntrance = [
  // TrendingUp: shoots up from below with bounce
  {
    initial: { y: 70, opacity: 0, scale: 0.5 },
    animate: { y: 0, opacity: 1, scale: 1 },
    transition: { type: "spring" as const, stiffness: 320, damping: 20, delay: 0.1 },
  },
  // Shield: spins in from rotation + scale
  {
    initial: { scale: 0, opacity: 0, rotate: -90 },
    animate: { scale: 1, opacity: 1, rotate: 0 },
    transition: { type: "spring" as const, stiffness: 380, damping: 16, delay: 0.1 },
  },
  // Users: flips in (scaleX) like a reveal
  {
    initial: { scaleX: 0, scaleY: 0.4, opacity: 0 },
    animate: { scaleX: 1, scaleY: 1, opacity: 1 },
    transition: { type: "spring" as const, stiffness: 280, damping: 18, delay: 0.1 },
  },
  // Lock: drops from top + slight overshoot
  {
    initial: { y: -90, opacity: 0, rotate: 20 },
    animate: { y: 0, opacity: 1, rotate: 0 },
    transition: { type: "spring" as const, stiffness: 500, damping: 22, delay: 0.1 },
  },
];

// Unique idle animation per slide icon (continuous)
const iconIdle = [
  // TrendingUp: tilts like a graph
  {
    animate: { rotate: [0, 12, -8, 0] },
    transition: { duration: 3, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" as const },
  },
  // Shield: pulses — protection heartbeat
  {
    animate: { scale: [1, 1.18, 1] },
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as const },
  },
  // Users: gentle side-to-side sway
  {
    animate: { x: [0, 6, -6, 0] },
    transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" as const },
  },
  // Lock: jiggle like locking/unlocking
  {
    animate: { rotate: [0, -10, 10, -6, 6, 0] },
    transition: { duration: 0.7, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" as const },
  },
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
      className={`min-h-screen bg-gradient-to-br ${slide.bgGradient} flex flex-col transition-all duration-700 relative overflow-hidden`}
    >
      {/* Background glow orbs */}
      <motion.div
        key={`orb1-${current}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ duration: 0.7 }}
        className="absolute -top-24 -right-20 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: slide.glowColor }}
      />
      <motion.div
        key={`orb2-${current}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.12 }}
        transition={{ duration: 0.7 }}
        className="absolute bottom-20 -left-16 w-56 h-56 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: slide.glowColor }}
      />

      {/* Skip button */}
      <div className="flex justify-end p-6 pt-12 relative z-10">
        <button
          onClick={handleGetStarted}
          className="text-white/50 text-sm font-medium hover:text-white/80 transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-8 relative z-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="flex flex-col items-center text-center w-full"
          >
            {/* ── ICON SECTION ── */}
            {/* Entrance wrapper — unique per slide */}
            <motion.div
              initial={entrance.initial}
              animate={entrance.animate}
              transition={entrance.transition}
            >
              {/* Float wrapper — continuous idle float */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
              >
                {/* Glow ring */}
                <div className="relative mb-10">
                  <motion.div
                    className={`absolute inset-0 rounded-3xl blur-xl ${slide.color}`}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.35, 0.05, 0.35] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                  {/* Icon box */}
                  <div
                    className={`relative w-28 h-28 rounded-3xl ${slide.color} flex items-center justify-center shadow-2xl`}
                    style={{ boxShadow: `0 20px 60px ${slide.glowColor}55` }}
                  >
                    {/* Idle icon animation — unique per slide */}
                    <motion.div
                      animate={idle.animate}
                      transition={idle.transition}
                    >
                      <Icon className="h-14 w-14 text-white" strokeWidth={1.8} />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="text-4xl font-bold text-white leading-tight whitespace-pre-line tracking-tight"
            >
              {slide.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.4 }}
              className="mt-5 text-base text-white/60 leading-relaxed max-w-xs"
            >
              {slide.subtitle}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom section */}
      <div className="px-8 pb-12 space-y-6 relative z-10">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => goTo(i)}
              animate={{
                width: i === current ? 24 : 8,
                opacity: i === current ? 1 : 0.35,
              }}
              transition={{ duration: 0.3 }}
              className={`h-2 rounded-full ${slide.color}`}
            />
          ))}
        </div>

        {/* Next / Get Started button */}
        <motion.button
          onClick={goNext}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          className={`w-full h-14 rounded-2xl ${slide.color} text-white font-semibold text-base flex items-center justify-center gap-2 shadow-lg`}
          style={{ boxShadow: `0 8px 32px ${slide.glowColor}55` }}
        >
          {current === slides.length - 1 ? (
            <>
              Get Started
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 0.9, repeat: Infinity }}
              >
                <ArrowRight className="h-5 w-5" />
              </motion.div>
            </>
          ) : (
            <>
              Next
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 0.9, repeat: Infinity }}
              >
                <ChevronRight className="h-5 w-5" />
              </motion.div>
            </>
          )}
        </motion.button>

        {/* Login link — last slide only */}
        <AnimatePresence>
          {current === slides.length - 1 && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center text-white/50 text-sm"
            >
              Already have an account?{" "}
              <button
                onClick={() => {
                  localStorage.setItem("onboarding_done", "true");
                  router.push("/login");
                }}
                className="text-white font-medium underline underline-offset-2"
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
