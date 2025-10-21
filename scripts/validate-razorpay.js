
const fetch = require('node-fetch');

(async () => {
  const API_URL = process.env.API_URL || 'http://localhost:5000';
  const AUTH = process.env.AUTH_TOKEN;

  if (!AUTH) {
    console.error('Missing AUTH_TOKEN env var. Set AUTH_TOKEN="Bearer <token>"');
    process.exit(2);
  }

  try {
    const res = await fetch(`${API_URL}/api/payments/validate-keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: AUTH,
      },
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = text; }

    console.log('Status:', res.status);
    console.log('Response:', data);
    process.exit(res.ok ? 0 : 1);
  } catch (err) {
    console.error('Request failed:', err.message || err);
    process.exit(3);
  }
})();
