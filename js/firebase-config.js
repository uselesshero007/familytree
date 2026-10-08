export const firebaseConfig = {
  apiKey: 'AIzaSyBEmuJphu-sKS6xHzdyz1gOzLwIer4Tms8',
  authDomain: 'family-tree-48c11.firebaseapp.com',
  projectId: 'family-tree-48c11',
  storageBucket: 'family-tree-48c11.firebasestorage.app',
  messagingSenderId: '568847663426',
  appId: '1:568847663426:web:0667af3f6298f6712d08db',
  measurementId: 'G-0636ZBVBM1'
};

export function hasFirebaseConfig(config = firebaseConfig) {
  return Object.values(config).every((value) => (
    typeof value === 'string' && value.length > 0 && !value.startsWith('PASTE_')
  ));
}
