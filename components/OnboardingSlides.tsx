"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Shield, Users, Lock, ArrowRight, ChevronRight } from "lucide-react";

const slides = [
  {
    icon: TrendingUp,
    color: "bg-emerald-500",
    bgGradient: "from-emerald-950 via-emerald-900 to-slate-900",
    title: "Track All Your\nInvestments",
    subtitle: "Stocks, mutual funds, banking, insurance — everything in one secure place.",
    accent: "text-emerald-400",
  },
  {
    icon: Shield,
    color: "bg-blue-500",
    bgGradient: "from-blue-950 via-blue-900 to-slate-900",
    title: "Bank-Grade\nSecurity",
    subtitle: "Your data is encrypted with 256-bit SSL. We never share your information.",
    accent: "text-blue-400",
  },
  {
    icon: Users,
    color: "bg-purple-500",
    bgGradient: "from-purple-950 via-purple-900 to-slate-900",
    title: "Protect Your\nLoved Ones",
    subtitle: "Add nominees who get access to your portfolio when you need them most.",
    accent: "text-purple-400",
  },
  {
    icon: Lock,
    color: "bg-amber-500",
    bgGradient: "from-amber-950 via-amber-900 to-slate-900",
    title: "Smart Inactivity\nDetection",
    subtitle: "Auto-alerts to nominees if you're inactive. Your legacy, always protected.",
    accent: "text-amber-400",
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

  return (
    <div className={`min-h-screen bg-gradient-to-br ${slide.bgGradient} flex flex-col transition-all duration-700`}>
      {/* Skip button */}
      <div className="flex justify-end p-6 pt-12">
        <button
          onClick={handleGetStarted}
          className="text-white/50 text-sm font-medium hover:text-white/80 transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="flex flex-col items-center text-center"
          >
            {/* Icon */}
            <div className={`w-24 h-24 rounded-3xl ${slide.color} flex items-center justify-center mb-10 shadow-2xl`}>
              <Icon className="h-12 w-12 text-white" />
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold text-white leading-tight whitespace-pre-line tracking-tight">
              {slide.title}
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-base text-white/60 leading-relaxed max-w-xs">
              {slide.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom section */}
      <div className="px-8 pb-12 space-y-8">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? `w-6 h-2 ${slide.color}`
                  : "w-2 h-2 bg-white/20"
              }`}
            />
          ))}
        </div>

        {/* Next / Get Started button */}
        <button
          onClick={goNext}
          className={`w-full h-14 rounded-2xl ${slide.color} text-white font-semibold text-base flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform`}
        >
          {current === slides.length - 1 ? (
            <>
              Get Started
              <ArrowRight className="h-5 w-5" />
            </>
          ) : (
            <>
              Next
              <ChevronRight className="h-5 w-5" />
            </>
          )}
        </button>

        {/* Login link */}
        {current === slides.length - 1 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
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
      </div>
    </div>
  );
}
