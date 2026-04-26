import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/api';
import {
  digitsOnly,
  formatCard16Display,
  formatExpiryMMYYInput,
  validateCardFields,
} from '../utils/cardValidation';

axios.defaults.withCredentials = true;

function PaymentGateway() {
  const [tab, setTab] = useState('module');
  const [modules, setModules] = useState([]);
  const [plans, setPlans] = useState([]);
  const [moduleId, setModuleId] = useState('MOD-IT1010');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [file, setFile] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardErrors, setCardErrors] = useState({});
  const [studentUser, setStudentUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const navigate = useNavigate();

  const enrollmentRef = useMemo(() => {
    const r = Math.floor(Math.random() * 90000) + 10000;
    return `${moduleId}-ENR-${r}`;
  }, [moduleId]);

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/auth/session`, { withCredentials: true })
      .then(res => {
        const u = res.data.user;
        if (!u) {
          toast.error('Please log in');
          navigate('/login');
          return;
        }
        setStudentUser(u);
      })
      .catch(() => navigate('/login'));
  }, [navigate]);

  useEffect(() => {
    if (!studentUser || studentUser.role !== 'student') return;
    axios
      .get(`${API_BASE}/api/payments/modules`, { withCredentials: true })
      .then(r => {
        setModules(r.data);
        if (r.data.length && !r.data.find(m => m.moduleId === moduleId)) {
          setModuleId(r.data[0].moduleId);
        }
      })
      .catch(() => {});
    axios
      .get(`${API_BASE}/api/subscriptions/plans`, { withCredentials: true })
      .then(r => {
        setPlans(r.data);
        if (r.data[0]) setSelectedPlan(r.data[0].planId);
      })
      .catch(() => {});
  }, [studentUser, moduleId]);

  const basePrice = useMemo(() => {
    const m = modules.find(x => x.moduleId === moduleId);
    return m ? m.price : 0;
  }, [modules, moduleId]);

  const validateCardOrToast = () => {
    const errs = validateCardFields({
      holderName: cardHolderName,
      cardDigits: cardNumber,
      expiry: cardExpiry,
      cvv: cardCvv,
    });
    setCardErrors(errs);
    if (Object.keys(errs).length) {
      toast.error(Object.values(errs)[0]);
      return false;
    }
    setCardErrors({});
    return true;
  };

  const onHolderNameChange = e => {
    const v = e.target.value;
    if (/\d/.test(v)) {
      setCardErrors(prev => ({ ...prev, holderName: 'Numbers are not valid' }));
    } else {
      setCardErrors(prev => {
        const next = { ...prev };
        delete next.holderName;
        return next;
      });
    }
    setCardHolderName(v.replace(/[^a-zA-Z\s'-]/g, ''));
  };

  const onCardNumberChange = e => {
    const raw = e.target.value;
    if (/[a-zA-Z]/i.test(raw)) {
      setCardErrors(prev => ({ ...prev, cardNumber: 'Invalid: letters are not allowed' }));
    } else {
      setCardErrors(prev => {
        const next = { ...prev };
        delete next.cardNumber;
        return next;
      });
    }
    setCardNumber(formatCard16Display(raw));
  };

  const onExpiryChange = e => {
    const raw = e.target.value;
    if (/[a-zA-Z]/i.test(raw)) {
      setCardErrors(prev => ({ ...prev, expiry: 'Invalid: letters are not allowed' }));
    } else {
      setCardErrors(prev => {
        const next = { ...prev };
        delete next.expiry;
        return next;
      });
    }
    setCardExpiry(formatExpiryMMYYInput(raw));
  };

  const onCvvChange = e => {
    const raw = e.target.value;
    if (/[a-zA-Z]/i.test(raw)) {
      setCardErrors(prev => ({ ...prev, cvv: 'Letters are not valid' }));
    } else {
      setCardErrors(prev => {
        const next = { ...prev };
        delete next.cvv;
        return next;
      });
    }
    setCardCvv(digitsOnly(raw).slice(0, 3));
  };

  const cardFieldsBlock = (disabled) => (
    <div className="animate-fade-in space-y-3">
      <div>
        <input
          type="text"
          placeholder="Cardholder Name (letters only)"
          value={cardHolderName}
          onChange={onHolderNameChange}
          className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-wyzant-teal text-sm"
          disabled={disabled}
          autoComplete="cc-name"
        />
        {cardErrors.holderName && <p className="text-red-600 text-xs mt-1">{cardErrors.holderName}</p>}
      </div>
      <div>
        <input
          type="text"
          inputMode="numeric"
          placeholder="Card Number (16 digits)"
          value={cardNumber}
          onChange={onCardNumberChange}
          className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-wyzant-teal text-sm"
          disabled={disabled}
          autoComplete="cc-number"
        />
        {cardErrors.cardNumber && <p className="text-red-600 text-xs mt-1">{cardErrors.cardNumber}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <input
            type="text"
            inputMode="numeric"
            placeholder="MM/YY"
            value={cardExpiry}
            onChange={onExpiryChange}
            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-wyzant-teal text-sm"
            disabled={disabled}
            autoComplete="cc-exp"
            maxLength={5}
          />
          {cardErrors.expiry && <p className="text-red-600 text-xs mt-1">{cardErrors.expiry}</p>}
        </div>
        <div>
          <input
            type="text"
            inputMode="numeric"
            placeholder="CVV (3 digits)"
            value={cardCvv}
            onChange={onCvvChange}
            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-wyzant-teal text-sm"
            disabled={disabled}
            autoComplete="cc-csc"
            maxLength={3}
          />
          {cardErrors.cvv && <p className="text-red-600 text-xs mt-1">{cardErrors.cvv}</p>}
        </div>
      </div>
    </div>
  );

  const handlePayModule = async () => {
    if (!studentUser || studentUser.role !== 'student') {
      toast.error('Log in as a student to complete payment');
      return;
    }
    if (paymentMethod === 'slip' && !file && !cameraOpen) {
      toast.error('Please attach a payment slip or use the camera to capture one.');
      return;
    }
    if (paymentMethod === 'card' && !validateCardOrToast()) return;
    setPaying(true);
    try {
      const fd = new FormData();
      fd.append('moduleId', moduleId);
      fd.append('paymentMethod', paymentMethod);
      fd.append('enrollmentReference', enrollmentRef);
      fd.append('cameraMode', cameraOpen ? 'true' : 'false');
      if (paymentMethod === 'card') fd.append('cardNumber', digitsOnly(cardNumber));
      if (file) fd.append('slip', file);

      const { data } = await axios.post(`${API_BASE}/api/payments/checkout`, fd, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data.success) {
        toast.success('Payment verified. Invoice emailed. View Payment history to download.');
        navigate('/payment-history');
      }
    } catch (e) {
      const d = e.response?.data;
      toast.error(d?.error || d?.msg || d?.payment?.failureReason || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const handleSubscribe = async () => {
    if (!studentUser || studentUser.role !== 'student') {
      toast.error('Log in as a student');
      return;
    }
    if (!selectedPlan) {
      toast.error('Select a plan');
      return;
    }
    if (!validateCardOrToast()) return;
    setPaying(true);
    try {
      await axios.post(
        `${API_BASE}/api/subscriptions/subscribe`,
        { planId: selectedPlan, paymentMethod: 'card' },
        { withCredentials: true }
      );
      toast.success('Subscription started. Invoice sent to your email.');
      navigate('/payment-history');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Subscription failed');
    } finally {
      setPaying(false);
    }
  };

  if (!studentUser) {
    return <div className="min-h-screen flex items-center justify-center pt-20">Loading…</div>;
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed relative flex items-center justify-center pt-20 pb-16 px-4"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2070&auto=format&fit=crop')",
      }}
    >
      <div className="absolute inset-0 bg-white/90 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 max-w-lg w-full mb-10"
      >
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">💳</div>
          <h2 className="text-2xl font-bold text-gray-900">Secure Payment Gateway</h2>
          <p className="text-sm text-gray-500 mt-1">Pay and enroll, or subscribe to a plan</p>
        </div>

        {studentUser.role !== 'student' && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 text-amber-900 text-sm">
            You are signed in as {studentUser.role}. Module checkout and subscriptions require a student account.
            <button type="button" className="block mt-2 underline font-semibold" onClick={() => navigate('/payment-history')}>
              Open payment history (student)
            </button>
          </div>
        )}

        <div className="flex rounded-lg border border-gray-200 p-1 mb-6">
          <button
            type="button"
            onClick={() => setTab('module')}
            className={`flex-1 py-2 text-sm font-semibold rounded-md ${tab === 'module' ? 'bg-wyzant-teal text-white' : 'text-gray-600'}`}
          >
            Module payment
          </button>
          <button
            type="button"
            onClick={() => setTab('subscription')}
            className={`flex-1 py-2 text-sm font-semibold rounded-md ${tab === 'subscription' ? 'bg-wyzant-teal text-white' : 'text-gray-600'}`}
          >
            Subscription
          </button>
        </div>

        {tab === 'module' ? (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Target Module Selection</label>
              <select
                value={moduleId}
                onChange={e => setModuleId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-wyzant-teal"
                disabled={studentUser.role !== 'student'}
              >
                {modules.length === 0 ? (
                  <option value={moduleId}>Loading modules…</option>
                ) : (
                  modules.map(m => (
                    <option key={m.moduleId} value={m.moduleId}>
                      {m.name} (Rs. {m.price})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 flex justify-between">
                <span>Unique Enrollment ID:</span>
                <span className="font-bold text-gray-900">{enrollmentRef}</span>
              </div>
              <div className="text-sm text-gray-600 flex justify-between mt-2">
                <span>Total Amount:</span>
                <span className="font-bold text-wyzant-teal text-lg">Rs. {basePrice}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-wyzant-teal mb-4"
                disabled={studentUser.role !== 'student'}
              >
                <option value="card">Credit / Debit Card</option>
                <option value="slip">Bank Slip Upload</option>
              </select>

              {paymentMethod === 'slip' ? (
                <div className="animate-fade-in">
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Attach Payment Bank Slip</label>
                  <div className="flex flex-col gap-3">
                    <input
                      type="file"
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-wyzant-teal hover:file:bg-teal-100"
                      onChange={e => {
                        setFile(e.target.files[0]);
                        setCameraOpen(false);
                      }}
                      disabled={studentUser.role !== 'student'}
                    />
                    <div className="flex items-center gap-2">
                      <hr className="flex-1" />
                      <span className="text-xs text-gray-400 font-bold">OR</span>
                      <hr className="flex-1" />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCameraOpen(true);
                        setFile(null);
                      }}
                      className={`flex items-center justify-center gap-2 py-2 rounded-lg font-semibold border transition ${cameraOpen ? 'bg-black text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                      disabled={studentUser.role !== 'student'}
                    >
                      📷 {cameraOpen ? 'Camera Active (Mocked)' : 'Open Camera to Scan Slip'}
                    </button>
                  </div>
                  {cameraOpen && (
                    <div className="w-full h-32 mt-3 bg-gray-900 rounded-lg flex items-center justify-center text-white text-sm border-2 border-dashed border-gray-500">
                      [ Camera Feed Active - Point at Slip ]
                    </div>
                  )}
                </div>
              ) : (
                cardFieldsBlock(studentUser.role !== 'student')
              )}
            </div>

            <button
              onClick={handlePayModule}
              disabled={paying || studentUser.role !== 'student'}
              className={`w-full py-4 mt-4 rounded-xl font-bold text-white text-lg shadow-lg transition-transform ${paying || studentUser.role !== 'student' ? 'bg-gray-400' : 'bg-wyzant-teal hover:bg-wyzant-teal-dark hover:-translate-y-1'}`}
            >
              {paying ? 'Processing Gateway…' : '💳 Pay & Enroll Now'}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-gray-600">
              Recurring tutoring plans. Billing renews automatically (simulated when you open subscription view after the period ends).
            </p>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Plan</label>
              <select
                value={selectedPlan}
                onChange={e => setSelectedPlan(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-wyzant-teal"
                disabled={studentUser.role !== 'student'}
              >
                {plans.map(p => (
                  <option key={p.planId} value={p.planId}>
                    {p.planName} — Rs. {p.pricePerCycle} / {p.intervalMonths} mo
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Card details</label>
              {cardFieldsBlock(studentUser.role !== 'student')}
            </div>
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={paying || studentUser.role !== 'student'}
              className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg ${paying || studentUser.role !== 'student' ? 'bg-gray-400' : 'bg-wyzant-teal hover:bg-wyzant-teal-dark'}`}
            >
              {paying ? 'Processing…' : 'Start subscription'}
            </button>
          </div>
        )}

        <p className="text-xs text-center text-gray-400 mt-4">
          <button type="button" className="text-wyzant-teal font-semibold underline" onClick={() => navigate('/payment-history')}>
            Payment history
          </button>
        </p>
        <p className="text-xs text-center text-gray-400">Secured via PeerWise processing</p>
      </motion.div>
    </div>
  );
}

export default PaymentGateway;
