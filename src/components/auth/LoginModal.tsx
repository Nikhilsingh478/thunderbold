import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EmailForm {
  email: string;
  password: string;
  isSignUp: boolean;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { loginWithGoogle, loginWithEmail, signupWithEmail, loading } = useAuth();
  const [emailForm, setEmailForm] = useState<EmailForm>({
    email: '',
    password: '',
    isSignUp: false
  });
  const [authLoading, setAuthLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setAuthLoading(true);
      await loginWithGoogle();
      onClose();
      toast.success('Successfully logged in!');
    } catch (error) {
      console.error('Google login failed:', error);
      toast.error('Failed to login with Google. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailForm.email || !emailForm.password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setAuthLoading(true);
      
      if (emailForm.isSignUp) {
        await signupWithEmail(emailForm.email, emailForm.password);
        toast.success('Account created successfully!');
      } else {
        await loginWithEmail(emailForm.email, emailForm.password);
        toast.success('Successfully logged in!');
      }
      
      onClose();
    } catch (error) {
      console.error('Email auth failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      toast.error(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  const toggleMode = () => {
    setEmailForm(prev => ({
      ...prev,
      isSignUp: !prev.isSignUp
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative bg-surface border border-white/10 rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                {emailForm.isSignUp ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-white/60 text-sm">
                {emailForm.isSignUp 
                  ? 'Join Thunderbolt for exclusive access' 
                  : 'Sign in to continue your shopping'
                }
              </p>
            </div>

            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              disabled={authLoading || loading}
              className="w-full flex items-center justify-center gap-3 bg-white text-black rounded-xl py-3 px-4 font-medium hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path 
                  fill="#4285F4" 
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25-.37v1.94c.72.15 1.47.37 2.25.37.72 0 1.53-.07 3-.37 4.25v1.94c-.72.15-1.47.37-2.25.37-.72 0-1.53.07-3 .37-4.25v-1.94c.72-.15 1.47-.37 2.25-.37.72 0 1.53.07 3 .37 4.25zM12 23.25c-1.87 0-3.63-.37-5.25-1.06v-1.94c1.62.69 3.38 1.06 5.25 1.06 1.87 0 3.63-.37 5.25-1.06v1.94c-1.62-.69-3.38-1.06-5.25-1.06z"
                />
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-surface text-white/60">OR</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="email"
                    value={emailForm.email}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="password"
                    value={emailForm.password}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={authLoading || loading}
                className="w-full bg-white text-black rounded-xl py-3 px-4 font-medium hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    {emailForm.isSignUp ? 'Creating Account...' : 'Signing In...'}
                  </div>
                ) : (
                  emailForm.isSignUp ? 'Create Account' : 'Sign In'
                )}
              </button>
            </form>

            {/* Toggle Mode */}
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={toggleMode}
                className="text-white/60 hover:text-white text-sm transition-colors"
              >
                {emailForm.isSignUp 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up"
                }
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
