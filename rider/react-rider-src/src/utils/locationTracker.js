import { REST_URL, NONCE } from './api';

export function pingRiderLocation(phone, onPaymentsUpdate) {
  if (!navigator.geolocation) {
    console.warn('Geolocation not supported by this browser.');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const res = await fetch(`${REST_URL}updateriderlocation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(NONCE ? { 'X-WP-Nonce': NONCE } : {}),
          },
          body: JSON.stringify({ phone, latitude, longitude }),
        });
        const data = await res.json();
        if (data.success && onPaymentsUpdate) {
          onPaymentsUpdate(data.deiver_rider_payements);
        }
      } catch (err) {
        console.error('Failed to send rider location', err);
      }
    },
    (err) => {
      console.warn('Geolocation error:', err.message);
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
  );
}