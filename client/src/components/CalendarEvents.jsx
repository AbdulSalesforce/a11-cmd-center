import { useState, useEffect } from 'react';

// Server proxy endpoints for calendar data
const API_BASE = import.meta.env.VITE_API_URL || '/api';
const ICAL_1_URL = `${API_BASE}/calendar/calendar1`;
const ICAL_2_URL = `${API_BASE}/calendar/calendar2`;

function getWeekBounds() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  return {
    start: startOfWeek,
    end: endOfWeek
  };
}

function parseICalDate(dateStr) {
  // iCal format: YYYYMMDDTHHMMSSZ or YYYYMMDD
  if (!dateStr) return null;

  // Remove TZID if present
  dateStr = dateStr.split(':').pop();

  if (dateStr.length === 8) {
    // All-day event: YYYYMMDD
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return new Date(year, month - 1, day);
  } else {
    // DateTime: YYYYMMDDTHHMMSSZ
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(9, 11);
    const minute = dateStr.substring(11, 13);
    const second = dateStr.substring(13, 15);

    if (dateStr.endsWith('Z')) {
      return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    } else {
      return new Date(year, month - 1, day, hour, minute, second);
    }
  }
}

function parseICalEvents(icalText) {
  const events = [];
  const lines = icalText.split(/\r?\n/);
  let currentEvent = null;
  let currentField = null;
  let currentValue = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('BEGIN:VEVENT')) {
      currentEvent = {};
    } else if (line.startsWith('END:VEVENT')) {
      if (currentEvent) {
        events.push(currentEvent);
        currentEvent = null;
      }
    } else if (currentEvent) {
      // Handle line continuation (lines starting with space or tab)
      if (line.startsWith(' ') || line.startsWith('\t')) {
        currentValue += line.substring(1);
      } else {
        // Save previous field if exists
        if (currentField) {
          currentEvent[currentField] = currentValue;
        }

        // Parse new field
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const fieldName = line.substring(0, colonIndex);
          currentValue = line.substring(colonIndex + 1);

          // Simplify field names
          if (fieldName.startsWith('DTSTART')) {
            currentField = 'start';
          } else if (fieldName.startsWith('DTEND')) {
            currentField = 'end';
          } else if (fieldName === 'SUMMARY') {
            currentField = 'summary';
          } else if (fieldName === 'DESCRIPTION') {
            currentField = 'description';
          } else if (fieldName === 'UID') {
            currentField = 'id';
          } else if (fieldName === 'URL') {
            currentField = 'url';
          } else {
            currentField = null;
          }
        }
      }
    }
  }

  // Parse dates for all events and generate Google Calendar URLs
  const CALENDAR_ID = 'salesforce.com_9fdrqir8u6hfur6plp11vd1ask@group.calendar.google.com';

  return events.map(event => {
    // Generate Google Calendar URL - use the main calendar URL filtered by event
    // Since encoding is complex, just link to the calendar on the date of the event
    let eventUrl = null;
    if (event.startDate) {
      const dateStr = event.startDate.toISOString().split('T')[0].replace(/-/g, '');
      eventUrl = `https://calendar.google.com/calendar/u/0/r/day/${dateStr}?cid=${encodeURIComponent(CALENDAR_ID)}`;
    }

    return {
      ...event,
      startDate: event.start ? parseICalDate(event.start) : null,
      endDate: event.end ? parseICalDate(event.end) : null,
      url: eventUrl
    };
  });
}

function formatEventDateTime(date) {
  if (!date) return '';
  const options = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  return date.toLocaleString('en-US', options);
}

