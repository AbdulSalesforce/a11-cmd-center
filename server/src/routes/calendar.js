const express = require('express');
const router = express.Router();

const CALENDAR_1_ID = 'salesforce.com_9fdrqir8u6hfur6plp11vd1ask@group.calendar.google.com';
const CALENDAR_2_ID = 'salesforce.com_3bpvi4o060oqliqlp97sdvg16k@group.calendar.google.com';
const ICAL_1_URL = `https://calendar.google.com/calendar/ical/${CALENDAR_1_ID}/public/basic.ics`;
const ICAL_2_URL = `https://calendar.google.com/calendar/ical/${CALENDAR_2_ID}/public/basic.ics`;

// Proxy endpoint for calendar 1
router.get('/calendar1', async (req, res) => {
  try {
    const response = await fetch(ICAL_1_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch calendar 1');
    }
    const icalData = await response.text();
    res.type('text/calendar').send(icalData);
  } catch (error) {
    console.error('Error fetching calendar 1:', error);
    res.status(500).json({ error: 'Failed to fetch calendar data' });
  }
});

// Proxy endpoint for calendar 2
router.get('/calendar2', async (req, res) => {
  try {
    const response = await fetch(ICAL_2_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch calendar 2');
    }
    const icalData = await response.text();
    res.type('text/calendar').send(icalData);
  } catch (error) {
    console.error('Error fetching calendar 2:', error);
    res.status(500).json({ error: 'Failed to fetch calendar data' });
  }
});

module.exports = router;
