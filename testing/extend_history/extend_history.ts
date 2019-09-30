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

    const cutoff: number = process.argv[2] ? parseDuration(process.argv[2]) : 10;

    const templateName = `heartbeat-${version}.0.0`;
    const template = (await client.indices.getTemplate({name: templateName})).body[templateName];
    template.index_patterns = [`heartbeat-${version}.0.0-*`, "extended-hb-*"];
    await client.indices.putTemplate({name: templateName, body: template});

    const now = new Date().valueOf();

    const sourceIndices = [`${indexPrefix}.*20*`];


    const maxBatch = 100000; // max number of docs to reindex in one go
    let totalCreated = 0;
    let i = 0;
    let indexedTo = 0;
    while (indexedTo < cutoff) {
        const earliest = await earliestTimestamp(indexPrefix);
        // We're going to double the number of entries hence
        const offset = now - earliest;

        const destIndex = `extended-hb-${i}`

        try {
            const ago = moment(new Date().valueOf() - offset);
            console.log((new Date()).getTime() - offset, new Date().valueOf(), offset, cutoff);

            console.log(`Reindex ${sourceIndices} -> ${destIndex} (offset = ${ago.fromNow()})`);
            const created = await reindex(sourceIndices, destIndex, offset)

            console.log("CR", created, maxBatch)
            if (created < maxBatch) {
                sourceIndices.push(destIndex);
            }

            totalCreated += created;
            console.log(`Created ${created} new docs`);
        } catch (e) {
            console.error("Error reindexing", JSON.stringify(e));
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

        indexedTo = offset;
        i++;
    }

    console.log(`Done created ${totalCreated} docs`)
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
        wait_for_completion: true,
        refresh: true,
        timeout: "1h",
        body
    });

    return res.body.created;
}
