"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { OnboardingSlides } from "@/components/OnboardingSlides";
import {
  TrendingUp,
  Shield,
  Users,
  Bell,
  Clock,
  Lock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Star,
  Quote,
} from "lucide-react";
import { PublicChatbot } from "@/components/marketing/PublicChatbot";


const features = [
  {
    icon: TrendingUp,
    title: "Portfolio Tracking",
    description: "Track all your investments in one place. Stocks, ETFs, mutual funds, crypto, and more.",
  },
  {
    icon: Users,
    title: "Nominee Management",
    description: "Add trusted contacts who can access your portfolio information during emergencies.",
  },
  {
    icon: Clock,
    title: "Inactivity Detection",
    description: "Automatic alerts when your account shows signs of extended inactivity.",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description: "Get notified about important changes, security events, and portfolio updates.",
  },
  {
    icon: Shield,
    title: "Bank-Grade Security",
    description: "Your data is encrypted end-to-end with 256-bit SSL encryption.",
  },
  {
    icon: Lock,
    title: "Privacy First",
    description: "We never sell your data. Your financial information stays private.",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Add Your Holdings",
    description: "Enter your investments manually or import from your broker. Track stocks, ETFs, mutual funds, and more.",
  },
  {
    step: "02",
    title: "Set Up Nominees",
    description: "Add up to 3 trusted contacts who can access your portfolio information in case of emergency.",
  },
  {
    step: "03",
    title: "Stay Protected",
    description: "Our system monitors your activity. If you're inactive for too long, your nominees get notified.",
  },
];

const faqs = [
  {
    question: "What is Investment Intelligence?",
    answer: "Investment Intelligence is a portfolio management platform that helps you track your investments and ensure your loved ones can access your financial information in case of emergency or extended inactivity.",
  },
  {
    question: "How does nominee access work?",
    answer: "You can add up to 3 trusted contacts as nominees. They will be notified and granted read-only access to your portfolio if our system detects extended inactivity on your account.",
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use bank-grade 256-bit SSL encryption to protect your data. We never sell your information to third parties, and all data is stored securely in compliance with industry standards.",
  },
  {
    question: "What types of investments can I track?",
    answer: "You can track stocks, ETFs, mutual funds, bonds, cryptocurrency, and other asset types. Our flexible system allows you to customize categories for your specific needs.",
  },
  {
    question: "How does inactivity detection work?",
    answer: "You can configure an inactivity period (15, 30, or 45 days). If you don't log in during this period, we'll first send you reminders. If there's still no activity, your nominees will be notified.",
  },
  {
    question: "Is there a free trial?",
    answer: "Yes! You can sign up for free and start tracking your portfolio immediately. Premium features are available for subscribers.",
  },
];

// Stats for social proof
const stats = [
  { value: "10,000+", label: "Active Investors" },
  { value: "₹500Cr+", label: "Assets Tracked" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9/5", label: "User Rating" },
];

// Testimonials
const testimonials = [
  {
    name: "Rajesh Kumar",
    role: "IT Professional, Bangalore",
    content: "Investment Intelligence gave me peace of mind knowing my family can access my portfolio details if something happens to me. The nominee feature is a game-changer.",
    avatar: "RK",
  },
  {
    name: "Priya Sharma",
    role: "Business Owner, Mumbai",
    content: "Finally, a platform that understands the importance of financial legacy planning. The inactivity detection feature is brilliant and exactly what I was looking for.",
    avatar: "PS",
  },
  {
    name: "Amit Patel",
    role: "Doctor, Delhi",
    content: "I track all my investments here - stocks, mutual funds, crypto. The dashboard is clean and the security features are top-notch. Highly recommended!",
    avatar: "AP",
  },
];

// Benefits for Why Choose Us section
const benefits = [
  {
    title: "All-in-One Dashboard",
    description: "View stocks, mutual funds, crypto, and more in a single unified dashboard with real-time updates.",
  },
  {
    title: "Family Protection",
    description: "Ensure your loved ones can access important financial information when they need it most.",
  },
  {
    title: "Smart Notifications",
    description: "Get alerts for price changes, portfolio milestones, and important security events.",
  },
  {
    title: "Secure Document Storage",
    description: "Store important financial documents securely and share them with your nominees.",
  },
];

// Animation variants for scroll-triggered card animations
const cardVariants = {
  hidden: {
    opacity: 0,
    y: 40,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: 0.3,
      ease: "easeIn" as const
    }
  }
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    },
  },
};

