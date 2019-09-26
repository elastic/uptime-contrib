# Extend History

Extends the history of existing heartbeat data. Useful for testing. One would typically create a small sample of data, perhaps a minute's worth, then run `node extend_history.js 7d` to multiply the amount of data until there is at least 7 days worth of data. The program takes a single argument specifying how far back the data should extend at a minimum. Since it adds data by doubling it this may create a good bit more than the target amount of data.

## Development

Run `./watch-tsc` in a console to continually recompile typescript.