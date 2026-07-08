import { useState, useEffect } from 'react';

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1xtLZf-FycC2SmqmmJp4-FG4p_IHdBit8Ge1kiSwsqDY/export?format=csv';

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  return lines.slice(1).map(line => {
    // Simple CSV parsing (handles basic cases)
    const values = line.split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, i) => {
      row[header] = values[i] || '';
    });
    return row;
  });
}

function parseDate(dateStr) {
  // Parse "Dec 29, 2025" format
  if (!dateStr) return null;
  try {
    return new Date(dateStr);
  } catch {
    return null;
  }
}

function isCurrentWeek(startDate, endDate) {
  const now = new Date();
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end) return false;
  return now >= start && now <= end;
}

function isNextWeek(startDate, endDate) {
  const now = new Date();
  const nextWeekStart = new Date(now);
  nextWeekStart.setDate(now.getDate() + 7);

  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end) return false;

  // Check if the week includes any day in the next 7-14 days
  return start > now && start <= new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
}

export default function SupportSchedule() {
  const [currentWeek, setCurrentWeek] = useState(null);
  const [nextWeek, setNextWeek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSchedule() {
      try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) throw new Error('Failed to fetch schedule');

        const text = await response.text();
        const rows = parseCSV(text);

        // Find current and next week
        let current = null;
        let next = null;

        for (const row of rows) {
          if (isCurrentWeek(row['Start Date'], row['End Date'])) {
            current = row;
          } else if (!next && isNextWeek(row['Start Date'], row['End Date'])) {
            next = row;
          }
        }

        setCurrentWeek(current);
        setNextWeek(next);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching support schedule:', err);
        setError('Unable to load support schedule');
        setLoading(false);
      }
    }

    fetchSchedule();
  }, []);

  if (loading) {
    return (
      <div className="slds-card">
        <div className="slds-card__header slds-grid">
          <header className="slds-media slds-media_center slds-has-flexi-truncate">
            <div className="slds-media__body">
              <h2 className="slds-card__header-title">
                <span className="slds-text-heading_small">Support Schedule</span>
              </h2>
            </div>
          </header>
        </div>
        <div className="slds-card__body slds-card__body_inner slds-p-around_medium">
          <p className="slds-text-body_small slds-text-color_weak">Loading schedule...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="slds-card">
        <div className="slds-card__header slds-grid">
          <header className="slds-media slds-media_center slds-has-flexi-truncate">
            <div className="slds-media__body">
              <h2 className="slds-card__header-title">
                <span className="slds-text-heading_small">Support Schedule</span>
              </h2>
            </div>
          </header>
        </div>
        <div className="slds-card__body slds-card__body_inner slds-p-around_medium">
          <p className="slds-text-body_small slds-text-color_error">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="slds-card">
      <div className="slds-card__header slds-grid">
        <header className="slds-media slds-media_center slds-has-flexi-truncate">
          <div className="slds-media__body">
            <h2 className="slds-card__header-title">
              <span className="slds-text-heading_small">Support Schedule</span>
            </h2>
          </div>
        </header>
      </div>
      <div className="slds-card__body slds-card__body_inner">
        {/* Current Week */}
        {currentWeek && (
          <div className="slds-box slds-box_small slds-m-bottom_small" style={{ backgroundColor: '#f3f3f3' }}>
            <h3 className="slds-text-heading_small slds-m-bottom_x-small">
              This Week ({currentWeek['Start Date']} - {currentWeek['End Date']})
            </h3>
            <div className="slds-grid slds-gutters_small">
              {currentWeek['Person 1'] && (
                <div className="slds-col">
                  <span className="slds-badge slds-theme_success">{currentWeek['Person 1']}</span>
                </div>
              )}
              {currentWeek['Person 2'] && (
                <div className="slds-col">
                  <span className="slds-badge slds-theme_success">{currentWeek['Person 2']}</span>
                </div>
              )}
              {!currentWeek['Person 1'] && !currentWeek['Person 2'] && (
                <div className="slds-col">
                  <span className="slds-text-body_small slds-text-color_weak">No one assigned</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Next Week */}
        {nextWeek && (
          <div className="slds-box slds-box_small" style={{ backgroundColor: '#ffffff', border: '1px solid #dddbda' }}>
            <h3 className="slds-text-heading_small slds-m-bottom_x-small">
              Next Week ({nextWeek['Start Date']} - {nextWeek['End Date']})
            </h3>
            <div className="slds-grid slds-gutters_small">
              {nextWeek['Person 1'] && (
                <div className="slds-col">
                  <span className="slds-badge">{nextWeek['Person 1']}</span>
                </div>
              )}
              {nextWeek['Person 2'] && (
                <div className="slds-col">
                  <span className="slds-badge">{nextWeek['Person 2']}</span>
                </div>
              )}
              {!nextWeek['Person 1'] && !nextWeek['Person 2'] && (
                <div className="slds-col">
                  <span className="slds-text-body_small slds-text-color_weak">No one assigned</span>
                </div>
              )}
            </div>
          </div>
        )}

        {!currentWeek && !nextWeek && (
          <p className="slds-text-body_small slds-text-color_weak slds-p-around_small">
            No schedule information available for the current period.
          </p>
        )}
      </div>
    </div>
  );
}
