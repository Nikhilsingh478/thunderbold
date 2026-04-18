import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, Instagram } from 'lucide-react';

type PolicyType = 'returns' | 'privacy' | 'terms' | null;

function PolicyModal({ type, onClose }: { type: PolicyType; onClose: () => void }) {
  if (!type) return null;

  const content = {
    returns: {
      title: 'Returns & Cancellation Policy',
      body: (
        <div className="space-y-6 text-sv-mid font-serif font-light text-sm leading-relaxed">
          <section>
            <h3 className="font-condensed text-xs tracking-[0.22em] uppercase text-brass mb-2">Order Confirmation</h3>
            <p>Every order placed on Thunderbolt goes through a manual verification step. Our team will reach out to you via a confirmation call before your order is processed. This ensures accuracy and gives you one final opportunity to review or amend your order details.</p>
          </section>
          <section>
            <h3 className="font-condensed text-xs tracking-[0.22em] uppercase text-brass mb-2">Cancellation Before Confirmation</h3>
            <p>You may cancel your order at any time before you receive the confirmation call from our team. Once the order has been confirmed and moved to processing or shipping, cancellations are no longer accepted.</p>
          </section>
          <section>
            <h3 className="font-condensed text-xs tracking-[0.22em] uppercase text-brass mb-2">Returns After Delivery</h3>
            <p>If you've received your order and have a valid concern — such as a manufacturing defect, incorrect item, or significant sizing discrepancy — you may raise a return request within 24 hours of delivery. Requests made after this window may not be accepted.</p>
            <p className="mt-3">Valid reasons for returns include:</p>
            <ul className="mt-2 space-y-1 list-none pl-0">
              {['Manufacturing defects', 'Wrong item delivered', 'Significant difference from product listing'].map(r => (
                <li key={r} className="flex items-start gap-2">
                  <span className="text-brass mt-1 shrink-0">—</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h3 className="font-condensed text-xs tracking-[0.22em] uppercase text-brass mb-2">Cancellation & Return Fee</h3>
            <p>A nominal processing fee of <span className="text-tb-white font-medium">₹50</span> applies to all accepted return or post-confirmation cancellation requests. This covers handling and restocking costs and will be deducted from your refund where applicable.</p>
          </section>
          <section>
            <h3 className="font-condensed text-xs tracking-[0.22em] uppercase text-brass mb-2">How to Raise a Request</h3>
            <p>To initiate a return or cancellation, reach out to us at <a href="mailto:support@thunderboltdenim.com" className="text-brass hover:text-brass-bright transition-colors underline underline-offset-2">support@thunderboltdenim.com</a> or call us at <span className="text-tb-white">+91 98765 43210</span>. Please have your order ID ready.</p>
          </section>
        </div>
      ),
    },
    privacy: {
      title: 'Privacy Policy',
      body: (
        <div className="space-y-6 text-sv-mid font-serif font-light text-sm leading-relaxed">
          <section>
            <h3 className="font-condensed text-xs tracking-[0.22em] uppercase text-brass mb-2">Information We Collect</h3>
            <p>When you shop with us, we collect information you provide directly — such as your name, email address, phone number, and delivery address. We also collect basic usage data to improve your experience on our platform.</p>
          </section>
          <section>
            <h3 className="font-condensed text-xs tracking-[0.22em] uppercase text-brass mb-2">How We Use It</h3>
            <p>Your information is used solely to process orders, communicate order updates, and improve our services. We do not sell, trade, or rent your personal information to third parties.</p>
          </section>
          <section>
            <h3 className="font-condensed text-xs tracking-[0.22em] uppercase text-brass mb-2">Data Security</h3>
            <p>We take data security seriously. Your information is stored securely and transmitted over encrypted connections. We implement industry-standard practices to protect against unauthorized access.</p>
          </section>
          <section>
            <h3 className="font-condensed text-xs tracking-[0.22em] uppercase text-brass mb-2">Contact</h3>
            <p>For any privacy-related questions, write to us at <a href="mailto:support@thunderboltdenim.com" className="text-brass hover:text-brass-bright transition-colors underline underline-offset-2">support@thunderboltdenim.com</a>.</p>
          </section>
        </div>
      ),
    },
    terms: {
      title: 'Terms & Conditions',
      body: (
        <div className="space-y-6 text-sv-mid font-serif font-light text-sm leading-relaxed">
          <section>
            <h3 className="font-condensed text-xs tracking-[0.22em] uppercase text-brass mb-2">Acceptance of Terms</h3>
            <p>By accessing and placing an order through Thunderbolt, you confirm that you are in agreement with and bound by these terms. Please read them carefully before making a purchase.</p>
          </section>
          <section>
            <h3 className="font-condensed text-xs tracking-[0.22em] uppercase text-brass mb-2">Product Accuracy</h3>
            <p>We make every effort to display product colours, sizes, and descriptions as accurately as possible. Minor variations in colour due to screen settings are not grounds for return unless the product is materially different from its listing.</p>
          </section>
          <section>
            <h3 className="font-condensed text-xs tracking-[0.22em] uppercase text-brass mb-2">Pricing</h3>
            <p>All prices listed are in Indian Rupees (₹) and are inclusive of applicable taxes. We reserve the right to modify pricing at any time without prior notice. Prices at the time of order confirmation are final.</p>
          </section>
          <section>
            <h3 className="font-condensed text-xs tracking-[0.22em] uppercase text-brass mb-2">Governing Law</h3>
            <p>These terms are governed by the laws of India. Any disputes arising shall be subject to the exclusive jurisdiction of courts in New Delhi.</p>
          </section>
        </div>
      ),
    },
  };

  const { title, body } = content[type];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.97 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg bg-[#111111] border border-white/10 rounded-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <h2 className="font-display text-lg tracking-[0.08em] uppercase text-tb-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-sv-mid hover:text-tb-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">{body}</div>
      </motion.div>
    </motion.div>
  );
}

const quickLinks = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/' },
  { label: 'Categories', to: '/' },
  { label: 'About', to: '/about' },
];

const supportLinks = [
  { label: 'Track Order', to: '/orders' },
];

const FooterLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Link
    to={to}
    className="font-condensed text-[0.75rem] tracking-[0.12em] uppercase text-sv-mid hover:text-tb-white transition-colors duration-200"
  >
    {children}
  </Link>
);

const FooterBtn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className="font-condensed text-[0.75rem] tracking-[0.12em] uppercase text-sv-mid hover:text-tb-white transition-colors duration-200 text-left"
  >
    {children}
  </button>
);

