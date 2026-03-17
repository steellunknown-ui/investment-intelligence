import Link from "next/link";
import { TrendingUp } from "lucide-react";

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
    <footer className="relative overflow-hidden border-t border-border" style={{ background: 'var(--footer-bg)', color: 'hsl(var(--section-text))' }}>
      {/* White grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS1vcGFjaXR5PSIwLjEiPjxwYXRoIGQ9Ik0wIDBoMzJ2MzJIMHoiLz48L2c+PC9zdmc+')] opacity-50 z-0" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold">
                Investment Intelligence
              </span>
            </Link>
            <p className="text-sm opacity-80 max-w-xs">
              Secure your investment legacy with professional portfolio management and nominee protection.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm opacity-80 hover:opacity-100 transition-opacity"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm opacity-80 hover:opacity-100 transition-opacity"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm opacity-80 hover:opacity-100 transition-opacity"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center relative">
          <p className="text-sm opacity-80">
            © 2024 Investment Intelligence. All rights reserved.
          </p>

          <div className="flex flex-col items-center gap-1 my-4 sm:my-0 sm:absolute sm:left-1/2 sm:-translate-x-1/2">
            <span className="text-sm opacity-80 font-medium tracking-wide">Powered By Infinx Technology Solutions Pvt Ltd</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-xs opacity-80">
              Bank-grade security • 256-bit encryption
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}