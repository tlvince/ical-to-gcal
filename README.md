# ical-to-gcal

> Sync iCal to Google Calendar

## Prerequisites

### Google Calendar API

Create a Google Calendar and set up access via the API. See [Using Google Calendar API on G Suite][]. In summary:

1. Create a [Google Developers project][]
2. Create a service account, download credentials as JSON
3. Allow outsiders to [change secondary calendars][]
4. Share the calendar with the service account
5. Make a note of the calendar's ID

[Using Google Calendar API on G Suite]: https://neal.codes/blog/google-calendar-api-on-g-suite
[Google Developers project]: https://console.developers.google.com/
[change secondary calendars]: https://admin.google.com/AdminHome?fral=1#AppDetails:service=Calendar&flyout=general

### Environment

The following env vars are required:

```
GOOGLE_CALENDAR_ID
GOOGLE_APPLICATION_CREDENTIALS_BASE64
ICAL_URL
```

Set `GOOGLE_APPLICATION_CREDENTIALS_BASE64` via:

```shell
echo GOOGLE_APPLICATION_CREDENTIALS_BASE64=$(jq -c '.' /path/to/creds.json | base64) >> .env
```

## Usage

`ical-to-gcal`

## Author

© 2018-2019 Tom Vincent <git@tlvince.com> (https://tlvince.com)

## License

Released under the [MIT license](http://tlvince.mit-license.org).
