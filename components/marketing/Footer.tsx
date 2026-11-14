"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const footerLinks = {
  product: [
    { name: "Features", href: "#features" },
    { name: "How it Works", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
    { name: "FAQ", href: "#faq" },
  ],
  company: [
    { name: "About", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Careers", href: "/careers" },
    { name: "Contact", href: "/contact" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Security", href: "/security" },
    { name: "Compliance", href: "/compliance" },
  ],
};

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-card text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column (1st Column comes 1st) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.6, delay: 0.0, ease: [0.22, 1, 0.36, 1] }}
            className="col-span-1"
          >
            <Link href="/" className="flex items-center gap-2.5 mb-4 group">
              <div className="h-9 w-9 rounded-xl bg-lime-400 dark:bg-[#BBF078] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <TrendingUp className="h-5 w-5 text-slate-950" />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                Investment Intelligence
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              Sovereign wealth intelligence, real-time UPI &amp; bank ledgering, and family continuity protection.
            </p>
          </motion.div>

          {/* Product Column (2nd Column comes 2nd) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <h3 className="text-xs font-mono uppercase tracking-wider font-bold mb-4 text-foreground">Product</h3>
            <ul className="space-y-2.5">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Company Column (3rd Column comes 3rd) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.6, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <h3 className="text-xs font-mono uppercase tracking-wider font-bold mb-4 text-foreground">Platform</h3>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Legal Column (4th Column comes 4th) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.6, delay: 0.36, ease: [0.22, 1, 0.36, 1] }}
          >
            <h3 className="text-xs font-mono uppercase tracking-wider font-bold mb-4 text-foreground">Security &amp; Legal</h3>
            <ul className="space-y-2.5">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/60 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Investment Intelligence Office. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-muted-foreground">
              Zero Data Selling • 256-bit AES Local Vault
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}