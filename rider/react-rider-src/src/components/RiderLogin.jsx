import { useState } from 'react';
import { setCookie } from '../utils/cookies';
import { REST_URL, NONCE } from '../utils/api';
import '../assets/met.css';

export default function RiderLogin({ onLoginSuccess, onSwitchToRegister }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const doLogin = async (cleanPhone, pwd) => {
    const res = await fetch(`${REST_URL}riderlogin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(NONCE ? { 'X-WP-Nonce': NONCE } : {}),
      },
      body: JSON.stringify({ phone: cleanPhone, password: pwd }),
    });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.message || 'Login failed. Please try again.');
    }
    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanPhone = phone.trim();
    if (!/^\d{10}$/.test(cleanPhone)) {
      setError('Enter a valid 10-digit phone number.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const data = await doLogin(cleanPhone, password);

      // Save both phone + password for 7 days — auto-login on return visits
      setCookie('taxer_rider_phone', cleanPhone, 7);
      setCookie('taxer_rider_pwd', password, 7);

      onLoginSuccess(cleanPhone, data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rider-login">
      <h2>Rider Login</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="phone">Phone Number</label>
        <input
          id="phone"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
          placeholder="10-digit mobile number"
          disabled={loading}
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          disabled={loading}
        />

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading || phone.length !== 10 || !password}>
          {loading ? 'Logging in…' : 'Login'}
        </button>
      </form>

      {onSwitchToRegister && (
        <p>
          New rider?{' '}
          <button type="button" className="link-btn" onClick={onSwitchToRegister}>
            Register here
          </button>
        </p>
      )}
    </div>
  );
}