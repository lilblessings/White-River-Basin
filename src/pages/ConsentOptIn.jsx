import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MessageSquare, Shield, Bell, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const ConsentOptIn = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
  const [errors, setErrors] = useState({});

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
    return phoneRegex.test(cleanPhone) && cleanPhone.length >= 10;
  };

  const formatPhoneNumber = (value) => {
    const phone = value.replace(/\D/g, '');
    if (phone.length <= 3) return phone;
    if (phone.length <= 6) return `(${phone.slice(0, 3)}) ${phone.slice(3)}`;
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6, 10)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: null }));
    }
  };

  const handleSubmit = async () => {
    
    const newErrors = {};
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    if (!phoneNumber.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhoneNumber(cleanPhone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (!consent) {
      newErrors.consent = 'You must consent to receive SMS messages';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would make your actual API call to register the phone number
      // const response = await fetch('/api/sms-consent', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ 
      //     phoneNumber: `+1${cleanPhone}`,
      //     consent: true,
      //     timestamp: new Date().toISOString()
      //   })
      // });
      
      setSubmitStatus('success');
    } catch (error) {
      console.error('Consent submission failed:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartOver = () => {
    setPhoneNumber('');
    setConsent(false);
    setSubmitStatus(null);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 dark:from-black dark:to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {submitStatus === 'success' ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Successfully Registered!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Thank you for opting in to SMS notifications. You'll receive important alerts and updates at <strong>{phoneNumber}</strong>.
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Reply STOP</strong> at any time to unsubscribe from SMS messages.
                    </p>
                  </div>
                  <button
                    onClick={handleStartOver}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    Register another number
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    <MessageSquare className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  </motion.div>
                  <CardTitle className="text-2xl text-gray-900 dark:text-white">
                    SMS Notifications
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Stay informed with real-time alerts and updates
                  </p>
                </CardHeader>

                <CardContent className="p-6 pt-0">
                  <div className="space-y-6">
                    {/* Phone Number Input */}
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        placeholder="(555) 123-4567"
                        className={`w-full px-4 py-3 rounded-lg border-2 transition-colors duration-200 ${
                          errors.phone 
                            ? 'border-red-300 focus:border-red-500' 
                            : 'border-gray-200 focus:border-blue-500'
                        } focus:outline-none bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white`}
                      />
                      {errors.phone && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-500 text-sm mt-1 flex items-center gap-1"
                        >
                          <AlertCircle className="w-4 h-4" />
                          {errors.phone}
                        </motion.p>
                      )}
                    </div>

                    {/* Features */}
                    <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-3">
                      <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        What you'll receive:
                      </h3>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>Critical system alerts and notifications</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>Important updates and maintenance notices</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>Emergency communications when needed</span>
                        </li>
                      </ul>
                    </div>

                    {/* Consent Checkbox */}
                    <div>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consent}
                          onChange={(e) => {
                            setConsent(e.target.checked);
                            if (errors.consent) {
                              setErrors(prev => ({ ...prev, consent: null }));
                            }
                          }}
                          className={`mt-1 w-4 h-4 rounded border-2 transition-colors duration-200 ${
                            errors.consent 
                              ? 'border-red-300' 
                              : 'border-gray-300'
                          } text-blue-600 focus:ring-blue-500`}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          I consent to receive SMS messages from this service. I understand that message and data rates may apply, and I can reply <strong>STOP</strong> to unsubscribe at any time.
                        </span>
                      </label>
                      {errors.consent && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-500 text-sm mt-2 flex items-center gap-1"
                        >
                          <AlertCircle className="w-4 h-4" />
                          {errors.consent}
                        </motion.p>
                      )}
                    </div>

                    {/* Privacy Notice */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-800 dark:text-blue-200">
                          Your phone number will only be used for SMS notifications related to our service. We will never share your information with third parties.
                        </p>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        'Opt In to SMS Notifications'
                      )}
                    </button>

                    {submitStatus === 'error' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
                      >
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <p className="text-sm text-red-800 dark:text-red-200">
                            Something went wrong. Please try again.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ConsentOptIn;
