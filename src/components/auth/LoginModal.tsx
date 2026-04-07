import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDelayedPrompt?: boolean;
}

interface EmailForm {
  email: string;
  password: string;
  isSignUp: boolean;
}

export default function LoginModal({ isOpen, onClose, isDelayedPrompt = false }: LoginModalProps) {
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
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 300,
              duration: 0.4
            }}
            className="relative w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Premium container with brass glow */}
            <div className="relative bg-black border border-white/10 rounded-2xl p-8 shadow-2xl overflow-hidden">
              {/* Brass glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-600/10 via-transparent to-yellow-600/5 pointer-events-none" />
              <div className="absolute inset-0 rounded-2xl shadow-[0_0_40px_rgba(255,204,0,0.1)] pointer-events-none" />
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-all duration-200 group"
              >
                <X className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
              </button>

              {/* Header */}
              <div className="text-center mb-8 relative z-10">
                <div className="flex items-center justify-center mb-4">
                  <Zap className="w-8 h-8 text-yellow-500 mr-2" />
                  <h2 className="font-display text-2xl tracking-[0.28em] text-tb-white">
                    {isDelayedPrompt ? 'Join the System' : 'Enter the System'}
                  </h2>
                </div>
                <p className="font-condensed font-semibold text-[0.72rem] tracking-[0.20em] uppercase text-sv-mid">
                  {isDelayedPrompt 
                    ? 'Unlock exclusive access to premium collections' 
                    : emailForm.isSignUp 
                      ? 'Create your Thunderbolt account' 
                      : 'Sign in to continue your journey'
                  }
                </p>
              </div>

              {/* Google Login */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleLogin}
                disabled={authLoading || loading}
                className="w-full flex items-center justify-center gap-3 bg-white text-black rounded-xl py-4 px-4 font-condensed font-semibold text-[0.72rem] tracking-[0.20em] uppercase hover:bg-white/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-6 relative overflow-hidden group"
              >
                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="relative z-10">Continue with Google</span>
                
                {/* Loading state */}
                {authLoading && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-xl">
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  </div>
                )}
              </motion.button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-black font-condensed font-semibold text-[0.72rem] tracking-[0.20em] uppercase text-sv-mid">or continue with email</span>
                </div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <label className="block font-condensed font-semibold text-[0.72rem] tracking-[0.20em] uppercase text-sv-mid mb-2">
                    EMAIL
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-yellow-500 transition-colors" />
                    <input
                      type="email"
                      value={emailForm.email}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500/30 transition-all duration-200"
                      placeholder="Enter your email"
                      required
                    />
                    {/* Focus glow */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/20 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block font-condensed font-semibold text-[0.72rem] tracking-[0.20em] uppercase text-sv-mid mb-2">
                    PASSWORD
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-yellow-500 transition-colors" />
                    <input
                      type="password"
                      value={emailForm.password}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500/30 transition-all duration-200"
                      placeholder="Enter your password"
                      required
                    />
                    {/* Focus glow */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/20 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none" />
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={authLoading || loading}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black rounded-xl py-4 px-4 font-condensed font-bold text-[0.72rem] tracking-[0.20em] uppercase hover:from-yellow-400 hover:to-yellow-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                >
                  {/* Button glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative z-10 flex items-center justify-center">
                    {authLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                        {emailForm.isSignUp ? 'Creating Account...' : 'Signing In...'}
                      </>
                    ) : (
                      emailForm.isSignUp ? 'Create Account' : 'Sign In'
                    )}
                  </div>
                </motion.button>
              </form>

              {/* Toggle Mode */}
              <div className="text-center mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={toggleMode}
                  className="font-condensed font-semibold text-[0.72rem] tracking-[0.20em] uppercase text-sv-mid hover:text-yellow-500 transition-colors duration-200"
                >
                  {emailForm.isSignUp 
                    ? 'Already have an account? Sign in' 
                    : "Don't have an account? Sign up"
                  }
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
