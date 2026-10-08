export const firebaseConfig = {
  // Paste the Firebase Web App config from Firebase Console > Project settings > Your apps.
  apiKey: 'PASTE_YOUR_FIREBASE_API_KEY',
  authDomain: 'PASTE_YOUR_FIREBASE_AUTH_DOMAIN',
  projectId: 'PASTE_YOUR_FIREBASE_PROJECT_ID',
  storageBucket: 'PASTE_YOUR_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'PASTE_YOUR_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'PASTE_YOUR_FIREBASE_APP_ID'
};

export function hasFirebaseConfig(config = firebaseConfig) {
  return Object.values(config).every((value) => (
    typeof value === 'string' && value.length > 0 && !value.startsWith('PASTE_')
  ));
}
