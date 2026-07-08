import { useState, useEffect } from 'react';

const SHEET_ID = '1xtLZf-FycC2SmqmmJp4-FG4p_IHdBit8Ge1kiSwsqDY';
const IST_SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=2026-IST`;
const EST_SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=2026-EST`;

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  // Parse CSV with proper quote handling
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  // Skip header row and parse data rows
  // Columns: 0=Start Date, 1=End Date, 2=First Working Day, 3=Last Working Day, 4=Person 1, 5=Person 2
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    return {
      'Start Date': values[0] || '',
      'End Date': values[1] || '',
      'Person 1': values[4] || '',
      'Person 2': values[5] || ''
    };
  });
}

function parseDate(dateStr) {
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
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end) return false;

  const nextWeekEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  return start > now && start <= nextWeekEnd;
}

function WeekDisplay({ week, label, timezone }) {
  if (!week) return null;

  return (
    <div className="slds-box slds-box_small" style={{ backgroundColor: label === 'This Week' ? '#f3f3f3' : '#ffffff', border: '1px solid #dddbda' }}>
      <h3 className="slds-text-heading_small slds-m-bottom_x-small">
        {label} <span className="slds-badge slds-badge_lightest">{timezone}</span>
      </h3>
      <p className="slds-text-body_small slds-text-color_weak slds-m-bottom_xx-small">
        {week['Start Date']} - {week['End Date']}
      </p>
      <div className="slds-grid slds-gutters_x-small slds-m-top_x-small">
        {week['Person 1'] && (
          <div className="slds-col">
            <span className={`slds-badge ${label === 'This Week' ? 'slds-theme_success' : ''}`}>
              {week['Person 1']}
            </span>
          </div>
        )}
        {week['Person 2'] && (
          <div className="slds-col">
            <span className={`slds-badge ${label === 'This Week' ? 'slds-theme_success' : ''}`}>
              {week['Person 2']}
            </span>
          </div>
        )}
        {!week['Person 1'] && !week['Person 2'] && (
          <div className="slds-col">
            <span className="slds-text-body_small slds-text-color_weak">No one assigned</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SupportSchedule() {
  const [istSchedule, setIstSchedule] = useState({ current: null, next: null });
  const [estSchedule, setEstSchedule] = useState({ current: null, next: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSchedule() {
      try {
        const [istResponse, estResponse] = await Promise.all([
          fetch(IST_SHEET_URL),
          fetch(EST_SHEET_URL)
        ]);

        if (!istResponse.ok || !estResponse.ok) {
          throw new Error('Failed to fetch schedule');
        }

        const [istText, estText] = await Promise.all([
          istResponse.text(),
          estResponse.text()
        ]);

        const istRows = parseCSV(istText);
        const estRows = parseCSV(estText);

        console.log('IST Sample row:', istRows[0]);
        console.log('EST Sample row:', estRows[0]);

        // Find current and next week for IST
        let istCurrent = null;
        let istNext = null;
        for (const row of istRows) {
          if (isCurrentWeek(row['Start Date'], row['End Date'])) {
            console.log('Found IST current week:', row);
            istCurrent = row;
          } else if (!istNext && isNextWeek(row['Start Date'], row['End Date'])) {
            console.log('Found IST next week:', row);
            istNext = row;
          }
        }

        // Find current and next week for EST
        let estCurrent = null;
        let estNext = null;
        for (const row of estRows) {
          if (isCurrentWeek(row['Start Date'], row['End Date'])) {
            estCurrent = row;
          } else if (!estNext && isNextWeek(row['Start Date'], row['End Date'])) {
            estNext = row;
          }
        }

        setIstSchedule({ current: istCurrent, next: istNext });
        setEstSchedule({ current: estCurrent, next: estNext });
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
        <div className="slds-grid slds-wrap slds-gutters">
          {/* India (IST) Schedule */}
          <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
            <div className="slds-m-bottom_small">
              <WeekDisplay week={istSchedule.current} label="This Week" timezone="IST" />
            </div>
            <div>
              <WeekDisplay week={istSchedule.next} label="Next Week" timezone="IST" />
            </div>
          </div>

          {/* US/Canada (EST) Schedule */}
          <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
            <div className="slds-m-bottom_small">
              <WeekDisplay week={estSchedule.current} label="This Week" timezone="EST" />
            </div>
            <div>
              <WeekDisplay week={estSchedule.next} label="Next Week" timezone="EST" />
            </div>
          </div>
        </div>

        {!istSchedule.current && !istSchedule.next && !estSchedule.current && !estSchedule.next && (
          <p className="slds-text-body_small slds-text-color_weak slds-p-around_small">
            No schedule information available for the current period.
          </p>
        )}
      </div>
    </div>
  );
}
