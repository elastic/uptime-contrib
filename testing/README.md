This directory contains sample configs useful for testing.

It also contains a dummy HTTP server useful for testing Uptime.

Some of the configs, like `geo.yml` may require you to set the `GEO_NAME` env var. To run the same heartbeat binary in a way that simulates multiple heartbeats in multiple geo locatiosn you would run the commands as illustrated below.

`env GEO_NAME="minneapolis" ./heartbeat -e -d /tmp/hb1`
`env GEO_NAME="st-paul" ./heartbeat -e -d /tmp/hb2`