function formatEventDateRange(startDate, endDate) {
  if (!startDate) return '';

  // Check if it's an all-day event (no time component)
  const isAllDay = startDate.getHours() === 0 && startDate.getMinutes() === 0;

  if (!endDate || !isAllDay) {
    // Regular event with time, show start time only
    return formatEventDateTime(startDate);
  }

  // Multi-day event - show date range
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const startMonth = startDate.getMonth();
  const endMonth = endDate.getMonth();

  // Adjust end date by subtracting 1 day (iCal end dates are exclusive)
  const adjustedEndDate = new Date(endDate);
  adjustedEndDate.setDate(adjustedEndDate.getDate() - 1);

  if (startDay === adjustedEndDate.getDate() && startMonth === adjustedEndDate.getMonth()) {
    // Single day event
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return startDate.toLocaleString('en-US', options);
  }

  // Multi-day event
  const startOptions = { month: 'short', day: 'numeric' };
  const endOptions = { month: 'short', day: 'numeric' };
  return `${startDate.toLocaleDateString('en-US', startOptions)} - ${adjustedEndDate.toLocaleDateString('en-US', endOptions)}`;
}

function cleanDescription(description) {
  if (!description) return '';

  // Strip HTML tags
  let cleaned = description.replace(/<[^>]*>/g, ' ');

  // Decode HTML entities
  cleaned = cleaned.replace(/&quot;/g, '"')
                   .replace(/&amp;/g, '&')
                   .replace(/&lt;/g, '<')
                   .replace(/&gt;/g, '>')
                   .replace(/&#39;/g, "'")
                   .replace(/&nbsp;/g, ' ');

  // Split by newlines and filter
  const lines = cleaned.split(/\r?\n/).filter(line => line.trim());

  if (lines.length === 0) return '';

  // Skip lines that contain meeting details
  const meaningfulLines = lines.filter(line => {
    const lower = line.toLowerCase().trim();
    return !lower.startsWith('http') &&
           !lower.includes('meet.google.com') &&
           !lower.includes('zoom.us') &&
           !lower.startsWith('join with') &&
           !lower.startsWith('or dial') &&
           !lower.includes('meeting id') &&
           !lower.includes('passcode') &&
           !lower.includes('pin:') &&
           !lower.includes('more phone numbers') &&
           !lower.includes('more joining options') &&
           !lower.includes('learn more about meet') &&
           !lower.startsWith('-::~:~::~:~:~:~:~:~:~:~:~:~');
  });

  // Return first meaningful line, or empty if all filtered
  return (meaningfulLines[0] || '').trim();
}

function EventCard({ title, events, showLinks = true }) {
  if (!events || events.length === 0) {
    return null;
  }

  return (
    <div className="slds-col slds-size_1-of-1">
      <div className="slds-card slds-m-bottom_medium">
        <div className="slds-card__header slds-grid">
          <header className="slds-media slds-media_center slds-has-flexi-truncate">
            <div className="slds-media__body">
              <h3 className="slds-card__header-title">
                <span className="slds-text-heading_small">{title}</span>
              </h3>
            </div>
          </header>
        </div>
        <div className="slds-card__body slds-card__body_inner">
          <ul className="slds-list_vertical slds-has-dividers_top-space">
            {events.map((event, index) => {
              const cleanedDescription = cleanDescription(event.description);
              return (
                <li key={event.id || index} className="slds-item slds-p-vertical_small">
                  <div className="slds-grid slds-wrap slds-grid_vertical-align-start">
                    <div className="slds-col" style={{ flex: '1' }}>
                      <p className="slds-text-body_regular slds-m-bottom_xx-small">
                        <strong>{event.summary}</strong>
                      </p>
                      <p className="slds-text-body_small slds-text-color_weak">
                        {formatEventDateRange(event.startDate, event.endDate)}
                      </p>
                      {cleanedDescription && (
                        <p className="slds-text-body_small slds-m-top_x-small">
                          {cleanedDescription}
                        </p>
                      )}
                    </div>
                    {showLinks && event.url && (
                      <div className="slds-col slds-no-flex slds-m-left_small">
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="slds-text-link"
                          title="View in Google Calendar (opens in new window)"
                          style={{ fontSize: '1.25rem', lineHeight: '1' }}
                        >
                          📅
                          <span className="slds-assistive-text">View in Google Calendar (opens in new window)</span>
                        </a>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function CalendarEvents() {
  const [regularEvents, setRegularEvents] = useState([]);
  const [oooEvents, setOooEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCalendarEvents() {
      try {
        const { start, end } = getWeekBounds();

        // Fetch iCal feed from calendar 1 only (calendar 2 not yet public)
        const cal1Response = await fetch(ICAL_1_URL);

        if (!cal1Response.ok) {
          throw new Error(`Failed to fetch calendar events: ${cal1Response.status}`);
        }

        const cal1Text = await cal1Response.text();

        // Parse iCal data
        const cal1AllEvents = parseICalEvents(cal1Text);

        // Filter events for current week
        const cal1Events = cal1AllEvents.filter(event => {
          if (!event.startDate) return false;
          return event.startDate >= start && event.startDate < end;
        });

        // Separate OOO/PTO from regular events
        const ooo = [];
        const regular = [];

        cal1Events.forEach(event => {
          const summary = (event.summary || '').toLowerCase();

          // Check if multi-day (spans more than 1 day)
          const isMultiDay = event.endDate && event.startDate &&
                            Math.abs(event.endDate - event.startDate) > (24 * 60 * 60 * 1000);

          // Check if it's OOO/PTO/WFH
          // Look for patterns like "Name OOO", "Name - OOO", "Name PTO", etc.
          const oooPatterns = [
            /\booo\b/i,                    // "ooo" as whole word
            /\bpto\b/i,                    // "pto" as whole word
            /\bwfh\b/i,                    // "wfh" as whole word
            /out of office/i,
            /\bvacation\b/i,
            /\boff\b/i,
            /\s-\s(ooo|pto|wfh)/i          // "Name - OOO" pattern
          ];

          const hasOOOKeyword = oooPatterns.some(pattern => pattern.test(summary));

          // If it's multi-day AND has OOO keywords, it's an OOO event
          if (isMultiDay && hasOOOKeyword) {
            ooo.push(event);
          } else {
            regular.push(event);
          }
        });

        // Sort by start date
        regular.sort((a, b) => a.startDate - b.startDate);
        ooo.sort((a, b) => a.startDate - b.startDate);

        setRegularEvents(regular);
        setOooEvents(ooo);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching calendar events:', err);
        setError(`Unable to load calendar events: ${err.message}`);
        setLoading(false);
      }
    }

    fetchCalendarEvents();
  }, []);

  if (loading) {
    return (
      <div className="slds-card">
        <div className="slds-card__header slds-grid">
          <header className="slds-media slds-media_center slds-has-flexi-truncate">
            <div className="slds-media__body">
              <h2 className="slds-card__header-title">
                <span className="slds-text-heading_small">Upcoming Events</span>
              </h2>
            </div>
          </header>
        </div>
        <div className="slds-card__body slds-card__body_inner slds-p-around_medium">
          <p className="slds-text-body_small slds-text-color_weak">Loading events...</p>
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
                <span className="slds-text-heading_small">Upcoming Events</span>
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

  const hasEvents = regularEvents.length > 0 || oooEvents.length > 0;

  if (!hasEvents) {
    return (
      <div className="slds-card">
        <div className="slds-card__header slds-grid">
          <header className="slds-media slds-media_center slds-has-flexi-truncate">
            <div className="slds-media__body">
              <h2 className="slds-card__header-title">
                <span className="slds-text-heading_small">Upcoming Events</span>
              </h2>
            </div>
          </header>
        </div>
        <div className="slds-card__body slds-card__body_inner slds-p-around_medium">
          <p className="slds-text-body_small slds-text-color_weak">No events scheduled for this week.</p>
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
              <span className="slds-text-heading_small">Upcoming Events This Week</span>
            </h2>
          </div>
        </header>
      </div>
      <div className="slds-card__body slds-card__body_inner">
        <div className="slds-grid slds-wrap slds-gutters">
          <EventCard
            title="A11y Events"
            events={regularEvents}
            showLinks={true}
          />
          <EventCard
            title="Out of Office"
            events={oooEvents}
            showLinks={false}
          />
        </div>
      </div>
    </div>
  );
}
