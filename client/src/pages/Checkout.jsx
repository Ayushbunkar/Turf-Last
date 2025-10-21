import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../config/Api';
import { useToast } from '../components/Toast/ToastContext';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, Info } from 'lucide-react';

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('pending');
  const [info, setInfo] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [bookingInfo, setBookingInfo] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      setError('No booking provided');
      setLoading(false);
      return;
    }

    let mounted = true;
    async function start() {
      setLoading(true);
      try {
  const orderRes = await api.post('/api/payments/create-order', { bookingId });
  const od = orderRes.data?.order || orderRes.data;
  const serverKeyId = orderRes.data?.keyId || null;
        setOrderData({ order: od, serverKeyId });

        // fetch booking details for inline receipt summary
        try {
          const bres = await api.get(`/api/bookings/${bookingId}`);
          setBookingInfo(bres.data.booking || bres.data);
        } catch (e) {
          // non-fatal
          console.warn('Failed to fetch booking info for checkout summary', e);
        }

        if (od && od.__dev) {
          const devAuto = (import.meta.env.VITE_ENABLE_DEV_COMPLETE === 'true');
          if (devAuto) {
            await api.post('/api/payments/dev/complete', { bookingId });
            setStatus('paid');
            toast.push('Payment completed (dev). Booking confirmed.', { type: 'success' });
            setLoading(false);
            return;
          } else {
            setInfo('Dev order created. Auto-complete is disabled; complete payment using the dev helper or enable VITE_ENABLE_DEV_COMPLETE=true');
            setLoading(false);
            return;
          }
        }

        // Load Razorpay script (resilient loader with retries)
        const loadRazorpayScript = (tries = 3, delayMs = 800) => new Promise(async (res, rej) => {
          // If already available, resolve immediately
          if (window.Razorpay) return res(true);
          // If script tag already present, check again after short delay
          const existing = Array.from(document.getElementsByTagName('script')).find(s => s.src && s.src.includes('checkout.razorpay.com'));
          if (existing) {
            // wait for it to initialize
            let waited = 0;
            const check = setInterval(() => {
              if (window.Razorpay) { clearInterval(check); return res(true); }
              waited += 200;
              if (waited > 5000) { clearInterval(check); /* fallthrough to load new if possible */ }
            }, 200);
          }

          for (let attempt = 1; attempt <= tries; attempt++) {
            try {
              await new Promise((r, rj) => {
                const s = document.createElement('script');
                s.src = 'https://checkout.razorpay.com/v1/checkout.js';
                s.async = true;
                s.onload = () => r(true);
                s.onerror = (e) => rj(new Error('Script load error'));
                document.body.appendChild(s);
              });
              if (window.Razorpay) return res(true);
            } catch (e) {
              console.warn(`Razorpay script load attempt ${attempt} failed`, e);
              if (attempt < tries) await new Promise(r => setTimeout(r, delayMs * attempt));
            }
          }
          return rej(new Error('Failed to load Razorpay script after retries'));
        });

        await loadRazorpayScript(3, 700);

        const razorpayKey =
          serverKeyId ||
          import.meta.env.VITE_RAZORPAY_KEY ||
          import.meta.env.REACT_APP_RAZORPAY_KEY ||
          '';

        if (!razorpayKey) {
          setError('Payment gateway not configured');
          setLoading(false);
          return;
        }

        if (!window.Razorpay) {
          setError('Payment gateway failed to load');
          setLoading(false);
          return;
        }

        const options = {
          key: razorpayKey,
          amount: od.amount,
          currency: od.currency,
          name: 'Turf Booking',
          description: `Booking ${bookingId}`,
          order_id: od.id,
          handler: async function (response) {
            try {
              const verifyRes = await api.post('/api/payments/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId,
              });
              if (verifyRes.status === 200) {
        setStatus('paid');
        toast.push('Payment successful — booking confirmed', { type: 'success' });
  navigate(`/booking/success?bookingId=${bookingId}`);
              } else {
                setStatus('failed');
                setError('Payment verification failed');
              }
            } catch (e) {
              setStatus('failed');
              setError(e?.response?.data?.message || e?.message || 'Payment verification failed');
            }
          },
          prefill: { name: '', email: '' },
          theme: { color: '#7a1d1d' },
        };

        // try auto-open
        try {
          const rzp = new window.Razorpay(options);
          rzp.open();
        } catch (err) {
          setError('Failed to open payment window');
        }
      } catch (e) {
        setError(e?.response?.data?.message || e?.message || 'Failed to start checkout');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    start();
    return () => { mounted = false; };
  }, [bookingId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fff7ef] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-[#fdeada] rounded-2xl shadow-xl max-w-md w-full p-8 text-center border border-[#f5cbaa]"
      >
        <h2 className="text-2xl font-bold text-[#7a1d1d] mb-6">Secure Checkout</h2>

        {loading && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            className="flex justify-center mb-3"
          >
            <Loader2 className="w-8 h-8 text-[#a3542d]" />
          </motion.div>
        )}
        {loading && <p className="text-[#a3542d] font-medium">Starting payment...</p>}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center text-red-600 mt-4"
          >
            <XCircle className="w-8 h-8 mb-1" />
            <p>{error}</p>
            {/* Retry button for script load failures */}
            {error && error.toLowerCase().includes('failed to load') && (
              <button
                onClick={async () => {
                  setError(null);
                  setLoading(true);
                  try {
                    // Attempt to load script again
                    await (async function loadAgain(){
                      if (window.Razorpay) return true;
                      return new Promise((res, rej) => {
                        const s = document.createElement('script');
                        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
                        s.async = true;
                        s.onload = () => res(true);
                        s.onerror = (e) => rej(e);
                        document.body.appendChild(s);
                      });
                    })();
                    setError(null);
                    setLoading(false);
                  } catch (e) {
                    setError('Retry failed: could not load payment gateway');
                    setLoading(false);
                  }
                }}
                className="mt-3 px-3 py-2 bg-red-600 text-white rounded-md"
              >
                Retry loading payment gateway
              </button>
            )}
          </motion.div>
        )}

        {status === 'paid' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center text-green-700 mt-4"
          >
            <CheckCircle className="w-8 h-8 mb-1" />
            <p>Payment completed — booking confirmed.</p>
          </motion.div>
        )}

        {status === 'failed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center text-red-700 mt-4"
          >
            <XCircle className="w-8 h-8 mb-1" />
            <p>Payment failed. Please try again or contact support.</p>
          </motion.div>
        )}

        {info && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center text-[#a3542d] mt-4"
          >
            <Info className="w-7 h-7 mb-1" />
            <p>{info}</p>
          </motion.div>
        )}
        {bookingInfo && (
          <div className="mt-4 p-3 bg-white rounded shadow text-left text-sm text-slate-800">
            <div className="font-semibold">Booking Summary</div>
            <div className="text-xs text-slate-600">{bookingInfo.turf?.name}</div>
            <div className="text-xs">Date: {bookingInfo.date}</div>
            <div className="text-xs">Slots: {(bookingInfo.slots || []).map(s => `${s.startTime}-${s.endTime}`).join(', ')}</div>
            <div className="text-xs font-medium mt-1">Amount: ₹{bookingInfo.price}</div>
          </div>
        )}

        <div className="mt-6 text-sm text-[#7a1d1d]/70">
         <p>Your transaction is encrypted and secure. After payment confirmation you will be taken to the booking confirmation page with your receipt.</p>
        </div>

        {/* Dev helper: show dev-complete button and diagnostics when order is synthetic */}
        {orderData && orderData.order && orderData.order.__dev && (
          <div className="mt-4">
            <div className="mb-2 text-sm text-yellow-800">This is a development (synthetic) order.</div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    const res = await api.post('/api/payments/dev/complete', { bookingId });
                    setStatus('paid');
                    toast.push('Dev payment completed. Booking confirmed.', { type: 'success' });
                    navigate(`/booking/success?bookingId=${bookingId}`);
                  } catch (e) {
                    setError(e?.response?.data?.message || e?.message || 'Dev complete failed');
                  } finally { setLoading(false); }
                }}
                className="px-4 py-2 bg-yellow-700 text-white rounded-md"
              >
                Complete payment (dev)
              </button>

              <button
                onClick={() => setDiagnosticsOpen(v => !v)}
                className="px-3 py-2 bg-gray-200 text-gray-800 rounded-md"
              >
                {diagnosticsOpen ? 'Hide diagnostics' : 'Show diagnostics'}
              </button>
            </div>

            {diagnosticsOpen && (
              <pre className="mt-3 p-3 bg-gray-50 text-xs text-left overflow-auto max-h-48 rounded">{JSON.stringify(orderData, null, 2)}</pre>
            )}
          </div>
        )}
      </motion.div>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={async () => {
              // manual open: ensure orderData present
              if (!orderData) return setError('Order not ready');
              const odLocal = orderData.order;
              const serverKey = orderData.serverKeyId;
              const razorpayKey = serverKey || import.meta.env.VITE_RAZORPAY_KEY || import.meta.env.REACT_APP_RAZORPAY_KEY || '';
              if (!razorpayKey) return setError('Payment gateway not configured');
              // attempt to ensure script loaded (using resilient loader)
              try {
                await (async function ensureScript(){
                  if (window.Razorpay) return true;
                  return new Promise((res, rej) => {
                    const s = document.createElement('script');
                    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
                    s.async = true;
                    s.onload = () => res(true);
                    s.onerror = (e) => rej(e);
                    document.body.appendChild(s);
                  });
                })();
              } catch (e) {
                return setError('Payment gateway failed to load');
              }

              const options = {
                key: razorpayKey,
                amount: odLocal.amount,
                currency: odLocal.currency,
                name: 'Turf Booking',
                description: `Booking ${bookingId}`,
                order_id: odLocal.id,
                handler: async function (response) {
                  try {
                    const verifyRes = await api.post('/api/payments/verify', {
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature,
                      bookingId,
                    });
                    if (verifyRes.status === 200) {
                      setStatus('paid');
                      toast.push('Payment successful — booking confirmed', { type: 'success' });
                      navigate(`/booking/success?bookingId=${bookingId}`);
                    } else {
                      setStatus('failed');
                      setError('Payment verification failed');
                    }
                  } catch (e) {
                    setStatus('failed');
                    setError(e?.response?.data?.message || e?.message || 'Payment verification failed');
                  }
                },
                prefill: { name: '', email: '' },
                theme: { color: '#7a1d1d' },
              };

              try {
                const rzp = new window.Razorpay(options);
                rzp.open();
              } catch (err) {
                setError('Failed to open payment window');
              }
            }}
            className="px-4 py-2 bg-[#7a1d1d] text-white rounded-lg"
          >
            Open Razorpay
          </button>
        </div>
    </div>
  );
}
