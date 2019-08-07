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
  
  monitors = []
  for i in range(0, count):
    monitors.append({
      "id": 'green-%04d' % i,
      "type": "http",
      "schedule": "@every 30s",
      "urls": "http://localhost:5678",
      "timeout": "1s"
    })

  y['heartbeat.monitors'] = monitors
  print yaml.dump(y)
