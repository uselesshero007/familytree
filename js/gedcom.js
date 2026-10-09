const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MAX_RECORDS = 50000;

const MONTHS = {
  JAN: '01',
  FEB: '02',
  MAR: '03',
  APR: '04',
  MAY: '05',
  JUN: '06',
  JUL: '07',
  AUG: '08',
  SEP: '09',
  OCT: '10',
  NOV: '11',
  DEC: '12'
};

function dateValue(value) {
  const date = value.trim();
  const exact = date.match(/^(\d{1,2})\s+([A-Z]{3})\s+(\d{3,4})$/i);
  if (exact && MONTHS[exact[2].toUpperCase()]) {
    return `${exact[3]}-${MONTHS[exact[2].toUpperCase()]}-${exact[1].padStart(2, '0')}`;
  }

  const monthAndYear = date.match(/^([A-Z]{3})\s+(\d{3,4})$/i);
  if (monthAndYear && MONTHS[monthAndYear[1].toUpperCase()]) {
    return `${monthAndYear[2]}-${MONTHS[monthAndYear[1].toUpperCase()]}`;
  }

  if (/^\d{3,4}$/.test(date)) return date;
  return date;
}

function textWithContinuations(node, externalNotes) {
  if (!node) return '';
  const value = node.value.trim();
  const reference = value.match(/^@([^@]+)@$/);
  const parts = reference && externalNotes.has(reference[1])
    ? [externalNotes.get(reference[1])]
    : [value];

  node.children.forEach((child) => {
    if (child.tag === 'CONT') parts.push(`\n${child.value}`);
    if (child.tag === 'CONC') parts.push(child.value);
  });
  return parts.join('').trim();
}

function childrenWithTag(node, tag) {
  return node.children.filter((child) => child.tag === tag);
}

function firstChild(node, tag) {
  return node.children.find((child) => child.tag === tag);
}

