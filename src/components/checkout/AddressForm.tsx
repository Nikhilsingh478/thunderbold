import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export interface AddressData {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
}

const empty: AddressData = {
  fullName: '', phone: '', addressLine1: '', addressLine2: '',
  city: '', state: '', pincode: '', landmark: '',
};

type Errors = Partial<Record<keyof AddressData, string>>;

function validate(d: AddressData): Errors {
  const e: Errors = {};
  if (!d.fullName.trim()) e.fullName = 'Full name is required';
  if (!d.phone.trim()) e.phone = 'Phone number is required';
  else if (!/^\d{10}$/.test(d.phone.trim())) e.phone = 'Enter a valid 10-digit phone number';
  if (!d.addressLine1.trim()) e.addressLine1 = 'Address is required';
  if (!d.city.trim()) e.city = 'City is required';
  if (!d.state.trim()) e.state = 'State is required';
  if (!d.pincode.trim()) e.pincode = 'Pincode is required';
  else if (!/^\d{6}$/.test(d.pincode.trim())) e.pincode = 'Enter a valid 6-digit pincode';
  return e;
}

interface Props {
  onSubmit: (data: AddressData) => void;
  submitting: boolean;
  savedAddress: AddressData | null;
}

export default function AddressForm({ onSubmit, submitting, savedAddress }: Props) {
  const [form, setForm] = useState<AddressData>(savedAddress ?? empty);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (savedAddress) setForm(savedAddress);
  }, [savedAddress]);

  const set = (field: keyof AddressData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (touched.has(field)) {
      const next = { ...form, [field]: value };
      const newErrors = validate(next);
      setErrors(prev => ({ ...prev, [field]: newErrors[field] }));
    }
  };

  const blur = (field: keyof AddressData) => {
    setTouched(prev => new Set(prev).add(field));
    const newErrors = validate(form);
    setErrors(prev => ({ ...prev, [field]: newErrors[field] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allErrors = validate(form);
    setErrors(allErrors);
    setTouched(new Set(Object.keys(form)));
    if (Object.keys(allErrors).length > 0) return;
    onSubmit(form);
  };

  const isValid = Object.keys(validate(form)).length === 0;

  const fields: { key: keyof AddressData; label: string; required: boolean; half?: boolean; type?: string; placeholder?: string }[] = [
    { key: 'fullName', label: 'Full Name', required: true, placeholder: 'Enter your full name' },
    { key: 'phone', label: 'Phone Number', required: true, type: 'tel', placeholder: '10-digit mobile number' },
    { key: 'addressLine1', label: 'Address Line 1', required: true, placeholder: 'House no., Street, Area' },
    { key: 'addressLine2', label: 'Address Line 2', required: false, placeholder: 'Apartment, Building (optional)' },
    { key: 'city', label: 'City', required: true, half: true, placeholder: 'City' },
    { key: 'state', label: 'State', required: true, half: true, placeholder: 'State' },
    { key: 'pincode', label: 'Pincode', required: true, half: true, type: 'tel', placeholder: '6-digit pincode' },
    { key: 'landmark', label: 'Landmark', required: false, half: true, placeholder: 'Nearby landmark (optional)' },
  ];

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="font-condensed font-semibold text-[0.62rem] tracking-[0.32em] uppercase text-sv-mid mb-6">
        Delivery Address
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-0">
        {fields.map((f, i) => {
          const error = errors[f.key];
          const isTouched = touched.has(f.key);
          return (
            <motion.div
              key={f.key}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              className={f.half ? '' : 'md:col-span-2'}
            >
              <div className="mb-5">
                <label className="block font-condensed font-semibold text-[0.68rem] tracking-[0.18em] uppercase text-sv-mid mb-2">
                  {f.label}
                  {f.required && <span className="text-brass ml-1">*</span>}
                </label>
                <input
                  type={f.type || 'text'}
                  value={form[f.key]}
                  onChange={e => set(f.key, e.target.value)}
                  onBlur={() => blur(f.key)}
                  placeholder={f.placeholder}
                  className={`w-full bg-surface border px-4 py-3.5 font-body text-[0.92rem] text-tb-white placeholder:text-sv-dim/60 outline-none transition-all duration-300 ${
                    error && isTouched
                      ? 'border-red-500/60 focus:border-red-400'
                      : 'border-white/[0.08] focus:border-brass/50'
                  }`}
                />
                {error && isTouched && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="font-body text-[0.75rem] text-red-400/80 mt-1.5"
                  >
                    {error}
                  </motion.p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Submit */}
      <motion.button
        type="submit"
        disabled={submitting || !isValid}
        whileTap={{ scale: 0.985 }}
        className={`w-full mt-4 py-5 font-condensed font-bold text-base tracking-[0.2em] uppercase transition-all duration-300 clip-bolt flex items-center justify-center gap-3 ${
          isValid && !submitting
            ? 'bg-tb-white text-void hover:bg-white hover:scale-[1.01] shadow-[0_0_20px_rgba(255,255,255,0.08)]'
            : 'bg-white/5 text-white/20 cursor-not-allowed'
        }`}
      >
        {submitting ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-void/30 border-t-void animate-spin" style={{ borderRadius: '50%' }} />
            Redirecting…
          </>
        ) : (
          'Place Order'
        )}
      </motion.button>

      <p className="font-body font-light text-[0.72rem] text-sv-dim text-center mt-4 tracking-wide">
        You'll be redirected to WhatsApp to confirm your order
      </p>
    </form>
  );
}
