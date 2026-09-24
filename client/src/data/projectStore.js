// Local project store — persists projects created through the New Project form
// to localStorage so they show up in Active Projects and their detail page even
// when the API backend isn't running. This mirrors the dummy-data approach used
// elsewhere in the app.
const STORAGE_KEY = 'a11y-cc-projects';

export function getStoredProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getStoredProject(id) {
  return getStoredProjects().find(p => p.id === id) || null;
}

// Persist a new project, assigning it an id. Returns the saved project.
export function addStoredProject(project) {
  const projects = getStoredProjects();
  const saved = {
    ...project,
    id: `local-${crypto.randomUUID()}`,
    archived: false,
    failure_count: 0,
    scope_complete: 0,
    scope_total: project.scope_items?.length ?? 0,
  };
  projects.unshift(saved);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // storage full or unavailable — the project just won't persist
  }
  return saved;
}

// Update an existing locally-stored project in place. Returns the updated
// project, or null if no local project has that id.
export function updateStoredProject(id, patch) {
  const projects = getStoredProjects();
  const idx = projects.findIndex(p => p.id === id);
  if (idx === -1) return null;
  const updated = {
    ...projects[idx],
    ...patch,
    id,
    scope_total: patch.scope_items?.length ?? projects[idx].scope_total,
  };
  projects[idx] = updated;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // storage full or unavailable — the edit just won't persist
  }
  return updated;
}
