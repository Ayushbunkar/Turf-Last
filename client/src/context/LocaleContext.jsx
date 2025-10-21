import React, { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react';
import i18n from '../i18n';
import api from '../config/Api';

const LOCAL_STORAGE_KEY = 'app_locale_settings_v1';
const RATES_STORAGE_KEY = 'app_currency_rates_v1';
const RATES_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

const defaultState = {
  language: 'en',
  currency: 'INR',
  // fallback rates, refreshed from public API on mount (unless cached)
  currencyRates: { INR: 1, USD: 0.012, EUR: 0.011, GBP: 0.009 },
};

const LocaleContext = createContext({
  ...defaultState,
  setLanguage: () => {},
  setCurrency: () => {},
  formatPrice: () => {},
  convertPrice: () => {},
});

export function LocaleProvider({ children }) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      // ignore
    }
    return defaultState;
  });

  // If user is authenticated, try to load saved settings from server
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    let mounted = true;
    const fetchedRef = { didFetch: false };
    (async () => {
      try {
        const resp = await api.get('/api/user/settings');
        if (mounted && resp && resp.data) {
          setState((s) => ({ ...s, ...resp.data }));
          fetchedRef.didFetch = true;
        }
      } catch (e) {
        // ignore; fall back to local
      }
    })();
    return () => (mounted = false);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // ignore
    }
  }, [state]);

  // Load cached or live currency rates
  useEffect(() => {
    let mounted = true;
    async function loadRates() {
      try {
        const raw = localStorage.getItem(RATES_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.ts && Date.now() - parsed.ts < RATES_TTL_MS && parsed?.rates) {
            // use cached
            if (mounted) setState((s) => ({ ...s, currencyRates: { ...(s.currencyRates || {}), ...parsed.rates } }));
            return;
          }
        }

        // fetch from exchangerate.host (no API key)
        const symbols = ['USD', 'EUR', 'GBP', 'INR'].join(',');
        const url = `https://api.exchangerate.host/latest?base=INR&symbols=${symbols}`;
        const resp = await fetch(url, { method: 'GET' });
        if (!resp.ok) throw new Error('Failed to fetch rates');
        const data = await resp.json();
        const rates = data?.rates || {};
        // Ensure INR is present and equals 1
        rates.INR = 1;
        if (mounted) setState((s) => ({ ...s, currencyRates: { ...(s.currencyRates || {}), ...rates } }));
        try {
          localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify({ ts: Date.now(), rates }));
        } catch (e) {
          // ignore
        }
      } catch (e) {
        // ignore and keep fallback rates
        console.warn('Failed to fetch currency rates', e?.message || e);
      }
    }
    loadRates();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (state.language) i18n.changeLanguage(state.language);
  }, [state.language]);

  const setLanguage = (lang) => setState((s) => ({ ...s, language: lang }));
  const setCurrency = (currency) => setState((s) => ({ ...s, currency }));

  const convertPrice = (amountInINR) => {
    // assume stored amounts are in INR in DB; convert to target currency
    const amount = typeof amountInINR === 'string' ? parseFloat(amountInINR) : Number(amountInINR || 0);
    const rate = (state.currencyRates && state.currencyRates[state.currency]) || 1;
    return amount * rate;
  };

  const formatPrice = (amount, options = {}) => {
    // amount is number in selected currency
    const localeMap = { en: 'en-IN', hi: 'hi-IN' };
    const locale = localeMap[state.language] || 'en-IN';
    const currency = state.currency || 'INR';
    return new Intl.NumberFormat(locale, { style: 'currency', currency, ...options }).format(amount);
  };

  const value = useMemo(() => ({ ...state, setLanguage, setCurrency, formatPrice, convertPrice }), [state]);

  // Expose a refreshRates function for manual refresh (returns the fetched rates or null)
  const refreshRates = async () => {
    try {
      const symbols = ['USD', 'EUR', 'GBP', 'INR'].join(',');
      const url = `https://api.exchangerate.host/latest?base=INR&symbols=${symbols}`;
      const resp = await fetch(url, { method: 'GET' });
      if (!resp.ok) throw new Error('Failed to fetch rates');
      const data = await resp.json();
      const rates = data?.rates || {};
      rates.INR = 1;
      setState((s) => ({ ...s, currencyRates: { ...(s.currencyRates || {}), ...rates } }));
      try {
        localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify({ ts: Date.now(), rates }));
      } catch (e) {}
      return rates;
    } catch (e) {
      console.warn('refreshRates failed', e?.message || e);
      return null;
    }
  };

  const providerValue = useMemo(() => ({ ...value, refreshRates }), [value]);

  // Persist to server when authenticated but skip the initial mount and debounce updates
  const _isFirstPersist = useRef(true);
  const _persistTimer = useRef(null);
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Skip the very first change (initialization) to avoid immediate double-calls
    if (_isFirstPersist.current) {
      _isFirstPersist.current = false;
      return;
    }

    // debounce updates by 400ms to batch rapid changes
    const payload = { language: state.language, currency: state.currency };
    if (_persistTimer.current) clearTimeout(_persistTimer.current);
    _persistTimer.current = setTimeout(async () => {
      try {
        await api.patch('/api/user/settings', payload);
      } catch (e) {
        // non-fatal
        console.warn('Failed to persist user settings', e?.message || e);
      }
    }, 400);

    return () => {
      if (_persistTimer.current) {
        clearTimeout(_persistTimer.current);
        _persistTimer.current = null;
      }
    };
  }, [state.language, state.currency]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
