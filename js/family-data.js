export const FAMILY_STORAGE_KEY = 'familyTreeDataV1';

export function createPerson(person = {}) {
  return {
    id: person.id || cryptoRandomId('person'),
    firstName: person.firstName || '',
    lastName: person.lastName || '',
    nickname: person.nickname || '',
    gender: person.gender || 'other',
    birthDate: person.birthDate || '',
    birthPlace: person.birthPlace || '',
    deathDate: person.deathDate || '',
    deathPlace: person.deathPlace || '',
    phone: person.phone || '',
    email: person.email || '',
    address: person.address || '',
    photo: person.photo || '',
    occupation: person.occupation || '',
    biography: person.biography || person.notes || '',
    createdAt: person.createdAt || new Date().toISOString()
  };
}

export function cryptoRandomId(prefix = 'id') {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}_${globalThis.crypto.randomUUID()}`;
  }

  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    return `${prefix}_${Array.from(
      bytes,
      (byte) => byte.toString(16).padStart(2, '0')
    ).join('')}`;
  }

  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}
