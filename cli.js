#!/usr/bin/env node

require('dotenv').config()

const { handler } = require('.')

handler()
  .then(console.log)
  .catch(console.error)
