#!/usr/bin/env python

# Simple generator script for creating arbitrary numbers of monitors.
# If you need to modify it just copy this to a new file.
# use: ./generate.py 50
# where the first argument is the number of monitors you want to generate

import sys
import yaml

with open("./_template.yml", 'r') as stream:
  y = yaml.safe_load(stream)
  
  count = int(sys.argv[1])

  statusToPattern = {
          'up': '200x1',
          'down': '400x1',
          'intermittent': '200x5,500x1',
  }
  
  monitors = []
  for i in range(0, count):
    status = 'up'
    if i % 15 == 0:
        status = 'intermittent'
    elif i % 10 == 0:
        status = 'down'

    url = "http://localhost:5678/pattern?r=%s" % statusToPattern[status]
    monitors.append({
      "id": '%04d-%s' % (i, status),
      "name": "Test %04d - %s" % (i, status),
      "type": "http",
      "schedule": "@every 30s",
      "urls": url,
      "timeout": "1s"
    })

  y['heartbeat.monitors'] = monitors
  print yaml.dump(y)
