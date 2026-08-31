export function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/;SameSite=Lax`;
}

export function getCookie(name) {
  const cname = `${name}=`;
  const parts = document.cookie.split(';');
  for (let part of parts) {
    part = part.trim();
    if (part.indexOf(cname) === 0) {
      return decodeURIComponent(part.substring(cname.length));
    }
  }
  return null;
}

export function deleteCookie(name) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}