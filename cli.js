#!/usr/bin/env node

require('dotenv').config()

const icalToGcal = require('.')

icalToGcal()
  .then(console.log)
  .catch(console.error)
