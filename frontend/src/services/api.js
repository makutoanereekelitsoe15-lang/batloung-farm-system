// services/api.js
// ONE small helper used by every page. It calls the Express API,
// reads the JSON reply, and throws a normal Error with the server's
// message when something goes wrong (so pages can show it to the user).
const BASE_URL = '/api';

async function request(path, options = {}) {
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  let response;
  try {
    response = await fetch(BASE_URL + path, config);
  } catch (networkError) {
    // The backend is not running or there is no internet connection.
    throw new Error('Cannot reach the server. Is the backend running on port 5000?');
  }

  let payload = {};
  try {
    payload = await response.json();
  } catch (parseError) {
    payload = {};
  }

  if (!response.ok) {
    throw new Error(payload.message || 'Request failed (' + response.status + ')');
  }
  return payload;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
