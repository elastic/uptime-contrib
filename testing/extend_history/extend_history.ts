#!/usr/bin/env node

const { Client } = require('@elastic/elasticsearch');
const parseDuration = require('parse-duration');
const moment = require('moment');
const client = new Client({ node: 'http://localhost:9200' });

async function main() {
    const version = await getVersion();
    const indexPrefix = `heartbeat-${version}`

    console.log("Deleting all previous extended indices...");
    await client.indices.delete({index: `extended-hb-*`});

    const cutoffDuration: number = process.argv[2] ? parseDuration(process.argv[2]) : parseDuration('10d');
    const cutoff = new Date().getTime() - parseDuration('10d');

    const templateName = `heartbeat-${version}.0.0`;
    const template = (await client.indices.getTemplate({name: templateName})).body[templateName];
    template.index_patterns = [`heartbeat-${version}.0.0-*`, "extended-hb-*"];

    template.settings.index.sort = {
	    field: ["monitor.id", "@timestamp"],
	    order: ["asc", "desc"]
    };

    await client.indices.putTemplate({name: templateName, body: template});

    const now = new Date().valueOf();

    const sourceIndices = [`${indexPrefix}.*20*`];

    let i = 0;
    let docsIndexed = 0;
    while (true) {
        const earliest = await earliestTimestamp(indexPrefix);
	if (earliest < cutoff) {
	  break;
	}
	console.log("EC", earliest, cutoff);

        // We're going to double the number of entries hence
        const offset = now - earliest;

        const destIndex = `extended-hb-${i}`

        try {
            const ago = moment(new Date().valueOf() - offset);
            console.log("Cutoff", (new Date()).getTime() - offset, new Date().valueOf(), offset, cutoff);
            console.log(`Reindex ${sourceIndices} -> ${destIndex} (offset = ${ago.fromNow()})`);
            await reindex(sourceIndices, destIndex, offset)

	    const countRes = await client.count({index: sourceIndices});
	    console.log("Total indexed: ", countRes.body.count);


            sourceIndices.push(destIndex);
        } catch (e) {
            console.error("Error reindexing", e);
            process.exit(1);
        }

        try {
            const name = `${indexPrefix}.0.0-extension-${i}`;
            console.log(`Alias index ${destIndex} to ${name}`);
            await client.indices.putAlias({
                index: destIndex,
                name: name
            });
        } catch (e) {
            console.error("Error aliasing", JSON.stringify(e));
            process.exit(1);
        }

        i++;
    }
}

main()

async function earliestTimestamp(indexPrefix: string) {
    const res = await client.search({
        index: `${indexPrefix}*`,
        body: {
            aggs: {
                earliest: {min: {field: "@timestamp"}}
            }
        }
    })

    return res.body.aggregations.earliest.value;
}

async function getVersion() {
    return (await client.info()).body.version.number.split(".")[0];
}

async function reindex(sourceIndices: string | string[], destIndex: string, offset: number) {
    const body = {
        source: {index: sourceIndices},
        dest: {index: destIndex},
        script: {
            source: `
                        String offsetStr = Long.toString(params.offset);
                        ctx._id = ctx._id + offsetStr;
                        Instant orig = Instant.parse(ctx._source["@timestamp"]);
                        ctx._source.monitor.check_group = ctx._source.monitor.check_group + "-^-" + offsetStr;
                        ctx._source["@timestamp"] = orig.minus(params.offset, ChronoUnit.MILLIS);
                    `,
            params: { offset }
        }
    };

    const res = await client.reindex({
        wait_for_completion: false,
        refresh: true,
        timeout: "1h",
	max_docs: 1000000,
        body
    });
    while (true) {
      const t = await client.tasks.get({task_id: res.body.task});
      //console.log("Task status", t);
      await new Promise(r => setTimeout(r, 2000))
      console.log("Waiting for async reindex...");
      if (t.body.completed) {
        break;
      }
    }
}
