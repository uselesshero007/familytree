const FAMILY_STORAGE_KEY = 'familyTreeDataV1';

const RELATION_OPTIONS = [
  { value: 'father', label: 'পিতা' },
  { value: 'mother', label: 'মাতা' },
  { value: 'son', label: 'পুত্র' },
  { value: 'daughter', label: 'কন্যা' },
  { value: 'brother', label: 'ভাই' },
  { value: 'sister', label: 'বোন' },
  { value: 'husband', label: 'স্বামী' },
  { value: 'wife', label: 'স্ত্রী' },
  { value: 'grandfather', label: 'দাদা' },
  { value: 'grandmother', label: 'দাদি' },
  { value: 'uncle', label: 'চাচা/কাকু/মামা' },
  { value: 'aunt', label: 'চাচী/কাকিমা/মামি' },
  { value: 'cousin', label: 'চাচাতো/কাকাতো/মামাতো' },
  { value: 'other', label: 'অন্যান্য' }
];

function createPerson(person = {}) {
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

function cryptoRandomId(prefix) {
  if (window.crypto && crypto.getRandomValues) {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    return `${prefix}_${bytes[0].toString(16)}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function buildSeedFamily() {
  const people = [
    createPerson({ id: 'person_grandfather', firstName: 'আবদুল', lastName: 'আহমেদ', nickname: 'দাদা', gender: 'male', birthDate: '1948-02-15', birthPlace: 'ঢাকা', deathDate: '', deathPlace: '', occupation: 'ব্যবসায়ী', biography: 'পরিবারের শিকড় ও ঐতিহ্য ধরে রাখেন।' }),
    createPerson({ id: 'person_grandmother', firstName: 'রওশন', lastName: 'আহমেদ', nickname: 'দাদি', gender: 'female', birthDate: '1952-09-12', birthPlace: 'চট্টগ্রাম', deathDate: '', deathPlace: '', occupation: 'গৃহিণী', biography: 'পরিবারের মূল্যবোধ ও স্মৃতি সংরক্ষণের প্রধান ভরসা।' }),
    createPerson({ id: 'person_father', firstName: 'ফারহাদ', lastName: 'আহমেদ', nickname: 'ফারহাদ', gender: 'male', birthDate: '1977-06-03', birthPlace: 'ঢাকা', deathDate: '', deathPlace: '', occupation: 'প্রকৌশলী', biography: 'পরিবারের নতুন প্রজন্মের অনুপ্রেরণা।' }),
    createPerson({ id: 'person_mother', firstName: 'নাসরিন', lastName: 'আহমেদ', nickname: 'নাসরিন', gender: 'female', birthDate: '1981-11-21', birthPlace: 'খুলনা', deathDate: '', deathPlace: '', occupation: 'শিক্ষক', biography: 'বাড়ির মানুষদের শিক্ষা ও সংহতি গড়ে তোলেন।' }),
    createPerson({ id: 'person_uncle', firstName: 'ইমরান', lastName: 'আহমেদ', nickname: 'ইমরান', gender: 'male', birthDate: '1970-08-08', birthPlace: 'ঢাকা', deathDate: '', deathPlace: '', occupation: 'বিশ্ববিদ্যালয় শিক্ষক', biography: 'পরিবারের শাখা-প্রশাখাকে একত্রে রাখে।' }),
    createPerson({ id: 'person_aunt', firstName: 'শিলা', lastName: 'আহমেদ', nickname: 'শিলা', gender: 'female', birthDate: '1974-04-18', birthPlace: 'ঢাকা', deathDate: '', deathPlace: '', occupation: 'মনোবিজ্ঞানী', biography: 'ভাইবোনদের মধ্যে স্নেহ ও সমর্থনের বন্ধন তৈরি করেন।' }),
    createPerson({ id: 'person_brother', firstName: 'হাসান', lastName: 'আহমেদ', nickname: 'হাসান', gender: 'male', birthDate: '2001-01-19', birthPlace: 'ঢাকা', deathDate: '', deathPlace: '', occupation: 'সফটওয়্যার ডেভেলপার', biography: 'পরিবারের সাহায্যকারী ও প্রযুক্তিগত চিন্তাবিদ।' }),
    createPerson({ id: 'person_sister', firstName: 'সাবা', lastName: 'আহমেদ', nickname: 'সাবা', gender: 'female', birthDate: '2005-07-27', birthPlace: 'ঢাকা', deathDate: '', deathPlace: '', occupation: 'উচ্চ মাধ্যমিক শিক্ষার্থী', biography: 'পরিবারের সবসময় হাসি ও প্রাণশক্তি।' }),
    createPerson({ id: 'person_user', firstName: 'আশরাফ', lastName: 'আহমেদ', nickname: 'আশ', gender: 'male', birthDate: '1999-04-16', birthPlace: 'ঢাকা', deathDate: '', deathPlace: '', occupation: 'ফ্রন্ট-এন্ড ডেভেলপার', biography: 'বংশগাছটি তৈরির মূল উদ্যোক্তা ও সদস্য।' }),
    createPerson({ id: 'person_wife', firstName: 'মেহেরুন', lastName: 'রহমান', nickname: 'মেহের', gender: 'female', birthDate: '2001-09-05', birthPlace: 'সিলেট', deathDate: '', deathPlace: '', occupation: 'গবেষক', biography: 'পারিবারিক স্মৃতি ও পরিবারের অগ্রগতি উৎসাহ দেন।' }),
    createPerson({ id: 'person_son', firstName: 'ইব্রাহিম', lastName: 'আহমেদ', nickname: 'ইবু', gender: 'male', birthDate: '2022-08-30', birthPlace: 'ঢাকা', deathDate: '', deathPlace: '', occupation: 'শিশু', biography: 'সদ্য জন্মগ্রহণকারী নতুন প্রজন্ম।' }),
    createPerson({ id: 'person_daughter', firstName: 'মীযান', lastName: 'আহমেদ', nickname: 'মীযান', gender: 'female', birthDate: '2024-01-10', birthPlace: 'ঢাকা', deathDate: '', deathPlace: '', occupation: 'শিশু', biography: 'পরিবারের আরেকটি উজ্জ্বল ভবিষ্যৎ।' }),
    createPerson({ id: 'person_cousin', firstName: 'রাফি', lastName: 'আহমেদ', nickname: 'রাফি', gender: 'male', birthDate: '2003-12-06', birthPlace: 'চট্টগ্রাম', deathDate: '', deathPlace: '', occupation: 'সিভিল ইঞ্জিনিয়ার', biography: 'চাচার শাখার নতুন সদস্য।' }),
    createPerson({ id: 'person_other', firstName: 'তানভির', lastName: 'আহমেদ', nickname: 'তানভি', gender: 'male', birthDate: '1987-04-01', birthPlace: 'বরিশাল', deathDate: '', deathPlace: '', occupation: 'ফটোগ্রাফার', biography: 'পরিবারের স্মৃতিচিত্র রচনাকারী।' })
  ];

  const relationships = [
    { id: 'r1', type: 'parentOf', from: 'person_grandfather', to: 'person_father' },
    { id: 'r2', type: 'parentOf', from: 'person_grandmother', to: 'person_father' },
    { id: 'r3', type: 'parentOf', from: 'person_grandfather', to: 'person_uncle' },
    { id: 'r4', type: 'parentOf', from: 'person_grandmother', to: 'person_uncle' },
    { id: 'r5', type: 'parentOf', from: 'person_grandfather', to: 'person_aunt' },
    { id: 'r6', type: 'parentOf', from: 'person_grandmother', to: 'person_aunt' },
    { id: 'r7', type: 'parentOf', from: 'person_father', to: 'person_user' },
    { id: 'r8', type: 'parentOf', from: 'person_mother', to: 'person_user' },
    { id: 'r9', type: 'parentOf', from: 'person_father', to: 'person_brother' },
    { id: 'r10', type: 'parentOf', from: 'person_mother', to: 'person_brother' },
    { id: 'r11', type: 'parentOf', from: 'person_father', to: 'person_sister' },
    { id: 'r12', type: 'parentOf', from: 'person_mother', to: 'person_sister' },
    { id: 'r13', type: 'spouseOf', from: 'person_father', to: 'person_mother' },
    { id: 'r14', type: 'spouseOf', from: 'person_user', to: 'person_wife' },
    { id: 'r15', type: 'parentOf', from: 'person_user', to: 'person_son' },
    { id: 'r16', type: 'parentOf', from: 'person_wife', to: 'person_son' },
    { id: 'r17', type: 'parentOf', from: 'person_user', to: 'person_daughter' },
    { id: 'r18', type: 'parentOf', from: 'person_wife', to: 'person_daughter' },
    { id: 'r19', type: 'siblingOf', from: 'person_user', to: 'person_brother' },
    { id: 'r20', type: 'siblingOf', from: 'person_user', to: 'person_sister' },
    { id: 'r21', type: 'siblingOf', from: 'person_brother', to: 'person_sister' },
    { id: 'r22', type: 'cousinOf', from: 'person_user', to: 'person_cousin' },
    { id: 'r23', type: 'otherRelativeOf', from: 'person_other', to: 'person_user' }
  ];

  return { people, relationships };
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}
