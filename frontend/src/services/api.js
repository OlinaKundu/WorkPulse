const API_BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('inner_eye_token');

  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    cache: 'no-store',
    ...options,
    headers,
  };

  try {
    // Append timestamp to GET requests to completely prevent browser HTTP caching
    let url = `${API_BASE_URL}${endpoint}`;
    if (!options.method || options.method === 'GET') {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}_t=${Date.now()}`;
    }

    const response = await fetch(url, config);

    // If unauthorized, clear token and notify
    if (response.status === 401) {
      localStorage.removeItem('inner_eye_token');
      localStorage.removeItem('inner_eye_user');
      if (window.location.pathname !== '/login') {
        window.dispatchEvent(new CustomEvent('auth-expired'));
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint, body) => request(endpoint, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }),
};
