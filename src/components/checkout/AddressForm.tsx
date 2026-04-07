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

  // Full Name — letters, spaces, dots only, 2–100 chars
  const name = d.fullName.trim();
  if (!name) e.fullName = 'Full name is required';
  else if (name.length < 2) e.fullName = 'Name must be at least 2 characters';
  else if (name.length > 100) e.fullName = 'Name must be under 100 characters';
  else if (!/^[a-zA-Z\s.'-]+$/.test(name)) e.fullName = 'Name contains invalid characters';

  // Phone — exactly 10 digits, must start with 6-9 (Indian mobile)
  const phone = d.phone.trim();
  if (!phone) e.phone = 'Phone number is required';
  else if (!/^\d+$/.test(phone)) e.phone = 'Phone number must contain only digits';
  else if (phone.length !== 10) e.phone = 'Enter a valid 10-digit phone number';
  else if (!/^[6-9]/.test(phone)) e.phone = 'Indian mobile numbers start with 6–9';

  // Address Line 1 — 5–200 chars
  const addr1 = d.addressLine1.trim();
  if (!addr1) e.addressLine1 = 'Address is required';
  else if (addr1.length < 5) e.addressLine1 = 'Address is too short';
  else if (addr1.length > 200) e.addressLine1 = 'Address must be under 200 characters';

  // Address Line 2 — optional, max 200
  if (d.addressLine2.trim().length > 200) e.addressLine2 = 'Must be under 200 characters';

  // City — letters & spaces, 2–50
  const city = d.city.trim();
  if (!city) e.city = 'City is required';
  else if (city.length < 2) e.city = 'City name is too short';
  else if (!/^[a-zA-Z\s'-]+$/.test(city)) e.city = 'City contains invalid characters';

  // State — letters & spaces, 2–50
  const state = d.state.trim();
  if (!state) e.state = 'State is required';
  else if (state.length < 2) e.state = 'State name is too short';
  else if (!/^[a-zA-Z\s]+$/.test(state)) e.state = 'State contains invalid characters';

  // Pincode — exactly 6 digits, must start with 1–9
  const pin = d.pincode.trim();
  if (!pin) e.pincode = 'Pincode is required';
  else if (!/^\d+$/.test(pin)) e.pincode = 'Pincode must contain only digits';
  else if (pin.length !== 6) e.pincode = 'Enter a valid 6-digit pincode';
  else if (pin.startsWith('0')) e.pincode = 'Indian pincodes don\'t start with 0';

  // Landmark — optional, max 100
  if (d.landmark.trim().length > 100) e.landmark = 'Must be under 100 characters';

  return e;
}

// Sanitize input per field type
function sanitize(field: keyof AddressData, value: string): string {
  switch (field) {
    case 'phone':
    case 'pincode':
      return value.replace(/\D/g, ''); // digits only
    case 'fullName':
    case 'city':
    case 'state':
      return value.replace(/[^a-zA-Z\s.'-]/g, ''); // letters, spaces, dots, hyphens, apostrophes
    default:
      return value;
  }
}

// Max lengths per field
const maxLen: Partial<Record<keyof AddressData, number>> = {
  fullName: 100, phone: 10, addressLine1: 200, addressLine2: 200,
  city: 50, state: 50, pincode: 6, landmark: 100,
};

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

  const set = (field: keyof AddressData, raw: string) => {
    const value = sanitize(field, raw).slice(0, maxLen[field] ?? 200);
    setForm(prev => ({ ...prev, [field]: value }));
    if (touched.has(field)) {
      const next = { ...form, [field]: value };
      const newErrors = validate(next);
      setErrors(prev => ({ ...prev, [field]: newErrors[field] }));
    }
  };

  const blur = (field: keyof AddressData) => {
    // Trim on blur
    setForm(prev => ({ ...prev, [field]: prev[field].trim() }));
    setTouched(prev => new Set(prev).add(field));
    const trimmed = { ...form, [field]: form[field].trim() };
    const newErrors = validate(trimmed);
    setErrors(prev => ({ ...prev, [field]: newErrors[field] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Trim all fields
    const trimmed = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v.trim()])
    ) as AddressData;
    setForm(trimmed);
    const allErrors = validate(trimmed);
    setErrors(allErrors);
    setTouched(new Set(Object.keys(form)));
    if (Object.keys(allErrors).length > 0) return;
    onSubmit(trimmed);
  };

  const isValid = Object.keys(validate(form)).length === 0;

  const fields: { key: keyof AddressData; label: string; required: boolean; half?: boolean; type?: string; placeholder?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']; autoComplete?: string }[] = [
    { key: 'fullName', label: 'Full Name', required: true, placeholder: 'Enter your full name', autoComplete: 'name' },
    { key: 'phone', label: 'Phone Number', required: true, type: 'tel', placeholder: '10-digit mobile number', inputMode: 'numeric', autoComplete: 'tel' },
    { key: 'addressLine1', label: 'Address Line 1', required: true, placeholder: 'House no., Street, Area', autoComplete: 'address-line1' },
    { key: 'addressLine2', label: 'Address Line 2', required: false, placeholder: 'Apartment, Building (optional)', autoComplete: 'address-line2' },
    { key: 'city', label: 'City', required: true, half: true, placeholder: 'City', autoComplete: 'address-level2' },
    { key: 'state', label: 'State', required: true, half: true, placeholder: 'State', autoComplete: 'address-level1' },
    { key: 'pincode', label: 'Pincode', required: true, half: true, type: 'tel', placeholder: '6-digit pincode', inputMode: 'numeric', autoComplete: 'postal-code' },
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
                  inputMode={f.inputMode}
                  autoComplete={f.autoComplete}
                  value={form[f.key]}
                  onChange={e => set(f.key, e.target.value)}
                  onBlur={() => blur(f.key)}
                  placeholder={f.placeholder}
                  maxLength={maxLen[f.key]}
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
