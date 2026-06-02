import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Shield } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollProgress from '../components/ScrollProgress';
import CustomCursor from '../components/CustomCursor';
import { policyData, type PolicyData } from '../lib/policyContent';

function PolicyAccordion({ policy }: { policy: PolicyData }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="border border-white/[0.08] rounded-xl overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-6 md:px-8 py-6 md:py-7 group text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-brass/10 border border-brass/25 flex items-center justify-center shrink-0">
            <Shield className="w-3.5 h-3.5 text-brass" />
          </div>
          <div>
            <p className="font-condensed text-[0.62rem] tracking-[0.28em] uppercase text-brass mb-0.5">
              {policy.subtitle}
            </p>
            <h2 className="font-display text-xl md:text-2xl tracking-[0.08em] uppercase text-white group-hover:text-brass transition-colors duration-300">
              {policy.title}
            </h2>
          </div>
        </div>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex-shrink-0 ml-4 flex items-center justify-center w-8 h-8 rounded-full border border-white/15 bg-white/[0.03] text-brass group-hover:border-white/30 group-hover:bg-white/[0.06] transition-colors duration-200"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ y: -8 }}
              animate={{ y: 0 }}
              exit={{ y: -8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="border-t border-white/[0.06]"
            >
              {policy.sections.map((sec, i) => (
                <div
                  key={i}
                  className={`px-6 md:px-8 py-6 ${
                    i < policy.sections.length - 1 ? 'border-b border-white/[0.05]' : ''
                  } ${sec.highlight ? 'bg-brass/[0.035]' : ''}`}
                >
                  <div className="flex items-start gap-3.5 mb-3">
                    <span className="shrink-0 font-condensed text-[0.58rem] tracking-[0.22em] text-brass/60 tabular-nums pt-[5px]">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="font-condensed text-[0.72rem] tracking-[0.22em] uppercase text-white font-semibold leading-snug">
                      {sec.heading}
                    </h3>
                  </div>
                  <p className="font-body font-light text-[0.9rem] leading-[1.85] text-white/65 pl-7">
                    {sec.text}
                  </p>
                  {sec.list && (
                    <ul className="mt-3 pl-7 space-y-2">
                      {sec.list.map(item => (
                        <li key={item} className="flex items-start gap-2.5 font-body font-light text-[0.9rem] text-white/60">
                          <span className="text-brass shrink-0 mt-0.5 leading-[1.85]">—</span>
                          <span className="leading-[1.85]">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Policies() {
  return (
    <div className="noise-overlay min-h-screen flex flex-col bg-void">
      <CustomCursor />
      <ScrollProgress />
      <Navbar />

      <main className="flex-1 pt-[calc(148px+var(--tb-banner-h))] pb-28 px-4 md:px-10 lg:px-16">
        <div className="max-w-[860px] mx-auto">

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mb-14 md:mb-20"
          >
            <div className="font-condensed font-semibold text-[0.62rem] tracking-[0.38em] uppercase text-brass mb-5 flex items-center gap-3">
              <span className="w-5 h-px bg-brass-dim" />
              Legal & Compliance
              <span className="w-5 h-px bg-brass-dim" />
            </div>
            <h1 className="font-display text-5xl md:text-7xl tracking-[0.1em] uppercase metal-text mb-5">
              Policies
            </h1>
            <p className="font-body font-light text-[0.95rem] leading-relaxed text-white/50 max-w-[520px]">
              Thunderbolt is committed to transparency, security, and a trustworthy experience.
              Review the policies that govern how we operate and protect you.
            </p>
          </motion.div>

          {/* Accordions */}
          <div className="space-y-4">
            {policyData.map(policy => (
              <PolicyAccordion key={policy.id} policy={policy} />
            ))}
          </div>

          {/* Contact footer note */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-14 px-6 py-5 border border-white/[0.07] rounded-xl bg-white/[0.02] flex flex-col sm:flex-row sm:items-center gap-3"
          >
            <div className="flex-1">
              <p className="font-condensed text-[0.68rem] tracking-[0.2em] uppercase text-white/60">
                Questions about our policies?
              </p>
              <p className="font-body text-[0.85rem] text-white/40 mt-0.5">
                Reach out at{' '}
                <a
                  href="mailto:support@thunderboltdenim.com"
                  className="text-brass hover:text-brass-bright transition-colors duration-200 underline underline-offset-2 decoration-brass/30"
                >
                  support@thunderboltdenim.com
                </a>
              </p>
            </div>
            <div className="shrink-0">
              <span className="font-condensed text-[0.6rem] tracking-[0.18em] uppercase text-white/20">
                Thunderbolt Denim · 2026
              </span>
            </div>
          </motion.div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
