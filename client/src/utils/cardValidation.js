export function digitsOnly(s) {
  return String(s || '').replace(/\D/g, '');
}

export function luhnValid(numStr) {
  const d = digitsOnly(numStr);
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = d.length - 1; i >= 0; i -= 1) {
    let n = parseInt(d[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function detectCardBrand(digits) {
  const d = digitsOnly(digits);
  if (/^4/.test(d)) return 'visa';
  if (/^5[1-5]/.test(d)) return 'mastercard';
  if (/^2(2[2-9]|[3-6]|7[01]|720)/.test(d)) return 'mastercard';
  if (/^3[47]/.test(d)) return 'amex';
  if (/^6(?:011|5)/.test(d)) return 'discover';
  return 'unknown';
}

export function formatCardDisplay(raw) {
  const d = digitsOnly(raw).slice(0, 19);
  const brand = detectCardBrand(d);
  if (brand === 'amex') {
    const a = d.slice(0, 4);
    const b = d.slice(4, 10);
    const c = d.slice(10, 15);
    return [a, b, c].filter(Boolean).join(' ');
  }
  return d.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

/** PeerWise: exactly 16 digits, groups of 4 for display */
export function formatCard16Display(raw) {
  const d = digitsOnly(raw).slice(0, 16);
  return d.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

/** MM/YY from typed digits only (max 4 digits) */
export function formatExpiryMMYYInput(raw) {
  const digits = digitsOnly(raw).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function validateExpiryMMYY(value) {
  const v = String(value || '').replace(/\s/g, '');
  const m = v.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return 'MM/YY format / Use MM/YY';
  const month = parseInt(m[1], 10);
  const yy = parseInt(m[2], 10);
  if (month < 1 || month > 12) return 'Invalid month';
  const year = 2000 + yy;
  const lastDay = new Date(year, month, 0);
  const startCurrent = new Date();
  startCurrent.setDate(1);
  startCurrent.setHours(0, 0, 0, 0);
  if (lastDay < startCurrent) return 'Card expired / කාඩ්පත කල් ඉකුත්';
  return null;
}

export function validateCardFields({ holderName, cardDigits, expiry, cvv }) {
  const errors = {};
  const name = String(holderName || '').trim();
  if (/\d/.test(name)) {
    errors.holderName = 'Numbers are not valid';
  } else if (name.length < 2) {
    errors.holderName = 'Enter cardholder name';
  } else if (!/^[a-zA-Z\s'-]+$/.test(name)) {
    errors.holderName = 'Only letters are allowed';
  }

  const rawCard = String(cardDigits || '');
  if (/[a-zA-Z]/i.test(rawCard)) {
    errors.cardNumber = 'Invalid: letters are not allowed';
  }
  const d = digitsOnly(cardDigits);
  if (!errors.cardNumber && d.length !== 16) {
    errors.cardNumber = 'Card number must be exactly 16 digits';
  }

  const expRaw = String(expiry || '');
  if (/[a-zA-Z]/i.test(expRaw)) {
    errors.expiry = 'Invalid: letters are not allowed';
  } else {
    const expErr = validateExpiryMMYY(expiry);
    if (expErr) errors.expiry = expErr;
  }

  const cvvRaw = String(cvv || '');
  if (/[a-zA-Z]/i.test(cvvRaw)) {
    errors.cvv = 'Letters are not valid';
  }
  const c = digitsOnly(cvv);
  if (!errors.cvv && c.length !== 3) {
    errors.cvv = 'CVV must be exactly 3 digits';
  }

  return errors;
}
