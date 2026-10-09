import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  limit,
  query,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { firebaseConfig, hasFirebaseConfig } from './firebase-config.js';

function normalizePerson(id, data) {
  const fullName = String(data.name || data.fullName || '').trim();
  const [nameFirst = '', ...nameRest] = fullName.split(/\s+/);
  const createdAt = data.createdAt?.toDate
    ? data.createdAt.toDate().toISOString()
    : data.createdAt;

  return {
    ...data,
    id,
    firstName: data.firstName ?? nameFirst,
    lastName: data.lastName ?? nameRest.join(' '),
    birthDate: data.birthDate ?? data.dateOfBirth ?? '',
    deathDate: data.deathDate ?? data.dateOfDeath ?? '',
    biography: data.biography ?? data.notes ?? '',
    createdAt: createdAt || new Date().toISOString()
  };
}

function parentIdsFor(personId, relationships, people) {
  const parents = relationships.filter((relation) => (
    relation.type === 'parentOf' && relation.to === personId
  ));
  const father = parents.find((relation) => relation.role === 'father')
    || parents.find((relation) => people.find((person) => person.id === relation.from)?.gender === 'male');
  const mother = parents.find((relation) => relation.role === 'mother')
    || parents.find((relation) => relation !== father
      && people.find((person) => person.id === relation.from)?.gender === 'female');
  return { father: father?.from || '', mother: mother?.from || '' };
}

function familyMemberDocument(person, family) {
  const relationships = family.relationships.filter((relation) => relation.from === person.id);
  const { father, mother } = parentIdsFor(person.id, family.relationships, family.people);

  return {
    ...person,
    name: `${person.firstName || ''} ${person.lastName || ''}`.trim() || person.nickname || '',
    gender: person.gender || 'other',
    dateOfBirth: person.birthDate || '',
    dateOfDeath: person.deathDate || '',
    photo: person.photo || '',
    father,
    mother,
    spouse: relationships.filter((relation) => relation.type === 'spouseOf').map((relation) => (
      relation.to
    )),
    children: relationships.filter((relation) => relation.type === 'parentOf').map((relation) => (
      relation.to
    )),
    phone: person.phone || '',
    email: person.email || '',
    address: person.address || '',
    occupation: person.occupation || '',
    notes: person.biography || '',
    relationships,
    createdAt: person.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp()
  };
}

export async function createFirebaseClient() {
  if (!hasFirebaseConfig()) {
    throw new Error('Firebase configuration is incomplete.');
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  await setPersistence(auth, browserLocalPersistence);

  return {
    onAuthStateChanged: (callback, onError) => onAuthStateChanged(auth, callback, onError),
    signInWithGoogle: () => signInWithPopup(auth, googleProvider),
    signOut: () => signOut(auth),
    loadFamily: async (uid) => {
      const snapshot = await getDocs(collection(db, 'users', uid, 'familyMembers'));
      const people = [];
      const relationshipsById = new Map();

      snapshot.forEach((memberSnapshot) => {
        const person = normalizePerson(memberSnapshot.id, memberSnapshot.data());
        people.push(person);
        (person.relationships || []).forEach((relationship) => {
          const key = `${relationship.type}:${relationship.from}:${relationship.to}`;
          relationshipsById.set(key, relationship);
        });
      });

      people.forEach((person) => {
        if (person.relationships?.length) return;
        const addRelationship = (type, from, to, role) => {
          if (!from || !to || from === to) return;
          const id = `cloud_${type}_${from}_${to}`;
          const key = `${type}:${from}:${to}`;
          if (!relationshipsById.has(key)) {
            relationshipsById.set(key, { id, type, from, to, ...(role ? { role } : {}) });
          }
        };
        addRelationship('parentOf', person.father, person.id, 'father');
        addRelationship('parentOf', person.mother, person.id, 'mother');
        (Array.isArray(person.spouse) ? person.spouse : person.spouse ? [person.spouse] : [])
          .forEach((spouseId) => addRelationship('spouseOf', person.id, spouseId));
        (Array.isArray(person.children) ? person.children : person.children ? [person.children] : [])
          .forEach((childId) => addRelationship('parentOf', person.id, childId, 'child'));
      });

      return { people, relationships: [...relationshipsById.values()] };
    },
    saveFamily: async (uid, family) => {
      const memberCollection = collection(db, 'users', uid, 'familyMembers');
      const existing = await getDocs(memberCollection);
      const currentIds = new Set(family.people.map((person) => person.id));
      const operations = [];

      existing.forEach((memberSnapshot) => {
        if (!currentIds.has(memberSnapshot.id)) {
          operations.push({ type: 'delete', reference: memberSnapshot.ref });
        }
      });
      family.people.forEach((person) => {
        operations.push({
          type: 'set',
          reference: doc(memberCollection, person.id),
          data: familyMemberDocument(person, family)
        });
      });

      for (let index = 0; index < operations.length; index += 450) {
        const batch = writeBatch(db);
        operations.slice(index, index + 450).forEach((operation) => {
          if (operation.type === 'delete') batch.delete(operation.reference);
          else batch.set(operation.reference, operation.data);
        });
        await batch.commit();
      }
    },
    deleteFamily: async (uid) => {
      const memberCollection = collection(db, 'users', uid, 'familyMembers');
      let deleted = 0;
      while (true) {
        const snapshot = await getDocs(query(memberCollection, limit(450)));
        if (snapshot.empty) break;
        const batch = writeBatch(db);
        snapshot.docs.forEach((memberSnapshot) => batch.delete(memberSnapshot.ref));
        await batch.commit();
        deleted += snapshot.size;
      }

      const remaining = await getDocs(query(memberCollection, limit(1)));
      if (!remaining.empty) {
        throw new Error('Some family member documents remain in Firestore.');
      }
      return deleted;
    }
  };
}
