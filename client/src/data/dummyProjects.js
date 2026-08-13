// Dummy projects used as a fallback when the API returns nothing (or isn't running).
// Shared by the Active Projects list and the Project detail page so demo data
// stays consistent across both.
export const DUMMY_PROJECTS = [
  {
    id: 'demo-1',
    product_name: 'Sales Cloud — Opportunity Kanban',
    auditor_name: 'Alex Rivera',
    pm_name: 'Jordan Lee',
    pm_email: 'jordan.lee@example.com',
    release_build_name: 'Spring ’26 (248)',
    slack_channel: '#a11y-sales-cloud',
    failure_count: 7,
    scope_complete: 8,
    scope_total: 12,
    archived: false,
  },
  {
    id: 'demo-2',
    product_name: 'Service Cloud — Case Feed',
    auditor_name: 'Alex Rivera',
    pm_name: 'Sam Carter',
    pm_email: 'sam.carter@example.com',
    release_build_name: 'Spring ’26 (248)',
    slack_channel: '#a11y-service-cloud',
    failure_count: 3,
    scope_complete: 5,
    scope_total: 5,
    archived: false,
  },
  {
    id: 'demo-3',
    product_name: 'Marketing Cloud — Email Builder',
    auditor_name: 'Priya Nair',
    pm_name: 'Dana White',
    pm_email: 'dana.white@example.com',
    release_build_name: 'Winter ’26 (246)',
    slack_channel: '#a11y-marketing-cloud',
    failure_count: 12,
    scope_complete: 2,
    scope_total: 10,
    archived: false,
  },
  {
    id: 'demo-4',
    product_name: 'Commerce Cloud — Checkout Flow',
    auditor_name: 'Priya Nair',
    pm_name: 'Chris Doyle',
    pm_email: 'chris.doyle@example.com',
    release_build_name: 'Winter ’26 (246)',
    slack_channel: '#a11y-commerce-cloud',
    failure_count: 0,
    scope_complete: 0,
    scope_total: 6,
    archived: false,
  },
  {
    id: 'demo-5',
    product_name: 'Tableau — Dashboard Viewer',
    auditor_name: 'Unassigned',
    pm_name: 'Morgan Reid',
    pm_email: 'morgan.reid@example.com',
    release_build_name: 'Summer ’26 (250)',
    slack_channel: '#a11y-tableau',
    failure_count: 4,
    scope_complete: 3,
    scope_total: 9,
    archived: false,
  },
];

// Look up a single dummy project by its id.
export function getDummyProject(id) {
  return DUMMY_PROJECTS.find(p => p.id === id) || null;
}
