// Local failure store — persists failures logged through the Log-failure panel to
// localStorage, keyed by project id, so newly logged bugs show up in the project's
// failures table even when the API backend isn't running. Mirrors projectStore.js.
const STORAGE_KEY = 'a11y-cc-failures';

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // storage full or unavailable — the failure just won't persist
  }
}

// All locally-stored failures for a project, oldest first (so sf_issue_id order
// matches insertion order).
export function getStoredFailures(projectId) {
  return readAll()[projectId] ?? [];
}

// Persist a new failure for a project, assigning it an id and a sequential
// sf_issue_id that continues from whatever is already in the table. Returns the
// saved failure.
export function addStoredFailure(projectId, failure, existingCount = 0) {
  const map = readAll();
  const list = map[projectId] ?? [];
  const nextId = Math.max(existingCount, list.length) + 1;
  const saved = {
    ...failure,
    id: `local-${crypto.randomUUID()}`,
    sf_issue_id: failure.sf_issue_id ?? nextId,
  };
  map[projectId] = [...list, saved];
  writeAll(map);
  return saved;
}
