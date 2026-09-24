import { useState, useRef, useEffect, useId } from 'react';
import '../styles/failure-form.css'; // provides .wcag-combobox / .wcag-listbox / .wcag-option

// Autocomplete for an auditor's name. As the user types a name OR email, it
// live-searches active Salesforce users (employees) in GUS. Unlike the build /
// theme pickers this is NOT selection-only: the field is a plain name, so free
// text is kept — GUS results are just suggestions. Picking one fills the name
// and reports the whole employee (name + email) via onSelect.
export default function EmployeePicker({ value, onChange, onSelect, id, placeholder, ...rest }) {
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inputRef = useRef(null);
  const listRef = useRef(null);
  const debounceRef = useRef(null);
  const requestSeq = useRef(0);
  const listboxId = useId();

  // Debounced live search against GUS.
  function search(term) {
    clearTimeout(debounceRef.current);
    if (term.trim().length < 2) {
      setResults([]);
      setLoading(false);
      setError('');
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const seq = ++requestSeq.current;
      try {
        const res = await fetch(`/api/gus/employees?q=${encodeURIComponent(term.trim())}`);
        const data = await res.json().catch(() => ({}));
        if (seq !== requestSeq.current) return; // superseded by a newer request
        if (!res.ok) throw new Error(data.error || 'Lookup failed');
        setResults(data.employees || []);
        setError('');
      } catch (err) {
        if (seq !== requestSeq.current) return;
        setResults([]);
        setError(err.message || 'Unable to search GUS employees.');
      } finally {
        if (seq === requestSeq.current) setLoading(false);
      }
    }, 300);
  }

  function handleInputChange(e) {
    const text = e.target.value;
    onChange(text); // free text is kept — the field value is the typed name
    setOpen(true);
    setActiveIndex(-1);
    search(text);
  }

  function select(employee) {
    onChange(employee.name);
    if (onSelect) onSelect(employee); // parent can also capture the email
    setResults([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e) {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      select(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  // Scroll the active option into view.
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
    const q = (value || '').trim();
    if (!q || !text) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark>{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    );
  }

  const showList = open && (loading || results.length > 0 || error);

  return (
    <div className="wcag-combobox">
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
        aria-autocomplete="list"
        value={value || ''}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => { if ((value || '').trim().length >= 2 && results.length === 0) search(value); setOpen(true); }}
        placeholder={placeholder || 'Type a name or email to search GUS…'}
        autoComplete="off"
        {...rest}
      />

      {showList && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="GUS employees"
          className="wcag-listbox"
        >
          {loading && (
            <li className="wcag-option" style={{ color: 'var(--color-text-secondary)', cursor: 'default' }}>
              Searching GUS…
            </li>
          )}

          {!loading && error && (
            <li className="wcag-option" style={{ color: 'var(--color-danger)', cursor: 'default' }}>
              {error}
            </li>
          )}

          {!loading && !error && results.map((emp, i) => (
            <li
              key={emp.id}
              id={`${listboxId}-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className="wcag-option"
              onMouseDown={e => { e.preventDefault(); select(emp); }}
            >
              <div>{highlight(emp.name)}</div>
              {emp.email && (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  {highlight(emp.email)}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