function parseName(value, givenName, surname) {
  if (givenName || surname) {
    return { firstName: givenName.trim(), lastName: surname.trim() };
  }
  const markedSurname = value.match(/\/([^/]*)\//);
  if (markedSurname) {
    return {
      firstName: value.replace(/\/[^/]*\//, '').trim(),
      lastName: markedSurname[1].trim()
    };
  }
  const fullName = value.trim();
  const separator = fullName.lastIndexOf(' ');
  return separator < 0
    ? { firstName: fullName, lastName: '' }
    : {
        firstName: fullName.slice(0, separator).trim(),
        lastName: fullName.slice(separator + 1).trim()
      };
}

export function parseGedcom(text) {
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('The selected GEDCOM file is empty.');
  }
  if (new Blob([text]).size > MAX_FILE_SIZE) {
    throw new Error('The GEDCOM file is too large. The maximum supported size is 15 MB.');
  }

  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  const roots = [];
  const stack = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trimEnd();
    if (!line.trim()) continue;
    const match = line.match(/^(\d+)\s+(?:(@[^@\s]+@)\s+)?([A-Za-z0-9_]+)(?:\s+(.*))?$/);
    if (!match) {
      throw new Error(`Invalid GEDCOM syntax on line ${index + 1}.`);
    }

    const level = Number(match[1]);
    if (level > 99 || (level > 0 && (!stack.length || level > stack[stack.length - 1].level + 1))) {
      throw new Error(`Invalid GEDCOM hierarchy on line ${index + 1}.`);
    }

    const node = {
      level,
      xref: match[2] ? match[2].slice(1, -1) : '',
      tag: match[3].toUpperCase(),
      value: match[4] || '',
      children: []
    };
    while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
    if (level === 0) roots.push(node);
    else stack[stack.length - 1].children.push(node);
    stack.push(node);

    if (roots.length > MAX_RECORDS) {
      throw new Error('The GEDCOM file contains too many records to import safely.');
    }
  }

  const individuals = new Map();
  const families = new Map();
  const externalNotes = new Map();
  roots.forEach((record) => {
    if (record.tag === 'INDI' && record.xref) individuals.set(record.xref, record);
    if (record.tag === 'FAM' && record.xref) families.set(record.xref, record);
    if (record.tag === 'NOTE' && record.xref) {
      externalNotes.set(record.xref, textWithContinuations(record, new Map()));
    }
  });

  if (!individuals.size) {
    throw new Error('No people were found. Choose a valid GEDCOM file containing INDI records.');
  }

  const people = [...individuals].map(([gedcomId, record]) => {
    const names = childrenWithTag(record, 'NAME');
    const nameNode = names[0];
    const name = parseName(
      nameNode?.value || '',
      firstChild(nameNode || record, 'GIVN')?.value || '',
      firstChild(nameNode || record, 'SURN')?.value || ''
    );
    const birth = firstChild(record, 'BIRT');
    const death = firstChild(record, 'DEAT');
    const occupation = firstChild(record, 'OCCU');
    const notes = childrenWithTag(record, 'NOTE')
      .map((note) => textWithContinuations(note, externalNotes))
      .filter(Boolean);
    [birth, death].filter(Boolean).forEach((event) => {
      const note = firstChild(event, 'NOTE');
      const value = textWithContinuations(note, externalNotes);
      if (value) notes.push(value);
    });
    const sex = firstChild(record, 'SEX')?.value.toUpperCase();

    return {
      gedcomId,
      ...name,
      gender: sex === 'M' ? 'male' : sex === 'F' ? 'female' : 'other',
      birthDate: dateValue(firstChild(birth || record, 'DATE')?.value || ''),
      birthPlace: firstChild(birth || record, 'PLAC')?.value.trim() || '',
      deathDate: dateValue(firstChild(death || record, 'DATE')?.value || ''),
      deathPlace: firstChild(death || record, 'PLAC')?.value.trim() || '',
      occupation: occupation?.value.trim() || '',
      biography: notes.join('\n\n')
    };
  });

  const relationships = [];
  const relationshipKeys = new Set();
  const unresolved = [];
  const addRelationship = (type, from, to, role = '') => {
    if (!from || !to || from === to || !individuals.has(from) || !individuals.has(to)) return;
    const pair = type === 'spouseOf' ? [from, to].sort().join('|') : `${from}|${to}`;
    const key = `${type}:${pair}`;
    if (relationshipKeys.has(key)) return;
    relationshipKeys.add(key);
    relationships.push({ type, from, to, ...(role ? { role } : {}) });
  };

  families.forEach((family) => {
    const husband = firstChild(family, 'HUSB')?.value.replace(/^@|@$/g, '');
    const wife = firstChild(family, 'WIFE')?.value.replace(/^@|@$/g, '');
    const children = childrenWithTag(family, 'CHIL')
      .map((child) => child.value.replace(/^@|@$/g, ''));
    if (husband && wife) addRelationship('spouseOf', husband, wife);
    if (husband && !individuals.has(husband)) unresolved.push(`Unknown person ${husband}`);
    if (wife && !individuals.has(wife)) unresolved.push(`Unknown person ${wife}`);
    children.forEach((childId) => {
      if (!individuals.has(childId)) {
        unresolved.push(`Unknown child ${childId}`);
        return;
      }
      addRelationship('parentOf', husband, childId, 'father');
      addRelationship('parentOf', wife, childId, 'mother');
    });
  });

  individuals.forEach((record, childId) => {
    childrenWithTag(record, 'FAMC').forEach((reference) => {
      const familyId = reference.value.replace(/^@|@$/g, '');
      const family = families.get(familyId);
      if (!family) {
        unresolved.push(`Unknown family ${familyId}`);
        return;
      }
      const husband = firstChild(family, 'HUSB')?.value.replace(/^@|@$/g, '');
      const wife = firstChild(family, 'WIFE')?.value.replace(/^@|@$/g, '');
      addRelationship('parentOf', husband, childId, 'father');
      addRelationship('parentOf', wife, childId, 'mother');
    });
  });

  return {
    people,
    relationships,
    warnings: [
      'GEDCOM photos and media are not imported.',
      'Unsupported custom fields and event types are not imported.',
      ...[...new Set(unresolved)].slice(0, 5)
    ]
  };
}
