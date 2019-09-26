#!/usr/bin/env node

const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://localhost:9200' })

async function main() {
    const version = await getVersion();
    const indexPrefix = `heartbeat-${version}`

    const doublings: number = process.argv[2] ? parseInt(process.argv[2]) : 10;
    console.log(`Will double contents ${doublings} times in ${indexPrefix}`);

    const templateName = `heartbeat-${version}.0.0`;
    const template = (await client.indices.getTemplate({name: templateName})).body[templateName];
    template.index_patterns = [`heartbeat-${version}.0.0-*`, "extended-hb-*"];
    await client.indices.putTemplate({name: templateName, body: template});

    console.log("Deleting all previous doubled indices...");
    await client.indices.delete({index: `extended-hb-*`});

    const now = new Date().valueOf();

    const sourceIndices = [`${indexPrefix}.*`];

    const earliest = await earliestTimestamp(indexPrefix);
    // We're going to double the number of entries hence
    let offset = now - earliest;

    let totalCreated = 0;
    for (let i = 0; i < doublings; i++) {
        const destIndex = `extended-hb-${i}`

        try {
            console.log(`Reindex ${sourceIndices} -> ${destIndex} (offset = ${offset/1000/60} minutes)`);
            const created = await reindex(sourceIndices, destIndex, offset)
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

        sourceIndices.push(destIndex)
        offset = offset*2;
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
                        ZonedDateTime zdt = ZonedDateTime.ofInstant(orig.minus(params.offset, ChronoUnit.MILLIS), ZoneId.of('Z'));
                        ctx._source["@timestamp"] = zdt.toString();
                    `,
            params: { offset }
        }
    };

    const res = await client.reindex({
        wait_for_completion: true,
        refresh: true,
        body
    });

    return res.body.created;
}
