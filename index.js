const ical = require('node-ical')
const pMap = require('p-map')
const delay = require('delay')
const { google } = require('googleapis')
const { get } = require('simple-get-promise')

const now = new Date()

const importEvents = async (events) => {
  if (!events.length) {
    return
  }

  console.log(`found ${events.length} events`)
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/calendar.events']
  })

  const calendar = google.calendar({
    auth,
    version: 'v3'
  })

  const importEvent = async event => {
    const ms = Math.floor(Math.random() * 10000)
    console.log('delaying', ms)
    await delay(ms)
    console.log('importing', event.uid)
    const params = {
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      resource: {
        iCalUID: event.uid,
        start: {
          dateTime: event.start.toISOString()
        },
        end: {
          dateTime: event.end.toISOString()
        },
        summary: event.summary,
        description: event.description
      }
    }
    return calendar.events.import(params)
      .catch(err => {
        console.error(`event ${event.uid} failed`)
        console.error(err)
      })
  }

  return pMap(events, importEvent, { concurrency: 10 })
}

const getEvents = async () => {
  const params = {
    url: process.env.ICAL_URL,
    headers: {
      'User-Agent': 'ical-to-gcal'
    }
  }
  const res = await get(params)
  const eventsByUid = ical.parseICS(res.responseText)
  return Object.values(eventsByUid)
}

const maybeFilter = (events) => {
  if (!process.env.FILTER_EVENTS) {
    return events
  }
  const cutOff = new Date(now - 60 * 60000)
  return events.filter(event => event.start >= cutOff)
}

getEvents()
  .then(maybeFilter)
  .then(importEvents)
  .catch(console.error)
