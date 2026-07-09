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
          } else {
            currentField = null;
          }
        }
      }
    }
  }

  // Parse dates for all events
  return events.map(event => ({
    ...event,
    startDate: event.start ? parseICalDate(event.start) : null,
    endDate: event.end ? parseICalDate(event.end) : null
  }));
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

function EventCard({ title, events }) {
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
            {events.map((event, index) => (
              <li key={event.id || index} className="slds-item slds-p-vertical_small">
                <div className="slds-grid slds-wrap">
                  <div className="slds-col slds-size_1-of-1">
                    <p className="slds-text-body_regular slds-m-bottom_xx-small">
                      <strong>{event.summary}</strong>
                    </p>
                    <p className="slds-text-body_small slds-text-color_weak">
                      {formatEventDateTime(event.startDate)}
                    </p>
                    {event.description && (
                      <p className="slds-text-body_small slds-m-top_x-small">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function CalendarEvents() {
  const [calendar1Events, setCalendar1Events] = useState([]);
  const [calendar2Events, setCalendar2Events] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCalendarEvents() {
      try {
        const { start, end } = getWeekBounds();

        // Fetch iCal feeds from both calendars (no API key needed)
        const [cal1Response, cal2Response] = await Promise.all([
          fetch(ICAL_1_URL),
          fetch(ICAL_2_URL)
        ]);

        if (!cal1Response.ok || !cal2Response.ok) {
          throw new Error('Failed to fetch calendar events');
        }

        const [cal1Text, cal2Text] = await Promise.all([
          cal1Response.text(),
          cal2Response.text()
        ]);

        // Parse iCal data
        const cal1AllEvents = parseICalEvents(cal1Text);
        const cal2AllEvents = parseICalEvents(cal2Text);

        // Filter events for current week
        const cal1Events = cal1AllEvents.filter(event => {
          if (!event.startDate) return false;
          return event.startDate >= start && event.startDate < end;
        });

        const cal2EventsFiltered = cal2AllEvents.filter(event => {
          if (!event.startDate) return false;
          const summary = event.summary || '';
          const isThisWeek = event.startDate >= start && event.startDate < end;
          const isNotPlaceholder = !summary.includes('PLACEHOLDER');
          const isOfficeHours = summary.includes('Accessibility Office Hours');
          return isThisWeek && isNotPlaceholder && isOfficeHours;
        });

        // Sort by start date
        cal1Events.sort((a, b) => a.startDate - b.startDate);
        cal2EventsFiltered.sort((a, b) => a.startDate - b.startDate);

        setCalendar1Events(cal1Events);
        setCalendar2Events(cal2EventsFiltered);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching calendar events:', err);
        setError('Unable to load calendar events. Please ensure the calendars are public.');
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

  const hasEvents = calendar1Events.length > 0 || calendar2Events.length > 0;

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
            events={calendar1Events}
          />
          <EventCard
            title="Office Hours (Scheduled)"
            events={calendar2Events}
          />
        </div>
      </div>
    </div>
  );
}
