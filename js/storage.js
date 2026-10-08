function readTreeData(storageKey = FAMILY_STORAGE_KEY) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.people)) return null;
    return parsed;
  } catch (error) {
    console.warn('Could not read family data:', error);
    return null;
  }
}

function writeTreeData(data, storageKey = FAMILY_STORAGE_KEY) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Save failed:', error);
    return false;
  }
}

function exportTreeJson(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'family-tree-export.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function importTreeJson(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file selected'));
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed || !Array.isArray(parsed.people)) {
          throw new Error('Invalid family tree file');
        }
        resolve(parsed);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Unable to read import file'));
    reader.readAsText(file);
  });
}

function getStorageEstimate() {
  const estimate = localStorage.length;
  return `${estimate} KB`;
}
