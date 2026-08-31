import baseUrl from '../components/Config';

// In production (inside WP), TaxerRiderData is injected via wp_localize_script.
// In dev (npm run dev on localhost), it won't exist — so fall back to baseUrl.
const wpData = window.TaxerRiderData || {};

export const REST_URL = wpData.rest_url || `${baseUrl}wp-json/taxer/v1/`;
export const NONCE = wpData.nonce || '';