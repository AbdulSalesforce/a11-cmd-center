import { useState, useRef, useEffect, useId } from 'react';
import '../styles/failure-form.css'; // provides .wcag-combobox / .wcag-listbox / .wcag-option

// Searchable combobox for the "Found in build" field. As the auditor types, it
// live-searches builds (ADM_Build__c) in GUS. The box shows the build name; a
// build is only committed when a result is picked — picking one reports the
// whole build via onSelect so the parent can store its name + id. Free text that
// isn't confirmed by a selection is dropped on blur, so only a real GUS build can
// be recorded.
export default function BuildPicker({ value, onChange, onSelect, id, ...rest }) {
  const [query, setQuery] = useState(value || '');
  const [selected, setSelected] = useState(null); // { id, name } once picked
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

  // Whether the box holds text the user typed but hasn't confirmed by picking a
  // result — used to drop that text on blur so only real selections survive.
  const [dirty, setDirty] = useState(false);

  // Render-time sync so an EXTERNAL value change flows into the box, but not our
  // own selection. The box and value are both the build name.
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (!(selected && value === selected.name)) {
      setQuery(value || '');
      setSelected(null);
      setDirty(false);
    }
  }

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
        const res = await fetch(`/api/gus/builds?q=${encodeURIComponent(term.trim())}`);
        const data = await res.json().catch(() => ({}));
        if (seq !== requestSeq.current) return; // superseded by a newer request
        if (!res.ok) throw new Error(data.error || 'Lookup failed');
        setResults(data.builds || []);
        setError('');
      } catch (err) {
        if (seq !== requestSeq.current) return;
        setResults([]);
        setError(err.message || 'Unable to search GUS builds.');
      } finally {
        if (seq === requestSeq.current) setLoading(false);
      }
    }, 300);
  }

  function handleInputChange(e) {
    const text = e.target.value;
    // Typing only filters the list — a build is only accepted once picked from
    // the results (see select), so free text can't be submitted.
    setDirty(true);
    setQuery(text);
    setSelected(null);
    setOpen(true);
    setActiveIndex(-1);
    search(text);
  }

  function select(build) {
    setDirty(false);
    setSelected(build);
    setQuery(build.name);
    onSelect(build); // parent stores build.name + build.id
    setResults([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  // Leaving without confirming a selection drops the typed text and clears any
  // stale committed build, so an unmatched entry can never be submitted.
  function handleBlur() {
    setOpen(false);
    if (dirty && !selected) {
      setQuery('');
      onChange('');
      setDirty(false);
    }
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
    const q = query.trim();
    if (!q) return text;
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

  const showList = open && (loading || results.length > 0 || error || query.trim().length >= 2);

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
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => { setOpen(true); if (query.trim().length >= 2 && results.length === 0) search(query); }}
        onBlur={handleBlur}
        placeholder="Type a build name to search GUS…"
        autoComplete="off"
        {...rest}
      />

      {showList && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="GUS builds"
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

          {!loading && !error && results.map((build, i) => (
            <li
              key={build.id}
              id={`${listboxId}-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className="wcag-option"
              onMouseDown={e => { e.preventDefault(); select(build); }}
            >
              <div>{highlight(build.name)}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                {build.id}
              </div>
            </li>
          ))}

          {!loading && !error && results.length === 0 && query.trim().length >= 2 && (
            <li className="wcag-option" style={{ color: 'var(--color-text-secondary)', cursor: 'default' }}>
              No matching builds in GUS.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
