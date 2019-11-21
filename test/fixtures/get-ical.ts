export default (events = []) => `
BEGIN:VCALENDAR
PRODID:-//lanyrd.com//Lanyrd//EN
X-ORIGINAL-URL:http://lanyrd.com/topics/nodejs/nodejs.ics
X-WR-CALNAME;CHARSET=utf-8:Node.js conferences
VERSION:2.0
METHOD:PUBLISH
${events.map(event => event)}
END:VCALENDAR`
