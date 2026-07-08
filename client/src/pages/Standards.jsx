import { useState } from 'react';
import { Link } from 'react-router-dom';
import standardsContent from '../data/standards-content.json';

export default function Standards() {
  const [filters, setFilters] = useState({
    levelA: true,
    levelAA: true,
    newIn22: false
  });

  // Success criteria new in WCAG 2.2
  const newIn22 = ['2.4.11', '2.5.8', '3.3.7', '3.3.8'];

  function toggleFilter(filterName) {
    setFilters(prev => ({ ...prev, [filterName]: !prev[filterName] }));
  }

  // WCAG 2.2 Success Criteria organized by POUR principles
  const criteria = {
    perceivable: {
      title: '1. Perceivable',
      description: 'Information and user interface components must be presentable to users in ways they can perceive.',
      levelA: [
        { id: '1.1.1', name: 'Non-text Content' },
        { id: '1.2.1', name: 'Audio-only and Video-only (Prerecorded)' },
        { id: '1.2.2', name: 'Captions (Prerecorded)' },
        { id: '1.2.3', name: 'Audio Description or Media Alternative (Prerecorded)' },
        { id: '1.3.1', name: 'Info and Relationships' },
        { id: '1.3.2', name: 'Meaningful Sequence' },
        { id: '1.3.3', name: 'Sensory Characteristics' },
        { id: '1.4.1', name: 'Use of Color' },
        { id: '1.4.2', name: 'Audio Control' },
      ],
      levelAA: [
        { id: '1.2.4', name: 'Captions (Live)' },
        { id: '1.2.5', name: 'Audio Description (Prerecorded)' },
        { id: '1.3.4', name: 'Orientation' },
        { id: '1.3.5', name: 'Identify Input Purpose' },
        { id: '1.4.3', name: 'Contrast (Minimum)' },
        { id: '1.4.4', name: 'Resize Text' },
        { id: '1.4.5', name: 'Images of Text' },
        { id: '1.4.10', name: 'Reflow' },
        { id: '1.4.11', name: 'Non-text Contrast' },
        { id: '1.4.12', name: 'Text Spacing' },
        { id: '1.4.13', name: 'Content on Hover or Focus' },
      ]
    },
    operable: {
      title: '2. Operable',
      description: 'User interface components and navigation must be operable.',
      levelA: [
        { id: '2.1.1', name: 'Keyboard' },
        { id: '2.1.2', name: 'No Keyboard Trap' },
        { id: '2.1.4', name: 'Character Key Shortcuts' },
        { id: '2.2.1', name: 'Timing Adjustable' },
        { id: '2.2.2', name: 'Pause, Stop, Hide' },
        { id: '2.3.1', name: 'Three Flashes or Below Threshold' },
        { id: '2.4.1', name: 'Bypass Blocks' },
        { id: '2.4.2', name: 'Page Titled' },
        { id: '2.4.3', name: 'Focus Order' },
        { id: '2.4.4', name: 'Link Purpose (In Context)' },
        { id: '2.5.1', name: 'Pointer Gestures' },
        { id: '2.5.2', name: 'Pointer Cancellation' },
        { id: '2.5.3', name: 'Label in Name' },
        { id: '2.5.4', name: 'Motion Actuation' },
      ],
      levelAA: [
        { id: '2.4.5', name: 'Multiple Ways' },
        { id: '2.4.6', name: 'Headings and Labels' },
        { id: '2.4.7', name: 'Focus Visible' },
        { id: '2.4.11', name: 'Focus Not Obscured (Minimum)' },
        { id: '2.5.8', name: 'Target Size (Minimum)' },
      ]
    },
    understandable: {
      title: '3. Understandable',
      description: 'Information and the operation of user interface must be understandable.',
      levelA: [
        { id: '3.1.1', name: 'Language of Page' },
        { id: '3.2.1', name: 'On Focus' },
        { id: '3.2.2', name: 'On Input' },
        { id: '3.3.1', name: 'Error Identification' },
        { id: '3.3.2', name: 'Labels or Instructions' },
        { id: '3.3.7', name: 'Redundant Entry' },
      ],
      levelAA: [
        { id: '3.1.2', name: 'Language of Parts' },
        { id: '3.2.3', name: 'Consistent Navigation' },
        { id: '3.2.4', name: 'Consistent Identification' },
        { id: '3.3.3', name: 'Error Suggestion' },
        { id: '3.3.4', name: 'Error Prevention (Legal, Financial, Data)' },
        { id: '3.3.8', name: 'Accessible Authentication (Minimum)' },
      ]
    },
    robust: {
      title: '4. Robust',
      description: 'Content must be robust enough that it can be interpreted by a wide variety of user agents, including assistive technologies.',
      levelA: [
        { id: '4.1.2', name: 'Name, Role, Value' },
      ],
      levelAA: [
        { id: '4.1.3', name: 'Status Messages' },
      ]
    }
  };

  const hasStandardsContent = standardsContent.standards && Object.keys(standardsContent.standards).length > 0;

  // Filter criteria based on selected filters
  function shouldShowCriterion(sc, level) {
    // Level filter
    if (level === 'A' && !filters.levelA) return false;
    if (level === 'AA' && !filters.levelAA) return false;

    // New in 2.2 filter
    if (filters.newIn22 && !newIn22.includes(sc.id)) return false;

    return true;
  }

  return (
    <div className="slds-scope">
      <div className="slds-container_large slds-container_center slds-p-around_large">
        {/* Page Header */}
        <div className="slds-page-header slds-m-bottom_large">
          <div className="slds-page-header__row">
            <div className="slds-page-header__col-title">
              <div className="slds-media">
                <div className="slds-media__body">
                  <div className="slds-page-header__name">
                    <div className="slds-page-header__name-title">
                      <h1>
                        <span className="slds-page-header__title slds-truncate" title="Salesforce Accessibility Standards">
                          Salesforce Accessibility Standards
                        </span>
                      </h1>
                    </div>
                  </div>
                  <p className="slds-page-header__name-meta">WCAG 2.2 Level A & AA Compliance Guidelines</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overview */}
        <div className="slds-card slds-m-bottom_large">
          <div className="slds-card__body slds-card__body_inner slds-p-around_large">
            <h2 className="slds-text-heading_medium slds-m-bottom_medium">Overview</h2>
            <p className="slds-text-body_regular slds-m-bottom_medium">
              Salesforce is committed to making our products accessible to all users. We follow the Web Content Accessibility Guidelines (WCAG) 2.2 at Level A and AA conformance.
              This page provides detailed standards and implementation guidance for each success criterion.
            </p>
            <p className="slds-text-body_regular">
              The guidelines are organized according to the four principles of accessibility (POUR): Perceivable, Operable, Understandable, and Robust.
            </p>
            {hasStandardsContent && standardsContent.metadata?.lastUpdated && (
              <p className="slds-text-body_small slds-text-color_weak slds-m-top_medium">
                Last updated: {new Date(standardsContent.metadata.lastUpdated).toLocaleDateString()}
              </p>
            )}
            {!hasStandardsContent && (
              <div className="slds-box slds-box_small slds-theme_warning slds-m-top_medium">
                <p className="slds-text-body_small">
                  ⚠️ Standards content has not been fetched yet. Run <code>npm run fetch-standards</code> in the server directory to populate detailed content.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content with Sidebar */}
        <div className="slds-grid slds-gutters">
          {/* Left Sidebar - Filters */}
          <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-4 slds-large-size_1-of-5">
            <div className="slds-card">
              <div className="slds-card__header">
                <h2 className="slds-text-heading_small">Filter by</h2>
              </div>
              <div className="slds-card__body slds-card__body_inner slds-p-around_medium">
                <fieldset className="slds-form-element">
                  <legend className="slds-form-element__legend slds-form-element__label slds-assistive-text">Filter Standards</legend>
                  <div className="slds-form-element__control">
                    {/* Level A */}
                    <div className="slds-checkbox slds-m-bottom_small">
                      <input
                        type="checkbox"
                        id="filter-level-a"
                        checked={filters.levelA}
                        onChange={() => toggleFilter('levelA')}
                      />
                      <label className="slds-checkbox__label" htmlFor="filter-level-a">
                        <span className="slds-checkbox_faux"></span>
                        <span className="slds-form-element__label">Level A</span>
                      </label>
                    </div>

                    {/* Level AA */}
                    <div className="slds-checkbox slds-m-bottom_small">
                      <input
                        type="checkbox"
                        id="filter-level-aa"
                        checked={filters.levelAA}
                        onChange={() => toggleFilter('levelAA')}
                      />
                      <label className="slds-checkbox__label" htmlFor="filter-level-aa">
                        <span className="slds-checkbox_faux"></span>
                        <span className="slds-form-element__label">Level AA</span>
                      </label>
                    </div>

                    {/* New in 2.2 */}
                    <div className="slds-checkbox">
                      <input
                        type="checkbox"
                        id="filter-new-22"
                        checked={filters.newIn22}
                        onChange={() => toggleFilter('newIn22')}
                      />
                      <label className="slds-checkbox__label" htmlFor="filter-new-22">
                        <span className="slds-checkbox_faux"></span>
                        <span className="slds-form-element__label">New in 2.2</span>
                      </label>
                    </div>
                  </div>
                </fieldset>
              </div>
            </div>
          </div>

          {/* Right Content - Standards */}
          <div className="slds-col slds-size_1-of-1 slds-medium-size_3-of-4 slds-large-size_4-of-5">
            {/* WCAG Success Criteria by POUR */}
        {Object.entries(criteria).map(([key, principle]) => (
          <div key={key} className="slds-card slds-m-bottom_large">
            <div className="slds-card__header slds-grid">
              <header className="slds-media slds-media_center slds-has-flexi-truncate">
                <div className="slds-media__body">
                  <h2 className="slds-card__header-title">
                    <span className="slds-text-heading_medium">{principle.title}</span>
                  </h2>
                  <p className="slds-text-body_small slds-text-color_weak slds-m-top_xx-small">
                    {principle.description}
                  </p>
                </div>
              </header>
            </div>
            <div className="slds-card__body slds-card__body_inner">
              {/* Level A */}
              {principle.levelA.filter(sc => shouldShowCriterion(sc, 'A')).length > 0 && (
                <div className="slds-m-bottom_large">
                  <h3 className="slds-text-heading_small slds-m-bottom_small">
                    <span className="slds-badge" style={{ backgroundColor: '#04844b', color: '#ffffff', marginRight: '0.5rem' }}>Level A</span>
                  </h3>
                  <ul className="slds-list_vertical slds-has-dividers_top">
                    {principle.levelA.filter(sc => shouldShowCriterion(sc, 'A')).map(sc => (
                      <li key={sc.id} className="slds-item slds-p-vertical_small">
                        <Link
                          to={`/standards/${sc.id}`}
                          className="slds-text-link"
                          style={{
                            fontSize: '0.875rem',
                            display: 'block',
                            padding: '0.25rem 0'
                          }}
                        >
                          <strong>{sc.id}</strong> {sc.name}
                          {newIn22.includes(sc.id) && (
                            <span className="slds-badge slds-badge_lightest slds-m-left_x-small" style={{ fontSize: '0.75rem' }}>
                              New in 2.2
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Level AA */}
              {principle.levelAA.filter(sc => shouldShowCriterion(sc, 'AA')).length > 0 && (
                <div>
                  <h3 className="slds-text-heading_small slds-m-bottom_small">
                    <span className="slds-badge" style={{ backgroundColor: '#0176d3', color: '#ffffff', marginRight: '0.5rem' }}>Level AA</span>
                  </h3>
                  <ul className="slds-list_vertical slds-has-dividers_top">
                    {principle.levelAA.filter(sc => shouldShowCriterion(sc, 'AA')).map(sc => (
                      <li key={sc.id} className="slds-item slds-p-vertical_small">
                        <Link
                          to={`/standards/${sc.id}`}
                          className="slds-text-link"
                          style={{
                            fontSize: '0.875rem',
                            display: 'block',
                            padding: '0.25rem 0'
                          }}
                        >
                          <strong>{sc.id}</strong> {sc.name}
                          {newIn22.includes(sc.id) && (
                            <span className="slds-badge slds-badge_lightest slds-m-left_x-small" style={{ fontSize: '0.75rem' }}>
                              New in 2.2
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}

            {/* External Resources */}
            <div className="slds-card">
              <div className="slds-card__body slds-card__body_inner slds-p-around_large">
                <h2 className="slds-text-heading_medium slds-m-bottom_medium">External Resources</h2>
                <ul className="slds-list_dotted">
                  <li>
                    <a href="https://www.w3.org/TR/WCAG22/" target="_blank" rel="noopener noreferrer" className="slds-text-link">
                      WCAG 2.2 Specification
                    </a>
                  </li>
                  <li>
                    <a href="https://www.w3.org/WAI/WCAG22/quickref/" target="_blank" rel="noopener noreferrer" className="slds-text-link">
                      How to Meet WCAG (Quick Reference)
                    </a>
                  </li>
                  <li>
                    <a href="https://www.w3.org/WAI/WCAG22/Understanding/" target="_blank" rel="noopener noreferrer" className="slds-text-link">
                      Understanding WCAG 2.2
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
