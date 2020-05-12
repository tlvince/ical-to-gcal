import ical from 'node-ical'
import pMap from 'p-map' // eslint-disable-line import/default
import delay from 'delay' // eslint-disable-line import/default
import { google } from 'googleapis'
import { get } from 'simple-get-promise' // eslint-disable-line import/no-unresolved

const now = Date.now()

const authGcal = () => {
  const jsonStr = Buffer.from(
    process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64,
    'base64'
  ).toString()
  const authKeys = JSON.parse(jsonStr)
  const auth = google.auth.fromJSON(authKeys)
  /* eslint-disable @typescript-eslint/ban-ts-ignore */
  // @ts-ignore
  auth.scopes = ['https://www.googleapis.com/auth/calendar.events']
  /* eslint-enable @typescript-eslint/ban-ts-ignore */
  return google.calendar({
    auth,
    version: 'v3',
  })
}

const getGcalEvents = async (api, cutOff) => {
  const params = {
    timeMin: cutOff.toISOString(),
    maxResults: 2500,
    calendarId: process.env.GOOGLE_CALENDAR_ID,
  }
  const events = await api.events.list(params)
  return events.data.items
}

const randomDelay = () => {
  const ms = process.env.IMPORT_DELAY_MS
    ? parseInt(process.env.IMPORT_DELAY_MS, 10)
    : Math.floor(Math.random() * 10000)
  console.log('delaying', ms)
  return delay(ms)
}

const importEvents = async (api, events) => {
  if (!events.length) {
    return
  }

  console.log(`found ${events.length} events`)

  const importEvent = async (event) => {
    await randomDelay()
    console.log('importing', event.uid)
    const params = {
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      resource: {
        iCalUID: event.uid,
        start: {
          dateTime: event.start.toISOString(),
        },
        end: {
          dateTime: event.end.toISOString(),
        },
        summary: event.summary,
        description: event.description,
      },
    }
    return api.events.import(params).catch((err) => {
      console.error(`event ${event.uid} failed`)
      console.error(err)
    })
  }

  return pMap(events, importEvent, { concurrency: 10 }).then(() =>
    events.map((event) => event.uid)
  )
}

const getEvents = async () => {
  const params = {
    url: process.env.ICAL_URL,
    headers: {
      'User-Agent': 'ical-to-gcal',
    },
  }
  const res = await get(params)
  const eventsByUid = ical.parseICS(res.responseText)
  return Object.values(eventsByUid)
}

const maybeFilter = (events, cutOff) => {
  if (!process.env.FILTER_EVENTS) {
    return events
  }
  return events.filter((event) => event.start >= cutOff)
}

const maybeDelete = async (api, iCalEvents, gCalEvents) => {
  const deletedEvents = gCalEvents.filter(
    (gCalEvent) =>
      !iCalEvents.find((iCalEvent) => gCalEvent.iCalUID === iCalEvent.uid)
  )
  if (!deletedEvents.length) {
    return
  }
  console.log('deleting %s events', deletedEvents.length)
  const deleteEvent = async (event) => {
    await randomDelay()
    console.log('deleting', event.id)
    const params = {
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      eventId: event.id,
    }
    return api.events.delete(params)
  }
  return pMap(deletedEvents, deleteEvent, { concurrency: 10 })
}

const syncGcal = async (rawEvents) => {
  const api = authGcal()

  const hour = 60 * 60000
  const startTime = process.env.START_TIME_HOURS
    ? hour * parseInt(process.env.START_TIME_HOURS, 10)
    : hour
  const cutOff = new Date(now - startTime)

  const iCalEvents = maybeFilter(rawEvents, cutOff)
  const gCalEvents = await getGcalEvents(api, cutOff)

  await maybeDelete(api, rawEvents, gCalEvents)
  return importEvents(api, iCalEvents)
}

export default () => {
  const requireds = [
    'ICAL_URL',
    'GOOGLE_CALENDAR_ID',
    'GOOGLE_APPLICATION_CREDENTIALS_BASE64',
  ]

  const hasEnv = requireds.every((env) => env in process.env)
  if (!hasEnv) {
    throw new Error(`missing required env vars: ${requireds}`)
  }

  return getEvents().then(syncGcal)
}
