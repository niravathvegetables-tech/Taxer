import { useState } from 'react';
import { REST_URL, NONCE } from '../utils/api';
import '../assets/met.css';


export default function RiderRegister({ onRegisterSuccess, onSwitchToLogin }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'phone' ? value.replace(/\D/g, '') : value,
    }));
  };

  const validate = () => {
    if (!form.name.trim()) return 'Name is required.';
    if (!/^\d{10}$/.test(form.phone)) return 'Enter a valid 10-digit phone number.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${REST_URL}riderregister`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(NONCE ? { 'X-WP-Nonce': NONCE } : {}),
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Registration failed. Please try again.');
      }

      setSuccess(data.message || 'Registered successfully.');
      if (onRegisterSuccess) onRegisterSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rider-register">
      <h2>Rider Registration</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="name">Full Name</label>
        <input
          id="name"
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          disabled={loading}
        />

        <label htmlFor="phone">Phone Number</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={form.phone}
          onChange={handleChange}
          placeholder="10-digit mobile number"
          disabled={loading}
        />

        <label htmlFor="email">Email (optional)</label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          disabled={loading}
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          disabled={loading}
        />

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Registering…' : 'Register'}
        </button>
      </form>

      {onSwitchToLogin && (
        <p>
          Already registered?{' '}
          <button type="button" className="link-btn" onClick={onSwitchToLogin}>
            Login here
          </button>
        </p>
      )}
    </div>
  );
}