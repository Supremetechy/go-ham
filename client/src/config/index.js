// Application Configuration
export const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  environment: process.env.REACT_APP_ENV || 'development',
  
  paypal: {
    publicKey: process.env.REACT_APP_PAPPAL_PUBLIC_KEY || '',
  },
  
  firebase: {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
  },
  
  features: {
    enableBooking: process.env.REACT_APP_ENABLE_BOOKING === 'true',
    enablePayments: process.env.REACT_APP_ENABLE_PAYMENTS === 'true',
    enableChat: process.env.REACT_APP_ENABLE_CHAT === 'true',
  },
};

export default config;
