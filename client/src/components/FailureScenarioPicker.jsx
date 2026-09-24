import { useState, useRef, useEffect, useId } from 'react';
import ISSUE_LIBRARY from '../data/issue-library.json';

// Unique, non-empty failing-scenario values from the issue library — these are
// the "Failure Scenario" column entries the auditor picks from.
const SCENARIOS = [...new Set(
  ISSUE_LIBRARY.map(i => i.failing_scenario).filter(Boolean)
)];

// Searchable combobox for the "Failure scenario" field. Options come from the
// issue library; the user can filter by typing. Free text is allowed so an
// unlisted scenario can still be recorded — onChange always receives the
// current text, whether typed or selected.
export default function FailureScenarioPicker({ value, onChange, id = 'failure_scenario' }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const listboxId = useId();

  const query = value || '';
  const filtered = query.trim()
    ? SCENARIOS.filter(s => s.toLowerCase().includes(query.toLowerCase()))
    : SCENARIOS;

  function select(scenario) {
    onChange(scenario);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleInputChange(e) {
    onChange(e.target.value);
    setOpen(true);
    setActiveIndex(-1);
  }

  function handleKeyDown(e) {
    if (!open || filtered.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      select(filtered[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  // Scroll active option into view.
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      listRef.current.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  // Close on outside click.
  useEffect(() => {
    function handleClick(e) {
      if (!inputRef.current?.closest('.wcag-combobox')?.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function highlight(text) {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark>{text.slice(idx, idx + query.length)}</mark>
        {text.slice(idx + query.length)}
      </>
    );
  }

  return (
    <div className="wcag-combobox">
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open && filtered.length > 0}
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
        aria-autocomplete="list"
        aria-describedby={`${id}_hint`}
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setOpen(true)}
        placeholder="Type to search the issue library…"
        autoComplete="off"
      />

      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="Failure scenarios"
          className="wcag-listbox"
        >
          {filtered.map((s, i) => (
            <li
              key={s}
              id={`${listboxId}-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className="wcag-option"
              onMouseDown={e => { e.preventDefault(); select(s); }}
            >
              {highlight(s)}
            </li>
          ))}
        </ul>
      )}

      {open && query.trim() && filtered.length === 0 && (
        <ul className="wcag-listbox" role="listbox">
          <li className="wcag-option" style={{ color: 'var(--color-text-secondary)', cursor: 'default' }}>
            No matching scenarios — this will be saved as entered.
          </li>
        </ul>
      )}

      <span id={`${id}_hint`} className="field-hint">
        Start typing to match a standard scenario, or enter your own.
      </span>
    </div>
  );
}
