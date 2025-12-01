// src/utils/auth.js

const setDemoAuthToken = () => {
  localStorage.setItem('authToken', 'demo-token-123456');
};

const clearAuthToken = () => {
  localStorage.removeItem('authToken');
};

const getAuthToken = () => {
  const token = localStorage.getItem('authToken');
  return token || null;
};

const hasAuthToken = () => {
  const token = localStorage.getItem('authToken');
  return token !== null && token !== undefined;
};

// Named exports
export { setDemoAuthToken, clearAuthToken, getAuthToken, hasAuthToken };

// Or as default export object
export default {
  setDemoAuthToken,
  clearAuthToken,
  getAuthToken,
  hasAuthToken
};