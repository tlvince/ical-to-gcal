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

  const jsonStr = new Buffer(process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64, 'base64').toString()
  const authKeys = JSON.parse(jsonStr)
  const auth = google.auth.fromJSON(authKeys)
  auth.scopes = ['https://www.googleapis.com/auth/calendar.events']

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
    .then(() => events.map(event => event.uid))
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

exports.handler = () => {
  const requireds = [
    'ICAL_URL',
    'GOOGLE_CALENDAR_ID',
    'GOOGLE_APPLICATION_CREDENTIALS_BASE64',
  ]

  const hasEnv = requireds.every(env => env in process.env)
  if (!hasEnv) {
    throw new Error(`missing required env vars: ${requireds}`)
  }

  return getEvents()
    .then(maybeFilter)
    .then(importEvents)
    .catch(console.error)
}
