export default Buffer.from(
  JSON.stringify({
    /* eslint-disable @typescript-eslint/camelcase */
    private_key: 'foo-key',
    client_email: 'ical-to-gcal@iam.gserviceaccount.com',
    /* eslint-enable @typescript-eslint/camelcase */
  })
).toString('base64')
