import { useState } from 'react';
import { CreditCard, Check, Info } from 'lucide-react';
import {
  digitsOnly,
  formatCard16Display,
  formatExpiryMMYYInput,
  validateCardFields,
} from '../utils/cardValidation';

function PaymentForm({ payment, setPayment, confirmBooking, submitting, hourlyRate }) {
  const [tab, setTab] = useState('card');
  const [fieldErrors, setFieldErrors] = useState({});

  const updatePayment = (key, val) => setPayment(prev => ({ ...prev, [key]: val }));

  const onFirstNameChange = e => {
    const v = e.target.value;
    if (/\d/.test(v)) {
      setFieldErrors(prev => ({ ...prev, cardholder: 'Numbers are not valid' }));
    } else {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next.cardholder;
        return next;
      });
    }
    updatePayment('firstName', v.replace(/[^a-zA-Z\s'-]/g, ''));
  };

  const onLastNameChange = e => {
    const v = e.target.value;
    if (/\d/.test(v)) {
      setFieldErrors(prev => ({ ...prev, cardholder: 'Numbers are not valid' }));
    } else {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next.cardholder;
        return next;
      });
    }
    updatePayment('lastName', v.replace(/[^a-zA-Z\s'-]/g, ''));
  };

  const onCardNumberChange = e => {
    const raw = e.target.value;
    if (/[a-zA-Z]/i.test(raw)) {
      setFieldErrors(prev => ({ ...prev, cardNumber: 'Invalid: letters are not allowed' }));
    } else {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next.cardNumber;
        return next;
      });
    }
    updatePayment('cardNumber', formatCard16Display(raw));
  };

  const onExpiryChange = e => {
    const raw = e.target.value;
    if (/[a-zA-Z]/i.test(raw)) {
      setFieldErrors(prev => ({ ...prev, cardExpiry: 'Invalid: letters are not allowed' }));
    } else {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next.cardExpiry;
        return next;
      });
    }
    updatePayment('cardExpiry', formatExpiryMMYYInput(raw));
  };

  const onCvvChange = e => {
    const raw = e.target.value;
    if (/[a-zA-Z]/i.test(raw)) {
      setFieldErrors(prev => ({ ...prev, cvv: 'Letters are not valid' }));
    } else {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next.cvv;
        return next;
      });
    }
    updatePayment('cvv', digitsOnly(raw).slice(0, 3));
  };

  const handleFormSubmit = e => {
    e.preventDefault();
    const holder = `${payment.firstName} ${payment.lastName}`.trim();
    const errs = validateCardFields({
      holderName: holder,
      cardDigits: payment.cardNumber,
      expiry: payment.cardExpiry,
      cvv: payment.cvv,
    });

    const next = {};
    if (errs.holderName) next.cardholder = errs.holderName;
    if (errs.cardNumber) next.cardNumber = errs.cardNumber;
    if (errs.expiry) next.cardExpiry = errs.expiry;
    if (errs.cvv) next.cvv = errs.cvv;
    setFieldErrors(next);

    if (Object.keys(next).length) return;
    confirmBooking(e);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full">
      {/* Left Form Area */}
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Payment Method</h2>

        {/* Tabs */}
        <div className="flex rounded-md border border-gray-300 mb-6 overflow-hidden">
          <button
            type="button"
            onClick={() => setTab('card')}
            className={`flex-1 py-3 text-center font-semibold border-r border-gray-300 flex justify-center items-center gap-2 ${tab === 'card' ? 'border-b-4 border-b-blue-500 bg-white text-blue-600' : 'bg-gray-50 text-gray-600'}`}
          >
            <CreditCard className="w-5 h-5" /> Add a card
          </button>
          <button
            type="button"
            onClick={() => setTab('paypal')}
            className={`flex-1 py-3 text-center font-semibold flex justify-center items-center gap-2 ${tab === 'paypal' ? 'border-b-4 border-b-blue-500 bg-white text-blue-600' : 'bg-gray-50 text-gray-600'}`}
          >
            <span className="font-bold font-serif text-blue-800 italic">PayPal</span> Add PayPal
          </button>
        </div>

        {tab === 'card' ? (
          <form id="payment-form" onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">First Name</label>
                <input
                  type="text"
                  value={payment.firstName}
                  onChange={onFirstNameChange}
                  className="w-full px-4 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoComplete="cc-given-name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Last Name</label>
                <input
                  type="text"
                  value={payment.lastName}
                  onChange={onLastNameChange}
                  className="w-full px-4 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoComplete="cc-family-name"
                />
              </div>
            </div>
            {fieldErrors.cardholder && <p className="text-red-600 text-sm -mt-2">{fieldErrors.cardholder}</p>}

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Card Number</label>
              <input
                type="text"
                inputMode="numeric"
                value={payment.cardNumber}
                onChange={onCardNumberChange}
                className="w-full px-4 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="16 digits"
                autoComplete="cc-number"
                maxLength={19}
              />
              {fieldErrors.cardNumber && <p className="text-red-600 text-sm mt-1">{fieldErrors.cardNumber}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Expiration (MM/YY)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={payment.cardExpiry}
                  onChange={onExpiryChange}
                  placeholder="MM/YY"
                  maxLength={5}
                  className="w-full px-3 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoComplete="cc-exp"
                />
                {fieldErrors.cardExpiry && <p className="text-red-600 text-sm mt-1">{fieldErrors.cardExpiry}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Security Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={payment.cvv}
                  onChange={onCvvChange}
                  className="w-24 px-4 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  maxLength={3}
                  placeholder="•••"
                  autoComplete="cc-csc"
                />
                {fieldErrors.cvv && <p className="text-red-600 text-sm mt-1">{fieldErrors.cvv}</p>}
              </div>
            </div>

            <div>
              <button type="button" className="text-blue-600 font-semibold hover:underline text-sm">
                Apply a coupon code
              </button>
            </div>

            <div className="pt-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Billing Address</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">Country</label>
                  <select
                    value={payment.country}
                    onChange={e => updatePayment('country', e.target.value)}
                    className="w-full px-4 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option>United States of America</option>
                    <option>Sri Lanka</option>
                    <option>United Kingdom</option>
                    <option>Canada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">Address</label>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Street number"
                      value={payment.address1}
                      onChange={e => updatePayment('address1', e.target.value)}
                      className="w-full px-4 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Apartment or suite"
                      value={payment.address2}
                      onChange={e => updatePayment('address2', e.target.value)}
                      className="w-full px-4 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5">City</label>
                    <input
                      type="text"
                      value={payment.city}
                      onChange={e => updatePayment('city', e.target.value)}
                      className="w-full px-4 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5">State</label>
                    <select
                      value={payment.state}
                      onChange={e => updatePayment('state', e.target.value)}
                      className="w-full px-3 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Select</option>
                      <option value="CA">CA</option>
                      <option value="NY">NY</option>
                      <option value="TX">TX</option>
                      <option value="WP">WP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5">Zipcode</label>
                    <input
                      type="text"
                      value={payment.zip}
                      onChange={e => updatePayment('zip', e.target.value)}
                      className="w-full px-4 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded flex gap-3 text-sm text-blue-900 border border-blue-100">
              <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <p>
                After adding payment information, you may see a $1.00 authentication charge on your online banking
                statement. This temporary charge is only to verify your information, and will be automatically reversed
                within a few business days.{' '}
                <button type="button" className="text-blue-600 underline font-semibold">
                  Learn More
                </button>
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-[#e97224] hover:bg-[#d86111] text-white font-bold py-3 px-8 rounded transition shadow-sm mt-4 uppercase"
            >
              {submitting ? 'Processing...' : 'Save'}
            </button>
            <p className="mt-2 text-xs text-gray-500">Upon save, booking will instantly confirm for Rs. {hourlyRate}.</p>
          </form>
        ) : (
          <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500">PayPal integration is mocked for this environment. Please switch to &quot;Add a card&quot;.</p>
          </div>
        )}
      </div>

      {/* Right Information Panel */}
      <div className="w-full lg:w-[320px] shrink-0">
        <div className="bg-[#f8f8f8] p-6 rounded-md">
          <h3 className="font-bold text-gray-900 mb-4">Complete Your Free Wyzant Account</h3>
          <p className="text-sm text-gray-700 mb-6">Add a payment method so tutors know you&apos;re ready to book a lesson.</p>

          <ul className="space-y-4 mb-8">
            <li className="flex gap-3 text-sm text-gray-800">
              <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              Convenient, cashless payments
            </li>
            <li className="flex gap-3 text-sm text-gray-800">
              <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              Pay only once your lesson&apos;s complete
            </li>
            <li className="flex gap-3 text-sm text-gray-800">
              <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              Encrypted payment processing
            </li>
            <li className="flex gap-3 text-sm text-gray-800">
              <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              Love your lesson, or we&apos;ll cover the first hour
            </li>
          </ul>

          <div className="text-sm text-gray-600 border-t border-gray-200 pt-6">
            <p className="mb-4">
              Lessons are charged by each tutor&apos;s hourly rate plus a 9% service fee.{' '}
              <Info className="inline w-4 h-4 text-blue-600" />
            </p>

            <p className="mb-2">Questions?</p>
            <p className="mb-4">
              <button type="button" className="text-blue-600 hover:underline">
                Read our payment policies
              </button>
            </p>

            <p>
              Need help? Review our Help Center article on{' '}
              <button type="button" className="text-blue-600 hover:underline">
                How to Add Payment
              </button>{' '}
              for more information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentForm;
