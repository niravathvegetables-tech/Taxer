import { useEffect, useState } from 'react';
import RiderLogin from './components/RiderLogin';
import RiderRegister from './components/RiderRegister';
import Order from './components/Order';
import RiderOrder from './components/RiderOrder';
import { getCookie, deleteCookie } from './utils/cookies';
import { REST_URL, NONCE } from './utils/api';
import { pingRiderLocation } from './utils/locationTracker';
import './App.css';
import "./assets/met.css";

function App() {
  const [phone, setPhone] = useState(null);
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [tab, setTab] = useState('orders'); // 'orders' | 'ekart'
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

  const [payments, setPayments] = useState(null);

  // Location tracking — pings every 10 seconds while a rider is logged in
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
            onLoginSuccess={(p, data) => {
              setPhone(p);
              if (data && data.rider) setUser(data.rider.name);
            }}
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

      <nav>
        <button
          className={tab === 'orders' ? 'btn-update' : 'btn-cancel'}
          onClick={() => setTab('orders')}
        >
          Orders
        </button>
        <button
          className={tab === 'ekart' ? 'btn-update' : 'btn-cancel'}
          onClick={() => setTab('ekart')}
        >
          Ekart Orders
        </button>
      </nav>

      {tab === 'orders' ? (
        <Order username={user} />
        
        
      ) : (
        <RiderOrder username={user} phone={phone} />
      )}
    </div>
  );
}

export default App;