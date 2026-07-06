import { useState, useRef, useEffect, useId } from 'react';
import { WCAG_CRITERIA } from '../data/wcag';

export default function WcagPicker({ value, onChange, error }) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const listboxId = useId();

  const filtered = query.length < 2
    ? []
    : WCAG_CRITERIA.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.id.toLowerCase().includes(query.toLowerCase())
      );

  const selected = WCAG_CRITERIA.find(c => c.full === value);

  function select(criterion) {
    onChange(criterion.full);
    setQuery(criterion.label);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleInputChange(e) {
    setQuery(e.target.value);
    onChange('');
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

  // Scroll active option into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const option = listRef.current.children[activeIndex];
      option?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  // Close on outside click
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
    if (!query) return text;
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
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          id="wcag_criterion"
          type="text"
          role="combobox"
          aria-expanded={open && filtered.length > 0}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `wcag-option-${activeIndex}` : undefined}
          aria-required="true"
          aria-invalid={!!error}
          aria-describedby={error ? 'wcag_criterion_err' : 'wcag_criterion_hint'}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Type to search, e.g. focus or 2.4.3"
          autoComplete="off"
        />
        {selected && (
          <span className="wcag-level-pill" aria-label={`Level ${selected.level}`}>
            {selected.level}
          </span>
        )}
      </div>

      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="WCAG success criteria"
          className="wcag-listbox"
        >
          {filtered.map((c, i) => (
            <li
              key={c.id}
              id={`wcag-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className="wcag-option"
              onMouseDown={e => { e.preventDefault(); select(c); }}
            >
              {highlight(c.label)}
              <span style={{ marginLeft: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                Level {c.level}
              </span>
            </li>
          ))}
        </ul>
      )}

      {open && query.length >= 2 && filtered.length === 0 && (
        <ul className="wcag-listbox" role="listbox">
          <li className="wcag-option" style={{ color: 'var(--color-text-secondary)', cursor: 'default' }}>
            No criteria match "{query}"
          </li>
        </ul>
      )}

      <span id="wcag_criterion_hint" className="field-hint">
        Start typing the criterion number or name.
      </span>
    </div>
  );
}
