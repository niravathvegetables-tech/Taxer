import { useEffect, useState } from 'react';
import RiderLogin from './components/RiderLogin';
import RiderRegister from './components/RiderRegister';
import Order from './components/Order';
import { getCookie, deleteCookie } from './utils/cookies';
import { REST_URL, NONCE } from './utils/api';
import { pingRiderLocation } from './utils/locationTracker';
import './App.css';
import "./assets/met.css";



function App() {
  const [phone, setPhone] = useState(null);
   const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [checkingSession, setCheckingSession] = useState(true);
  const [autoLoginError, setAutoLoginError] = useState('');

  useEffect(() => {
    const attemptAutoLogin = async () => {
      const savedPhone = getCookie('taxer_rider_phone');
      const savedPwd = getCookie('taxer_rider_pwd');

      if (!savedPhone || !savedPwd) {
        setCheckingSession(false);
        return;
      }

      try {
        const res = await fetch(`${REST_URL}riderlogin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(NONCE ? { 'X-WP-Nonce': NONCE } : {}),
          },
          body: JSON.stringify({ phone: savedPhone, password: savedPwd }),
        });
        const data = await res.json();

        if (res.ok && data.success !== false) {

          console.log(data.rider.name);

          setUser(data.rider.name);
          setPhone(savedPhone);
        } else {
          deleteCookie('taxer_rider_phone');
          deleteCookie('taxer_rider_pwd');
          setAutoLoginError(data.message || 'Session expired. Please log in again.');
        }
      } catch (err) {
        setAutoLoginError('Could not verify session. Please log in again.');
      } finally {
        setCheckingSession(false);
      }
    };

    attemptAutoLogin();
  }, []);

  // ── Location tracking — pings every 10 seconds while a rider is logged in ──
const [payments, setPayments] = useState(null);

// ── Location tracking — pings every 10 seconds while a rider is logged in ──
useEffect(() => {
  if (!phone) return;
  pingRiderLocation(phone, setPayments);
  const intervalId = setInterval(() => {
    pingRiderLocation(phone, setPayments);
  }, 10000);
  return () => clearInterval(intervalId);
}, [phone]);

  const handleLogout = () => {
    deleteCookie('taxer_rider_phone');
    deleteCookie('taxer_rider_pwd');
    setPhone(null);
  };

  if (checkingSession) return <p>Checking session…</p>;

  if (!phone) {
    return (
      <>
        {autoLoginError && <p className="error">{autoLoginError}</p>}
        {view === 'login' ? (
          <RiderLogin
            onLoginSuccess={(p) => setPhone(p)}
            onSwitchToRegister={() => setView('register')}
          />
        ) : (
          <RiderRegister
            onRegisterSuccess={() => setView('login')}
            onSwitchToLogin={() => setView('login')}
          />
        )}
      </>
    );
  }

  return (
    <div className="rider-app">
      <header>
        <span>Rider: {phone}</span>
        <span>Amount to get: {payments !== null ? payments : '—'}</span>
        <button onClick={handleLogout}>Logout</button>
      </header>
      <Order username={user} />
    </div>
  );
}

export default App;