export default function Footer() {
  const [activePolicy, setActivePolicy] = useState<PolicyType>(null);

  return (
    <>
      <footer className="bg-void border-t border-white/[0.06] pt-16 pb-0 px-6 md:px-16">
        <div className="max-w-[1200px] mx-auto">

          {/* Main grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 pb-14">

            {/* 1 — Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <span className="font-display text-2xl tracking-[0.20em] text-tb-white block mb-3">
                THUNDER<span className="brass-text">⚡</span>BOLT
              </span>
              <p className="font-condensed text-[0.72rem] tracking-[0.16em] uppercase text-sv-dim leading-relaxed max-w-[220px]">
                Original Denim Supply.<br />Built for the Bold.
              </p>

              {/* Instagram */}
              <div className="mt-6">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/10 text-sv-mid hover:text-tb-white hover:border-white/30 hover:bg-white/5 transition-all duration-300 group"
                >
                  <Instagram className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                </a>
              </div>

              {/* Secure badge */}
              <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02]">
                <Shield className="w-3 h-3 text-brass shrink-0" />
                <span className="font-condensed text-[0.6rem] tracking-[0.18em] uppercase text-sv-dim">Secure Shopping Experience</span>
              </div>
            </div>

            {/* 2 — Quick Links */}
            <div>
              <p className="font-condensed text-[0.62rem] tracking-[0.28em] uppercase text-sv-dim/50 mb-5">Quick Links</p>
              <ul className="space-y-3">
                {quickLinks.map(l => (
                  <li key={l.label}><FooterLink to={l.to}>{l.label}</FooterLink></li>
                ))}
              </ul>
            </div>

            {/* 3 — Support + Policies */}
            <div>
              <p className="font-condensed text-[0.62rem] tracking-[0.28em] uppercase text-sv-dim/50 mb-5">Support</p>
              <ul className="space-y-3 mb-8">
                {supportLinks.map(l => (
                  <li key={l.label}><FooterLink to={l.to}>{l.label}</FooterLink></li>
                ))}
                <li>
                  <a href="mailto:support@thunderboltdenim.com" className="font-condensed text-[0.75rem] tracking-[0.12em] uppercase text-sv-mid hover:text-tb-white transition-colors duration-200">
                    Contact Us
                  </a>
                </li>
              </ul>

              <p className="font-condensed text-[0.62rem] tracking-[0.28em] uppercase text-sv-dim/50 mb-5">Policies</p>
              <ul className="space-y-3">
                <li><FooterBtn onClick={() => setActivePolicy('privacy')}>Privacy Policy</FooterBtn></li>
                <li><FooterBtn onClick={() => setActivePolicy('terms')}>Terms & Conditions</FooterBtn></li>
                <li><FooterBtn onClick={() => setActivePolicy('returns')}>Returns & Cancellation</FooterBtn></li>
              </ul>
            </div>

            {/* 4 — Contact */}
            <div>
              <p className="font-condensed text-[0.62rem] tracking-[0.28em] uppercase text-sv-dim/50 mb-5">Contact</p>
              <address className="not-italic space-y-3">
                <p className="font-condensed text-[0.74rem] tracking-[0.08em] text-sv-mid leading-relaxed">
                  42 MG Road, Connaught Place<br />
                  New Delhi – 110001, India
                </p>
                <a
                  href="mailto:support@thunderboltdenim.com"
                  className="font-condensed text-[0.74rem] tracking-[0.08em] text-sv-mid hover:text-tb-white transition-colors duration-200 block"
                >
                  support@thunderboltdenim.com
                </a>
                <a
                  href="tel:+919876543210"
                  className="font-condensed text-[0.74rem] tracking-[0.08em] text-sv-mid hover:text-tb-white transition-colors duration-200 block"
                >
                  +91 98765 43210
                </a>
              </address>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/[0.06] py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="font-condensed text-[0.65rem] tracking-[0.18em] uppercase text-sv-dim/50">
              © 2026 Thunderbolt. All rights reserved.
            </span>
            <span className="font-condensed text-[0.62rem] tracking-[0.14em] uppercase text-sv-dim/30">
              Original Denim Supply · Built for the Bold
            </span>
          </div>

        </div>
      </footer>

      <AnimatePresence>
        {activePolicy && (
          <PolicyModal type={activePolicy} onClose={() => setActivePolicy(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
