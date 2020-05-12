#!/usr/bin/env node

require('dotenv').config()

import icalToGcal from '.'

icalToGcal().then(console.log).catch(console.error)
