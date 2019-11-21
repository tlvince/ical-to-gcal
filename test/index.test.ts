import nock from 'nock'
import googleapis from 'googleapis'
import iCalToGCal from '../src'

import getIcal from './fixtures/get-ical'
import iCalEvent from './fixtures/ical-event'
import googleCredentials from './fixtures/google-credentials'

const originalEnv = process.env

jest.mock('googleapis', () => {
  const originalGoogleApis = jest.requireActual('googleapis')
  return {
    ...originalGoogleApis,
    google: {
      ...originalGoogleApis.google,
      calendar: jest.fn(),
    },
  }
})

const setupTest = ({ iCalEvents = [iCalEvent], gCalEvents = [] } = {}) => {
  nock.cleanAll()
  process.env = { ...originalEnv }
  console.log = jest.fn()

  const envs = {
    iCalUrl: {
      env: 'ICAL_URL',
      value: 'http://i-am.ical',
    },
    gcalID: {
      env: 'GOOGLE_CALENDAR_ID',
      value: 'gcal-123',
    },
    gcalCreds: {
      env: 'GOOGLE_APPLICATION_CREDENTIALS_BASE64',
      value: googleCredentials,
    },
    importDelay: {
      env: 'IMPORT_DELAY_MS',
      value: '0',
    },
  }

  Object.values(envs).forEach(({ env, value }) => (process.env[env] = value))

  const listeners = {
    iCalRequest: jest.fn(),
    gCalImport: jest.fn(() => Promise.resolve()),
  }

  nock(envs.iCalUrl.value)
    .get('/')
    .reply(200, function handler(uri) {
      const { body, method, headers } = this.req
      listeners.iCalRequest({
        uri,
        body,
        method,
        headers,
      })

      return getIcal(iCalEvents)
    })

  googleapis.google.calendar.mockReturnValue({
    events: {
      list: () => ({
        data: {
          items: gCalEvents,
        },
      }),
      import: listeners.gCalImport,
    },
  })

  return {
    envs,
    listeners,
    iCalEvents,
  }
}

describe('iCalToGCal', () => {
  it('should throw on missing envs', () => {
    expect(() => iCalToGCal()).toThrow('missing required env')
  })

  it('should call the iCal URL with a user agent', async () => {
    const { listeners } = setupTest()
    await iCalToGCal()
    expect(listeners.iCalRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          'user-agent': 'ical-to-gcal',
        }),
      })
    )
    expect(listeners.iCalRequest).toHaveBeenCalledTimes(1)
  })

  it('should import all iCal events', async () => {
    const { iCalEvents, listeners } = setupTest()
    await iCalToGCal()
    expect(listeners.gCalImport).toHaveBeenCalledTimes(iCalEvents.length)
  })
})
