import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, Instagram, ArrowRight, Mail, Phone, MapPin, Plus } from 'lucide-react';

type PolicyType = 'returns' | 'privacy' | 'terms' | null;

function PolicyModal({ type, onClose }: { type: PolicyType; onClose: () => void }) {
  if (!type) return null;

  const content = {
    returns: {
      title: 'Returns & Cancellation',
      subtitle: 'Our commitment to a fair and transparent process',
      sections: [
        {
          heading: 'Order Confirmation',
          text: 'Every order placed on Thunderbolt goes through a manual verification step. Our team will reach out to you via a confirmation call before your order is processed. This ensures accuracy and gives you one final opportunity to review or amend your order details.',
        },
        {
          heading: 'Cancellation Before Confirmation',
          text: 'You may cancel your order at any time before you receive the confirmation call from our team. Once the order has been confirmed and moved to processing or shipping, cancellations are no longer accepted.',
        },
        {
          heading: 'Returns After Delivery',
          text: 'If you\'ve received your order and have a valid concern — such as a manufacturing defect, incorrect item, or significant sizing discrepancy — you may raise a return request within 24 hours of delivery.',
          list: ['Manufacturing defects', 'Wrong item delivered', 'Significant difference from product listing'],
        },
        {
          heading: 'Processing Fee',
          text: 'A nominal fee of ₹50 applies to all accepted returns or post-confirmation cancellations. This covers handling and restocking costs and will be deducted from your refund where applicable.',
        },
        {
          heading: 'How to Raise a Request',
          text: 'Contact us at support@thunderboltdenim.com or call +91 95611 72681. Please have your order ID ready when reaching out.',
          highlight: true,
        },
      ],
    },
    privacy: {
      title: 'Privacy Policy',
      subtitle: 'How we collect, use, and protect your data',
      sections: [
        {
          heading: 'Information We Collect',
          text: 'When you shop with us, we collect information you provide directly — such as your name, email address, phone number, and delivery address. We also collect basic usage data to improve your experience on our platform.',
        },
        {
          heading: 'How We Use It',
          text: 'Your information is used solely to process orders, communicate order updates, and improve our services. We do not sell, trade, or rent your personal information to any third parties under any circumstances.',
        },
        {
          heading: 'Data Security',
          text: 'We take data security seriously. Your information is stored securely and transmitted over encrypted connections. We implement industry-standard practices to protect against unauthorized access.',
        },
        {
          heading: 'Your Rights',
          text: 'You have the right to request access to, correction of, or deletion of any personal data we hold about you. Simply reach out and we\'ll respond within 7 business days.',
        },
        {
          heading: 'Contact for Privacy Queries',
          text: 'For any privacy-related questions or requests, write to us at support@thunderboltdenim.com and we\'ll respond promptly.',
          highlight: true,
        },
      ],
    },
    terms: {
      title: 'Terms & Conditions',
      subtitle: 'Please read these terms carefully before placing an order',
      sections: [
        {
          heading: 'Acceptance of Terms',
          text: 'By accessing and placing an order through Thunderbolt, you confirm that you are in agreement with and bound by these terms. If you do not agree, please refrain from using our services.',
        },
        {
          heading: 'Product Accuracy',
          text: 'We make every effort to display product colours, sizes, and descriptions as accurately as possible. Minor variations in colour due to screen settings are not grounds for return unless the product is materially different from its listing.',
        },
        {
          heading: 'Pricing',
          text: 'All prices listed are in Indian Rupees (₹) and are inclusive of applicable taxes. We reserve the right to modify pricing at any time without prior notice. Prices at the time of order confirmation are final.',
        },
        {
          heading: 'Governing Law',
          text: 'These terms are governed by the laws of India. Any disputes arising shall be subject to the exclusive jurisdiction of courts in New Delhi.',
        },
      ],
    },
  };

  const { title, subtitle, sections } = content[type];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 py-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl bg-[#0f0f0f] border border-white/[0.12] rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-7 pt-7 pb-5 border-b border-white/[0.08]">
          <div className="pr-10">
            <p className="font-condensed text-[0.65rem] tracking-[0.25em] uppercase text-brass mb-2">{subtitle}</p>
            <h2 className="font-display text-2xl tracking-[0.06em] uppercase text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="absolute top-7 right-6 flex items-center justify-center w-8 h-8 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/10 text-white/50 hover:text-white transition-all duration-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-6 max-h-[62vh] overflow-y-auto space-y-0 scrollbar-thin">
          {sections.map((sec, i) => (
            <div
              key={i}
              className={`py-5 ${i < sections.length - 1 ? 'border-b border-white/[0.06]' : ''} ${sec.highlight ? 'bg-brass/[0.04] -mx-7 px-7 rounded-none' : ''}`}
            >
              <div className="flex items-start gap-3 mb-2.5">
                <span className="shrink-0 mt-0.5 font-condensed text-[0.6rem] tracking-[0.2em] text-brass/70 tabular-nums pt-[3px]">0{i + 1}</span>
                <h3 className="font-condensed text-[0.75rem] tracking-[0.2em] uppercase text-white font-semibold">{sec.heading}</h3>
              </div>
              <p className="font-serif font-light text-sm leading-[1.75] text-white/60 pl-6">
                {sec.text}
              </p>
              {sec.list && (
                <ul className="mt-3 pl-6 space-y-1.5">
                  {sec.list.map(item => (
                    <li key={item} className="flex items-start gap-2 font-serif font-light text-sm text-white/60">
                      <span className="text-brass shrink-0 mt-1">—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="px-7 py-4 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
          <span className="font-condensed text-[0.65rem] tracking-[0.18em] uppercase text-white/30">Thunderbolt Denim · 2026</span>
          <button
            onClick={onClose}
            className="font-condensed text-[0.7rem] tracking-[0.18em] uppercase text-brass hover:text-white transition-colors duration-200 flex items-center gap-1.5"
          >
            Close <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const quickLinks = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/#categories' },
  { label: 'Categories', to: '/#categories' },
  { label: 'About', to: '/about' },
];

const supportLinks = [
  { label: 'Track Order', to: '/orders' },
  { label: 'My Cart', to: '/cart' },
  { label: 'Wishlist', to: '/wishlist' },
];

const FooterLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Link
    to={to}
    className="group inline-flex items-center gap-1.5 font-condensed text-[0.8rem] tracking-[0.1em] uppercase text-white/65 hover:text-white transition-colors duration-200"
  >
    <span className="w-0 group-hover:w-2.5 h-px bg-brass transition-all duration-300 ease-out shrink-0" />
    {children}
  </Link>
);

const FooterBtn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className="group inline-flex items-center gap-1.5 font-condensed text-[0.8rem] tracking-[0.1em] uppercase text-white/65 hover:text-white transition-colors duration-200 text-left"
  >
    <span className="w-0 group-hover:w-2.5 h-px bg-brass transition-all duration-300 ease-out shrink-0" />
    {children}
  </button>
);

const ColHeading = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-6">
    <p className="font-condensed text-[0.7rem] tracking-[0.28em] uppercase text-white font-bold">{children}</p>
    <div className="mt-2 w-6 h-px bg-brass/60" />
  </div>
);

const QuickLinksList = () => (
  <ul className="space-y-3.5">
    {quickLinks.map(l => (
      <li key={l.label}><FooterLink to={l.to}>{l.label}</FooterLink></li>
    ))}
  </ul>
);

const SupportList = () => (
  <ul className="space-y-3.5">
    {supportLinks.map(l => (
      <li key={l.label}><FooterLink to={l.to}>{l.label}</FooterLink></li>
    ))}
    <li>
      <a
        href="mailto:support@thunderboltdenim.com"
        className="group inline-flex items-center gap-1.5 font-condensed text-[0.8rem] tracking-[0.1em] uppercase text-white/65 hover:text-white transition-colors duration-200"
      >
        <span className="w-0 group-hover:w-2.5 h-px bg-brass transition-all duration-300 ease-out shrink-0" />
        Contact Us
      </a>
    </li>
  </ul>
);

const PoliciesList = ({ onSelect }: { onSelect: (p: PolicyType) => void }) => (
  <ul className="space-y-3.5">
    <li><FooterBtn onClick={() => onSelect('privacy')}>Privacy Policy</FooterBtn></li>
    <li><FooterBtn onClick={() => onSelect('terms')}>Terms & Conditions</FooterBtn></li>
    <li><FooterBtn onClick={() => onSelect('returns')}>Returns & Cancellation</FooterBtn></li>
  </ul>
);

const ContactBlock = () => (
  <address className="not-italic space-y-4">
    <div className="flex items-start gap-2.5">
      <MapPin className="w-3.5 h-3.5 text-brass/70 shrink-0 mt-0.5" />
      <p className="font-condensed text-[0.78rem] tracking-[0.06em] text-white/60 leading-relaxed">
        Matrabhumi Circle,<br />
        Near Ring Road,<br />
        Bhusawal – 425201, India
      </p>
    </div>
    <div className="flex items-center gap-2.5">
      <Mail className="w-3.5 h-3.5 text-brass/70 shrink-0" />
      <a
        href="mailto:support@thunderboltdenim.com"
        className="font-condensed text-[0.78rem] tracking-[0.06em] text-white/60 hover:text-white transition-colors duration-200"
      >
        support@thunderboltdenim.com
      </a>
    </div>
    <div className="flex items-center gap-2.5">
      <Phone className="w-3.5 h-3.5 text-brass/70 shrink-0" />
      <a
        href="tel:+919561172681"
        className="font-condensed text-[0.78rem] tracking-[0.06em] text-white/60 hover:text-white transition-colors duration-200"
      >
        +91 95611 72681
      </a>
    </div>
  </address>
);

const BrandBlock = () => (
  <div>
    <span className="font-display text-2xl tracking-[0.20em] text-white block mb-3">
      THUNDER<span className="brass-text">⚡</span>BOLT
    </span>
    <p className="font-condensed text-[0.74rem] tracking-[0.14em] uppercase text-white/45 leading-relaxed max-w-[220px]">
      Original Denim Supply.<br />Built for the Bold.
    </p>

    {/* Socials */}
    <div className="mt-7 flex items-center gap-3">
      <a
        href="https://www.instagram.com/thunderbold.shop?igsh=MXM5dnFvMW45Z2Fh"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/15 text-white/50 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all duration-300 group"
      >
        <Instagram className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
      </a>
      <a
        href="https://wa.me/919561172681"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/15 text-white/50 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all duration-300 group"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-4 h-4 transition-transform duration-300 group-hover:scale-110"
          aria-hidden="true"
        >
          <path d="M19.11 4.91A10.05 10.05 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.27-1.38a9.93 9.93 0 0 0 4.72 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.85-7zM12.05 20.15h-.01a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.22 8.22 0 0 1-1.27-4.37c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.42 5.83c0 4.55-3.7 8.23-8.23 8.23zm4.51-6.16c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.13-.16.25-.64.8-.78.96-.14.16-.29.18-.54.06-.25-.12-1.04-.38-1.99-1.22-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.41-.56-.42-.14 0-.31-.02-.47-.02-.16 0-.43.06-.65.31-.22.25-.85.83-.85 2.03 0 1.2.87 2.36.99 2.52.12.16 1.71 2.61 4.14 3.66.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.46-.6 1.66-1.17.21-.58.21-1.07.14-1.17-.06-.1-.22-.16-.47-.28z" />
        </svg>
      </a>
    </div>

    {/* Secure badge */}
    <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.1] bg-white/[0.03]">
      <Shield className="w-3 h-3 text-brass shrink-0" />
      <span className="font-condensed text-[0.6rem] tracking-[0.18em] uppercase text-white/40">Secure Shopping</span>
    </div>
  </div>
);

function MobileAccordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.07]">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-5 group"
      >
        <span className="font-condensed text-[0.78rem] tracking-[0.28em] uppercase text-white font-bold">
          {title}
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-white/15 bg-white/[0.03] text-brass group-hover:border-white/30 group-hover:bg-white/[0.06] transition-colors duration-200"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.25} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ y: -6 }}
              animate={{ y: 0 }}
              exit={{ y: -6 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="pb-5 pt-1"
            >
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Footer() {
  const [activePolicy, setActivePolicy] = useState<PolicyType>(null);

  return (
    <>
      <footer className="bg-void border-t border-white/[0.07] pt-16 pb-0 px-6 md:px-16">
        <div className="max-w-[1200px] mx-auto">

          {/* Mobile layout: brand + accordions */}
          <div className="sm:hidden pb-10">
            <div className="mb-8">
              <BrandBlock />
            </div>

            <div className="border-t border-white/[0.07]">
              <MobileAccordion title="Quick Links">
                <QuickLinksList />
              </MobileAccordion>
              <MobileAccordion title="Support">
                <SupportList />
              </MobileAccordion>
              <MobileAccordion title="Policies">
                <PoliciesList onSelect={setActivePolicy} />
              </MobileAccordion>
              <MobileAccordion title="Contact">
                <ContactBlock />
              </MobileAccordion>
            </div>
          </div>

          {/* Desktop / tablet grid */}
          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-10 pb-14">

            {/* 1 — Brand */}
            <div className="sm:col-span-2 lg:col-span-4">
              <BrandBlock />
            </div>

            {/* 2 — Quick Links */}
            <div className="lg:col-span-2">
              <ColHeading>Quick Links</ColHeading>
              <QuickLinksList />
            </div>

            {/* 3 — Support */}
            <div className="lg:col-span-2">
              <ColHeading>Support</ColHeading>
              <SupportList />
            </div>

            {/* 4 — Policies */}
            <div className="lg:col-span-2">
              <ColHeading>Policies</ColHeading>
              <PoliciesList onSelect={setActivePolicy} />
            </div>

            {/* 5 — Contact */}
            <div className="sm:col-span-2 lg:col-span-2">
              <ColHeading>Contact</ColHeading>
              <ContactBlock />
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/[0.07] py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="font-condensed text-[0.65rem] tracking-[0.18em] uppercase text-white/30">
              © 2026 Thunderbolt. All rights reserved.
            </span>
            <span className="font-condensed text-[0.62rem] tracking-[0.14em] uppercase text-white/20">
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
