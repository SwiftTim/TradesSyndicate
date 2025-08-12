const API_BASE = 'http://localhost:3001/api/v1';

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
};

export const authAPI = {
  login: (email: string, password: string) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  
  signup: (email: string, password: string) =>
    apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  
  getProfile: () => apiRequest('/auth/profile'),
};

export const signalsAPI = {
  getLatest: () => apiRequest('/signals/latest'),
};

export const userAPI = {
  getDashboard: () => apiRequest('/user/dashboard'),
};

export const brokerAPI = {
  link: (brokerData: { broker_id: string; public_key: string; private_key: string; settings: any }) =>
    apiRequest('/broker/link', {
      method: 'POST',
      body: JSON.stringify(brokerData),
    }),
  
  getLinked: () => apiRequest('/broker/linked'),
  
  test: (accountId: string) =>
    apiRequest(`/broker/test/${accountId}`, { method: 'POST' }),
};

export const adminAPI = {
  getHealth: () => apiRequest('/admin/health'),
  
  emitSignal: (signalData: any) =>
    apiRequest('/admin/signals', {
      method: 'POST',
      body: JSON.stringify(signalData),
    }),
  
  execute: (signalId: string) =>
    apiRequest('/execute', {
      method: 'POST',
      body: JSON.stringify({ signal_id: signalId }),
    }),
  
  killSwitch: (enabled: boolean) =>
    apiRequest('/admin/kill-switch', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    }),
  
  getMetrics: () => apiRequest('/admin/metrics'),
};

export const billingAPI = {
  createCheckoutSession: (priceId: string) =>
    apiRequest('/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ price_id: priceId }),
    }),
  
  getSubscriptionStatus: () => apiRequest('/billing/status'),
};