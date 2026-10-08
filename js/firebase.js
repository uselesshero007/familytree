import { firebaseConfig, hasFirebaseConfig } from './firebase-config.js';

export async function createFirebaseClient() {
  if (!hasFirebaseConfig()) return null;

  const version = '10.12.2';
  const [appSdk, authSdk, firestoreSdk] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${version}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${version}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${version}/firebase-firestore.js`)
  ]);
  const app = appSdk.initializeApp(firebaseConfig);
  const auth = authSdk.getAuth(app);
  const db = firestoreSdk.getFirestore(app);
  const provider = new authSdk.GoogleAuthProvider();

  return {
    auth,
    db,
    onAuthStateChanged: (callback) => authSdk.onAuthStateChanged(auth, callback),
    signInWithGoogle: () => authSdk.signInWithPopup(auth, provider),
    signOut: () => authSdk.signOut(auth),
    loadFamily: async (uid) => {
      const members = await firestoreSdk.getDocs(
        firestoreSdk.collection(db, 'users', uid, 'familyMembers')
      );
      const people = [];
      const relationships = [];
      members.forEach((snapshot) => {
        const data = snapshot.data();
        const { relationships: memberRelationships = [], ...person } = data;
        people.push({ ...person, id: snapshot.id });
        relationships.push(...memberRelationships);
      });
      return { people, relationships };
    },
    saveFamily: async (uid, family) => {
      const collection = firestoreSdk.collection(db, 'users', uid, 'familyMembers');
      const existing = await firestoreSdk.getDocs(collection);
      const operations = [];
      const currentIds = new Set(family.people.map((person) => person.id));
      existing.forEach((snapshot) => {
        if (!currentIds.has(snapshot.id)) operations.push({ type: 'delete', ref: snapshot.ref });
      });

      for (const person of family.people) {
        operations.push({
          type: 'set',
          ref: firestoreSdk.doc(collection, person.id),
          data: {
            ...person,
            relationships: family.relationships.filter((relation) => relation.from === person.id),
            updatedAt: firestoreSdk.serverTimestamp()
          }
        });
      }

      for (let index = 0; index < operations.length; index += 450) {
        const batch = firestoreSdk.writeBatch(db);
        operations.slice(index, index + 450).forEach((operation) => {
          if (operation.type === 'delete') batch.delete(operation.ref);
          else batch.set(operation.ref, operation.data);
        });
        await batch.commit();
      }
    }
  };
}
