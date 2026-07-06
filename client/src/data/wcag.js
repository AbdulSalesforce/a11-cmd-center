export const PRINCIPLES = [
  { id: 'perceivable',    label: '1. Perceivable' },
  { id: 'operable',      label: '2. Operable' },
  { id: 'understandable', label: '3. Understandable' },
  { id: 'robust',        label: '4. Robust' },
];

function principle(id) {
  if (id.startsWith('1.')) return 'perceivable';
  if (id.startsWith('2.')) return 'operable';
  if (id.startsWith('3.')) return 'understandable';
  return 'robust';
}

export const WCAG_CRITERIA = [
  {
    id: 'SC 1.1.1', label: 'SC 1.1.1 Non-text Content', level: 'A', full: 'SC 1.1.1 Non-text Content (Level A)',
    remediation: 'Provide text alternatives for all non-text content. Add descriptive alt text to images. Use alt="" for decorative images. For complex graphics (charts, diagrams), provide a long description via aria-describedby or adjacent text.',
  },
  {
    id: 'SC 1.2.1', label: 'SC 1.2.1 Audio-only and Video-only (Prerecorded)', level: 'A', full: 'SC 1.2.1 Audio-only and Video-only (Prerecorded) (Level A)',
    remediation: 'Provide a text transcript for prerecorded audio-only content. For video-only content, provide a text transcript or audio description that conveys all information presented visually.',
  },
  {
    id: 'SC 1.2.2', label: 'SC 1.2.2 Captions (Prerecorded)', level: 'A', full: 'SC 1.2.2 Captions (Prerecorded) (Level A)',
    remediation: 'Add synchronized captions to all prerecorded video with audio. Captions must be accurate, identify speakers, and include relevant non-speech audio cues (e.g., [music], [applause]).',
  },
  {
    id: 'SC 1.2.3', label: 'SC 1.2.3 Audio Description or Media Alternative (Prerecorded)', level: 'A', full: 'SC 1.2.3 Audio Description or Media Alternative (Prerecorded) (Level A)',
    remediation: 'Provide an audio description track or a full text alternative for prerecorded video content that describes all visual information not conveyed through the main audio track.',
  },
  {
    id: 'SC 1.2.4', label: 'SC 1.2.4 Captions (Live)', level: 'AA', full: 'SC 1.2.4 Captions (Live) (Level AA)',
    remediation: 'Provide real-time captions for all live audio and video content. Use a live captioning service where automated captions are insufficient.',
  },
  {
    id: 'SC 1.2.5', label: 'SC 1.2.5 Audio Description (Prerecorded)', level: 'AA', full: 'SC 1.2.5 Audio Description (Prerecorded) (Level AA)',
    remediation: 'Add an audio description track to all prerecorded synchronized media, narrating visual information not present in the main audio (actions, scene changes, on-screen text).',
  },
  {
    id: 'SC 1.3.1', label: 'SC 1.3.1 Info and Relationships', level: 'A', full: 'SC 1.3.1 Info and Relationships (Level A)',
    remediation: 'Use semantic HTML to convey structure and relationships: heading elements for headings, <ul>/<ol> for lists, <table> with <th scope> for data tables, <label> for form controls. Supplement with ARIA roles and properties only where semantic HTML is insufficient.',
  },
  {
    id: 'SC 1.3.2', label: 'SC 1.3.2 Meaningful Sequence', level: 'A', full: 'SC 1.3.2 Meaningful Sequence (Level A)',
    remediation: 'Ensure the DOM order reflects the logical reading sequence. Avoid using CSS order, position, or float to rearrange content in a way that differs meaningfully from the DOM order.',
  },
  {
    id: 'SC 1.3.3', label: 'SC 1.3.3 Sensory Characteristics', level: 'A', full: 'SC 1.3.3 Sensory Characteristics (Level A)',
    remediation: 'Do not rely solely on shape, size, color, or spatial location to convey instructions. Supplement all sensory references with a text label (e.g., replace "click the button on the right" with "click the Submit button").',
  },
  {
    id: 'SC 1.3.4', label: 'SC 1.3.4 Orientation', level: 'AA', full: 'SC 1.3.4 Orientation (Level AA)',
    remediation: 'Remove CSS or JavaScript that locks the page to a single orientation. Allow content to adapt to both portrait and landscape orientations unless a specific orientation is essential to the functionality.',
  },
  {
    id: 'SC 1.3.5', label: 'SC 1.3.5 Identify Input Purpose', level: 'AA', full: 'SC 1.3.5 Identify Input Purpose (Level AA)',
    remediation: 'Add autocomplete attributes to inputs that collect personal user data. Use the appropriate token values (e.g., name, email, tel, street-address) as defined in the WCAG autocomplete tokens list.',
  },
  {
    id: 'SC 1.4.1', label: 'SC 1.4.1 Use of Color', level: 'A', full: 'SC 1.4.1 Use of Color (Level A)',
    remediation: 'Do not use color as the only visual means of conveying information. Add a secondary indicator such as a text label, icon, pattern, or underline to supplement any color-coded information.',
  },
  {
    id: 'SC 1.4.2', label: 'SC 1.4.2 Audio Control', level: 'A', full: 'SC 1.4.2 Audio Control (Level A)',
    remediation: 'Provide a mechanism to pause, stop, or mute any audio that plays automatically for more than 3 seconds. Place the control near the top of the page or adjacent to the audio source.',
  },
  {
    id: 'SC 1.4.3', label: 'SC 1.4.3 Contrast (Minimum)', level: 'AA', full: 'SC 1.4.3 Contrast (Minimum) (Level AA)',
    remediation: 'Ensure normal text has a contrast ratio of at least 4.5:1 and large text (18pt regular or 14pt bold) at least 3:1 against its background. Adjust foreground or background color values to meet the required threshold.',
  },
  {
    id: 'SC 1.4.4', label: 'SC 1.4.4 Resize text', level: 'AA', full: 'SC 1.4.4 Resize text (Level AA)',
    remediation: 'Ensure the page remains readable and functional when browser text size is increased to 200%. Use relative units (rem, em) for font sizes. Replace fixed height on text containers with min-height to prevent text clipping.',
  },
  {
    id: 'SC 1.4.5', label: 'SC 1.4.5 Images of Text', level: 'AA', full: 'SC 1.4.5 Images of Text (Level AA)',
    remediation: 'Replace images of text with real text styled via CSS. Exceptions apply only to logotypes and cases where a specific visual rendering of text is essential.',
  },
  {
    id: 'SC 1.4.10', label: 'SC 1.4.10 Reflow', level: 'AA', full: 'SC 1.4.10 Reflow (Level AA)',
    remediation: 'Ensure content can be presented in a single column at 320px viewport width without horizontal scrolling. Use responsive layouts, flexible widths, and media queries. Avoid fixed-width containers.',
  },
  {
    id: 'SC 1.4.11', label: 'SC 1.4.11 Non-text Contrast', level: 'AA', full: 'SC 1.4.11 Non-text Contrast (Level AA)',
    remediation: 'Ensure UI component boundaries (inputs, buttons, checkboxes) and informational graphics have a contrast ratio of at least 3:1 against adjacent colors. Adjust border, outline, or fill colors as needed.',
  },
  {
    id: 'SC 1.4.12', label: 'SC 1.4.12 Text Spacing', level: 'AA', full: 'SC 1.4.12 Text Spacing (Level AA)',
    remediation: 'Ensure no content or functionality is lost when users apply these text spacing overrides: line-height 1.5×, letter-spacing 0.12em, word-spacing 0.16em, paragraph spacing 2em. Replace fixed heights on text containers with min-height.',
  },
  {
    id: 'SC 1.4.13', label: 'SC 1.4.13 Content on Hover or Focus', level: 'AA', full: 'SC 1.4.13 Content on Hover or Focus (Level AA)',
    remediation: 'Ensure hover/focus-triggered content is: dismissible without moving focus (e.g., via Escape key), hoverable (pointer can move over the revealed content without it disappearing), and persistent until dismissed or focus moves away.',
  },
  {
    id: 'SC 2.1.1', label: 'SC 2.1.1 Keyboard', level: 'A', full: 'SC 2.1.1 Keyboard (Level A)',
    remediation: 'Ensure all functionality is operable by keyboard alone. Custom interactive elements must be focusable (tabindex="0"), handle keyboard activation (Enter/Space), and follow ARIA Authoring Practices Guide patterns for their widget type.',
  },
  {
    id: 'SC 2.1.2', label: 'SC 2.1.2 No Keyboard Trap', level: 'A', full: 'SC 2.1.2 No Keyboard Trap (Level A)',
    remediation: 'Ensure keyboard focus is never trapped inside a component except in intentional modal dialogs. Dialogs must implement a focus trap that cycles within the dialog and releases focus when the dialog closes.',
  },
  {
    id: 'SC 2.1.4', label: 'SC 2.1.4 Character Key Shortcuts', level: 'A', full: 'SC 2.1.4 Character Key Shortcuts (Level A)',
    remediation: 'Provide a way to turn off or remap single-character keyboard shortcuts. Alternatively, scope shortcuts so they only activate when the relevant component has focus.',
  },
  {
    id: 'SC 2.2.1', label: 'SC 2.2.1 Timing Adjustable', level: 'A', full: 'SC 2.2.1 Timing Adjustable (Level A)',
    remediation: 'Display a session timeout warning at least 20 seconds before expiry and provide an option to extend the session. Allow users to turn off, adjust, or extend any time limits.',
  },
  {
    id: 'SC 2.2.2', label: 'SC 2.2.2 Pause, Stop, Hide', level: 'A', full: 'SC 2.2.2 Pause, Stop, Hide (Level A)',
    remediation: 'Provide controls to pause, stop, or hide all moving, blinking, or auto-updating content that lasts more than 5 seconds. Place the control adjacent to the moving content.',
  },
  {
    id: 'SC 2.3.1', label: 'SC 2.3.1 Three Flashes or Below Threshold', level: 'A', full: 'SC 2.3.1 Three Flashes or Below Threshold (Level A)',
    remediation: 'Remove or replace content that flashes more than 3 times per second. If flashing is necessary, ensure the flashing area occupies less than 25% of any 10-degree visual field.',
  },
  {
    id: 'SC 2.4.1', label: 'SC 2.4.1 Bypass Blocks', level: 'A', full: 'SC 2.4.1 Bypass Blocks (Level A)',
    remediation: 'Add a skip link as the first focusable element: <a href="#main-content" class="skip-link">Skip to main content</a>. Ensure the link is visible on focus and the target element has id="main-content" with tabindex="-1".',
  },
  {
    id: 'SC 2.4.2', label: 'SC 2.4.2 Page Titled', level: 'A', full: 'SC 2.4.2 Page Titled (Level A)',
    remediation: 'Add a descriptive <title> element to every page in the format "Page Name – Site Name". For single-page applications, update document.title on every route change.',
  },
  {
    id: 'SC 2.4.3', label: 'SC 2.4.3 Focus Order', level: 'A', full: 'SC 2.4.3 Focus Order (Level A)',
    remediation: 'Ensure interactive elements receive keyboard focus in a logical order matching the visual layout. Correct DOM order to match visual order. Avoid positive tabindex values (> 0).',
  },
  {
    id: 'SC 2.4.4', label: 'SC 2.4.4 Link Purpose (In Context)', level: 'A', full: 'SC 2.4.4 Link Purpose (In Context) (Level A)',
    remediation: 'Ensure each link\'s purpose is clear from its text alone or from its surrounding context (paragraph, list item, table cell). Replace "click here" and "read more" with descriptive text, or add aria-label with a more descriptive name.',
  },
  {
    id: 'SC 2.4.5', label: 'SC 2.4.5 Multiple Ways', level: 'AA', full: 'SC 2.4.5 Multiple Ways (Level AA)',
    remediation: 'Provide at least two mechanisms for locating any page (e.g., navigation menu + site search, or sitemap + breadcrumbs). Ensure both mechanisms are keyboard accessible.',
  },
  {
    id: 'SC 2.4.6', label: 'SC 2.4.6 Headings and Labels', level: 'AA', full: 'SC 2.4.6 Headings and Labels (Level AA)',
    remediation: 'Ensure all headings accurately describe their section content. Ensure all form labels clearly identify their associated control. Avoid vague headings such as "Details" or "Info".',
  },
  {
    id: 'SC 2.4.7', label: 'SC 2.4.7 Focus Visible', level: 'AA', full: 'SC 2.4.7 Focus Visible (Level AA)',
    remediation: 'Ensure a clearly visible focus indicator is present on all interactive elements when focused via keyboard. Do not suppress outlines with outline: none unless replaced with a custom focus style with at least 3:1 contrast against adjacent colors.',
  },
  {
    id: 'SC 2.4.10', label: 'SC 2.4.10 Section Headings', level: 'A', full: 'SC 2.4.10 Section Headings (Level A)',
    remediation: 'Use <h1>–<h6> elements to organize content into labeled sections. Ensure heading levels are nested logically without skipping levels.',
  },
  {
    id: 'SC 2.4.11', label: 'SC 2.4.11 Focus Not Obscured (Minimum)', level: 'AA', full: 'SC 2.4.11 Focus Not Obscured (Minimum) (Level AA)',
    remediation: 'Ensure focused components are not entirely hidden by sticky headers, footers, or overlapping elements. Add scroll-padding-top equal to the sticky header height so focused elements are not scrolled behind it.',
  },
  {
    id: 'SC 2.5.1', label: 'SC 2.5.1 Pointer Gestures', level: 'A', full: 'SC 2.5.1 Pointer Gestures (Level A)',
    remediation: 'Provide single-pointer alternatives for all multipoint or path-based gestures. For example, supplement pinch-to-zoom with +/- buttons, and supplement swipe carousels with previous/next buttons.',
  },
  {
    id: 'SC 2.5.2', label: 'SC 2.5.2 Pointer Cancellation', level: 'A', full: 'SC 2.5.2 Pointer Cancellation (Level A)',
    remediation: 'Use pointerup (or mouseup/touchend) events to activate controls, not pointerdown. This allows users to cancel an accidental activation by moving the pointer away before releasing.',
  },
  {
    id: 'SC 2.5.3', label: 'SC 2.5.3 Label in Name', level: 'A', full: 'SC 2.5.3 Label in Name (Level A)',
    remediation: 'Ensure the accessible name of each component contains its visible label text. When using aria-label, include the full visible text string within the label value.',
  },
  {
    id: 'SC 2.5.4', label: 'SC 2.5.4 Motion Actuation', level: 'A', full: 'SC 2.5.4 Motion Actuation (Level A)',
    remediation: 'Provide UI-based alternatives for all functionality triggered by device motion (shake, tilt). Allow motion actuation to be disabled via a user setting.',
  },
  {
    id: 'SC 2.5.7', label: 'SC 2.5.7 Dragging Movements', level: 'AA', full: 'SC 2.5.7 Dragging Movements (Level AA)',
    remediation: 'Provide a single-pointer alternative for all drag-and-drop functionality (e.g., arrow buttons to reorder list items). Users should not need to perform a path-based dragging gesture to complete any action.',
  },
  {
    id: 'SC 2.5.8', label: 'SC 2.5.8 Target Size (Minimum)', level: 'AA', full: 'SC 2.5.8 Target Size (Minimum) (Level AA)',
    remediation: 'Ensure all interactive targets are at least 24×24 CSS pixels. Increase padding or the clickable area of small controls to meet the minimum, or ensure adequate spacing surrounds them.',
  },
  {
    id: 'SC 3.1.1', label: 'SC 3.1.1 Language of Page', level: 'A', full: 'SC 3.1.1 Language of Page (Level A)',
    remediation: 'Add lang="en" (or the appropriate BCP 47 language code) to the <html> element. This must reflect the primary language of the page content and should be set server-side.',
  },
  {
    id: 'SC 3.1.2', label: 'SC 3.1.2 Language of Parts', level: 'AA', full: 'SC 3.1.2 Language of Parts (Level AA)',
    remediation: 'Wrap inline text in a language different from the page default with a lang attribute on the containing element: e.g., <span lang="fr">Bonjour</span>.',
  },
  {
    id: 'SC 3.2.1', label: 'SC 3.2.1 On Focus', level: 'A', full: 'SC 3.2.1 On Focus (Level A)',
    remediation: 'Ensure focusing a component does not trigger a context change (navigation, form submission, new window). Reserve those actions for explicit user activation via click or Enter/Space keypress.',
  },
  {
    id: 'SC 3.2.2', label: 'SC 3.2.2 On Input', level: 'A', full: 'SC 3.2.2 On Input (Level A)',
    remediation: 'Ensure changing a form control\'s value does not automatically cause a context change. Actions such as navigation or form submission must be triggered by an explicit user action (e.g., pressing a submit button).',
  },
  {
    id: 'SC 3.2.3', label: 'SC 3.2.3 Consistent Navigation', level: 'AA', full: 'SC 3.2.3 Consistent Navigation (Level AA)',
    remediation: 'Ensure repeated navigation components appear in the same relative order across all pages. Do not reorder navigation items between pages unless the user has explicitly initiated the change.',
  },
  {
    id: 'SC 3.2.4', label: 'SC 3.2.4 Consistent Identification', level: 'AA', full: 'SC 3.2.4 Consistent Identification (Level AA)',
    remediation: 'Ensure components with the same function use the same accessible name across all pages. Standardize labels for repeated elements such as search inputs, close buttons, and primary navigation links.',
  },
  {
    id: 'SC 3.2.6', label: 'SC 3.2.6 Consistent Help', level: 'A', full: 'SC 3.2.6 Consistent Help (Level A)',
    remediation: 'Ensure help mechanisms (contact links, live chat, support numbers) appear in the same relative order on every page where they are present.',
  },
  {
    id: 'SC 3.3.1', label: 'SC 3.3.1 Error Identification', level: 'A', full: 'SC 3.3.1 Error Identification (Level A)',
    remediation: 'Display error messages as visible text adjacent to the invalid field. Programmatically associate each error message to its field via aria-describedby. Set aria-invalid="true" on the field. Error messages must describe what went wrong and how to fix it.',
  },
  {
    id: 'SC 3.3.2', label: 'SC 3.3.2 Labels or Instructions', level: 'A', full: 'SC 3.3.2 Labels or Instructions (Level A)',
    remediation: 'Provide a visible <label> for all form inputs, associated via for/id attributes. Include format instructions for complex inputs (e.g., date format). Place instructions before the input so they are announced before the user enters the field.',
  },
  {
    id: 'SC 3.3.4', label: 'SC 3.3.4 Error Prevention (Legal, Financial, Data)', level: 'AA', full: 'SC 3.3.4 Error Prevention (Legal, Financial, Data) (Level AA)',
    remediation: 'For submissions with legal, financial, or data-deletion consequences: provide a review screen before final submission, allow users to correct errors, or make the submission reversible with an undo mechanism.',
  },
  {
    id: 'SC 3.3.6', label: 'SC 3.3.6 Error Prevention (All)', level: 'AA', full: 'SC 3.3.6 Error Prevention (All) (Level AA)',
    remediation: 'For all form submissions: allow users to review, correct, and confirm their data before final submission, or make the submission reversible.',
  },
  {
    id: 'SC 3.3.7', label: 'SC 3.3.7 Redundant Entry', level: 'A', full: 'SC 3.3.7 Redundant Entry (Level A)',
    remediation: 'Do not require users to re-enter information already provided in the same session. Auto-populate fields with previously entered data or provide it for selection, unless re-entry is required for security.',
  },
  {
    id: 'SC 3.3.8', label: 'SC 3.3.8 Accessible Authentication (Minimum)', level: 'AA', full: 'SC 3.3.8 Accessible Authentication (Minimum) (Level AA)',
    remediation: 'Remove cognitive function tests (puzzles, image transcription, memory tasks) as the sole means of authentication. Support copy-paste in credential fields, allow password managers, and offer at least one alternative authentication method.',
  },
  {
    id: 'SC 4.1.1', label: 'SC 4.1.1 Parsing', level: 'A', full: 'SC 4.1.1 Parsing (Level A)',
    remediation: 'Ensure HTML is valid and well-formed: no duplicate id attributes, all tags properly closed and correctly nested. Run the page through the W3C HTML Validator and resolve all reported errors.',
  },
  {
    id: 'SC 4.1.2', label: 'SC 4.1.2 Name, Role, Value', level: 'A', full: 'SC 4.1.2 Name, Role, Value (Level A)',
    remediation: 'All custom interactive components must have: an accessible name (via <label>, aria-label, or aria-labelledby), a correct ARIA role, and programmatic state/value (e.g., aria-expanded, aria-checked, aria-selected). Verify announcements with a screen reader.',
  },
  {
    id: 'SC 4.1.3', label: 'SC 4.1.3 Status Messages', level: 'AA', full: 'SC 4.1.3 Status Messages (Level AA)',
    remediation: 'Use role="status" for non-urgent status messages (success confirmations, search result counts) and role="alert" for urgent messages (errors, warnings). Ensure the live region container is present in the DOM before the message is injected.',
  },
];

export const WCAG_CRITERIA_WITH_PRINCIPLE = WCAG_CRITERIA.map(c => ({
  ...c,
  principle: principle(c.id.replace('SC ', '')),
}));

export function getSuggestedSeverity(wcagId) {
  const criterion = WCAG_CRITERIA.find(c => c.id === wcagId);
  if (!criterion) return 'P2';
  return criterion.level === 'A' ? 'P1' : 'P2';
}