export default function HomePage() {
  const router = useRouter();
  const [isMobileApp, setIsMobileApp] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(true);

  useEffect(() => {
    const isCapacitor = !!(window as any).Capacitor;
    const done = localStorage.getItem("onboarding_done") === "true";
    setIsMobileApp(isCapacitor);
    setOnboardingDone(done);
  }, []);

  if (isMobileApp && !onboardingDone) {
    return <OnboardingSlides />;
  }
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero Section - Dark theme */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: 'var(--section-bg)', color: 'hsl(var(--section-text))' }}>
        {/* White grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS1vcGFjaXR5PSIwLjEiPjxwYXRoIGQ9Ik0wIDBoMzJ2MzJIMHoiLz48L2c+PC9zdmc+')] opacity-50 z-[5]" />

        {/* Subtle white radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-3xl animate-subtle-glow z-[1]" />

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 dark:bg-white/10 text-[hsl(var(--section-text))] text-sm font-medium mb-8 border border-white/20 backdrop-blur-sm"
          >
            <Sparkles className="h-4 w-4" />
            Secure your investment legacy
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold text-[hsl(var(--section-text))] leading-tight tracking-tight"
          >
            Track, Protect &{" "}
            <span className="text-[hsl(var(--section-text))]">Secure</span>
            <br />
            Your Investments
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-[hsl(var(--section-text))] opacity-90 max-w-2xl mx-auto"
          >
            The smart portfolio platform that ensures your loved ones can access your investments when it matters most.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              onClick={() => router.push("/signup")}
              size="lg"
              variant="ghost"
              className="w-full sm:w-auto px-8 py-4 text-lg bg-accent text-black hover:bg-accent/90 hover:text-black font-semibold shadow-lg shadow-accent/25 border border-accent/10"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push("/login")}
              size="lg"
              className="w-full sm:w-auto px-8 py-4 text-lg bg-[hsl(var(--section-text))]/5 backdrop-blur-md border border-[hsl(var(--section-text))]/30 text-[hsl(var(--section-text))] hover:bg-[hsl(var(--section-text))]/10 hover:text-[hsl(var(--section-text))] hover:scale-105 hover:shadow-md transition-all duration-200"
            >
              Login
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 flex items-center justify-center gap-8 text-slate-400 text-sm"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              Free to start
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              No credit card
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              256-bit encryption
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-slate-600 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-slate-500 rounded-full animate-bounce" />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="section-spacing bg-background relative overflow-hidden">
        {/* Shiny grid background */}
        <div className="grid-pattern-full dark:opacity-50" />
        <div className="max-w-7xl mx-auto page-padding relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Everything you need to protect your wealth
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete platform for tracking investments and ensuring your financial legacy is protected.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            className="mt-16 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={cardVariants}
                whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2 } }}
                className="group relative h-[110px] p-4 card-base card-hover flex gap-3 items-start"
              >
                <div className="icon-container">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[14px] font-semibold text-foreground leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-[12px] text-muted-foreground line-clamp-2 mt-1">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="section-spacing bg-muted relative overflow-hidden">
        {/* Shiny grid background */}
        <div className="grid-pattern-full dark:opacity-50" />
        <div className="max-w-7xl mx-auto page-padding relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              How it works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in just 3 simple steps
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            className="mt-16 grid gap-4 lg:grid-cols-3"
          >
            {howItWorks.map((item, index) => (
              <motion.div
                key={item.step}
                variants={cardVariants}
                whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2 } }}
                className="relative"
              >
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-slate-300 to-transparent" />
                )}
                <div className="card-base card-hover p-4 h-[95px] flex flex-col">
                  <div className="text-3xl font-bold text-primary">
                    {item.step}
                  </div>
                  <h3 className="mt-2 text-[14px] font-semibold text-foreground leading-tight">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-[12px] text-muted-foreground line-clamp-1">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-12 text-center"
          >
            <Button
              onClick={() => router.push("/signup")}
              size="lg"
              variant="ghost"
              className="px-8 bg-accent text-black hover:bg-accent/90 hover:text-black font-semibold shadow-sm border border-accent/10"
            >
              Start Protecting Your Portfolio
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 relative overflow-hidden" style={{ background: 'var(--section-bg)', color: 'hsl(var(--section-text))' }}>
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS1vcGFjaXR5PSIwLjEiPjxwYXRoIGQ9Ik0wIDBoMzJ2MzJIMHoiLz48L2c+PC9zdmc+')] opacity-50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={cardVariants}
                className="text-center"
              >
                <div className="text-3xl sm:text-4xl font-bold text-[hsl(var(--section-text))]">{stat.value}</div>
                <div className="mt-2 text-sm text-[hsl(var(--section-text))] opacity-80">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section-spacing bg-background relative overflow-hidden">
        <div className="grid-pattern-full dark:opacity-50" />
        <div className="max-w-7xl mx-auto page-padding relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Loved by investors across India
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              See what our users have to say about Investment Intelligence
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            className="mt-12 grid gap-6 md:grid-cols-3"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                variants={cardVariants}
                whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2 } }}
                className="card-base p-6 bg-card"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <Quote className="h-6 w-6 text-emerald-200 mb-3" />
                <p className="text-muted-foreground text-sm leading-relaxed">{testimonial.content}</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="section-spacing bg-background relative z-10">
        <div className="max-w-7xl mx-auto page-padding">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                Why choose Investment Intelligence?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                We built this platform because we believe everyone deserves peace of mind about their financial legacy.
              </p>
              <div className="mt-8 space-y-6">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="icon-container shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{benefit.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="card-base p-8 bg-gradient-to-br from-primary/5 to-card">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-card rounded-xl shadow-sm border border-border">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">Stocks & ETFs</div>
                        <div className="text-xs text-muted-foreground">12 holdings tracked</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-primary">+12.4%</div>
                      <div className="text-xs text-muted-foreground">₹4,50,000</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-card rounded-xl shadow-sm border border-border">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">Mutual Funds</div>
                        <div className="text-xs text-muted-foreground">8 holdings tracked</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-primary">+8.2%</div>
                      <div className="text-xs text-muted-foreground">₹2,80,000</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-card rounded-xl shadow-sm border border-border">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Lock className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">Fixed Deposits</div>
                        <div className="text-xs text-muted-foreground">3 holdings tracked</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-primary">+7.0%</div>
                      <div className="text-xs text-muted-foreground">₹1,50,000</div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-primary/10 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                  <div className="flex items-center gap-2 text-primary dark:text-accent">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">2 Nominees configured</span>
                  </div>
                  <p className="mt-1 text-xs text-primary dark:text-primary">Your family is protected</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="section-spacing bg-background relative z-10">
        <div className="max-w-3xl mx-auto page-padding">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Frequently asked questions
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to know about Investment Intelligence
            </p>
          </motion.div>

          <motion.div
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
            className="mt-12 card-base p-6 sm:p-8 bg-card relative z-10"
          >
            <Accordion type="single" collapsible>
              {faqs.map((faq, index) => (
                <AccordionItem key={faq.question} value={`item-${index}`} title={faq.question}>
                  {faq.answer}
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-spacing relative overflow-hidden bg-white text-slate-900 border-t border-b border-slate-100">
        {/* Dark grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS1vcGFjaXR5PSIwLjA1Ij48cGF0aCBkPSJNMCAwaDMydjMySDB6Ii8+PC9nPjwvc3ZnPg==')] opacity-50 z-0" />
        <div className="max-w-4xl mx-auto page-padding text-center relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight"
          >
            Ready to secure your investment legacy?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto"
          >
            Join thousands of investors who trust Investment Intelligence to protect their portfolios.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              onClick={() => router.push("/signup")}
              size="lg"
              variant="ghost"
              className="w-full sm:w-auto px-8 py-4 bg-accent text-black hover:bg-accent/90 hover:text-black font-semibold shadow-lg shadow-accent/25 border border-accent/10"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
      <PublicChatbot />
    </div>
  );
}
