#!/usr/bin/env node
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var Client = require('@elastic/elasticsearch').Client;
var parseDuration = require('parse-duration');
var moment = require('moment');
var client = new Client({ node: 'http://localhost:9200' });
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var version, indexPrefix, cutoffDuration, cutoff, templateName, template, now, sourceIndices, i, docsIndexed, earliest, offset, destIndex, ago, countRes, e_1, name_1, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, getVersion()];
                case 1:
                    version = _a.sent();
                    indexPrefix = "heartbeat-" + version;
                    console.log("Deleting all previous extended indices...");
                    return [4, client.indices["delete"]({ index: "extended-hb-*" })];
                case 2:
                    _a.sent();
                    cutoffDuration = process.argv[2] ? parseDuration(process.argv[2]) : parseDuration('10d');
                    cutoff = new Date().getTime() - parseDuration('10d');
                    templateName = "heartbeat-" + version + ".0.0";
                    return [4, client.indices.getTemplate({ name: templateName })];
                case 3:
                    template = (_a.sent()).body[templateName];
                    template.index_patterns = ["heartbeat-" + version + ".0.0-*", "extended-hb-*"];
                    template.settings.index.sort = {
                        field: ["monitor.id", "@timestamp"],
                        order: ["asc", "desc"]
                    };
                    return [4, client.indices.putTemplate({ name: templateName, body: template })];
                case 4:
                    _a.sent();
                    now = new Date().valueOf();
                    sourceIndices = [indexPrefix + ".*20*"];
                    i = 0;
                    docsIndexed = 0;
                    _a.label = 5;
                case 5:
                    if (!true) return [3, 15];
                    return [4, earliestTimestamp(indexPrefix)];
                case 6:
                    earliest = _a.sent();
                    if (earliest < cutoff) {
                        return [3, 15];
                    }
                    console.log("EC", earliest, cutoff);
                    offset = now - earliest;
                    destIndex = "extended-hb-" + i;
                    _a.label = 7;
                case 7:
                    _a.trys.push([7, 10, , 11]);
                    ago = moment(new Date().valueOf() - offset);
                    console.log("Cutoff", (new Date()).getTime() - offset, new Date().valueOf(), offset, cutoff);
                    console.log("Reindex " + sourceIndices + " -> " + destIndex + " (offset = " + ago.fromNow() + ")");
                    return [4, reindex(sourceIndices, destIndex, offset)];
                case 8:
                    _a.sent();
                    return [4, client.count({ index: sourceIndices })];
                case 9:
                    countRes = _a.sent();
                    console.log("Total indexed: ", countRes.body.count);
                    sourceIndices.push(destIndex);
                    return [3, 11];
                case 10:
                    e_1 = _a.sent();
                    console.error("Error reindexing", e_1);
                    process.exit(1);
                    return [3, 11];
                case 11:
                    _a.trys.push([11, 13, , 14]);
                    name_1 = indexPrefix + ".0.0-extension-" + i;
                    console.log("Alias index " + destIndex + " to " + name_1);
                    return [4, client.indices.putAlias({
                            index: destIndex,
                            name: name_1
                        })];
                case 12:
                    _a.sent();
                    return [3, 14];
                case 13:
                    e_2 = _a.sent();
                    console.error("Error aliasing", JSON.stringify(e_2));
                    process.exit(1);
                    return [3, 14];
                case 14:
                    i++;
                    return [3, 5];
                case 15: return [2];
            }
        });
    });
}
main();
function earliestTimestamp(indexPrefix) {
    return __awaiter(this, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, client.search({
                        index: indexPrefix + "*",
                        body: {
                            aggs: {
                                earliest: { min: { field: "@timestamp" } }
                            }
                        }
                    })];
                case 1:
                    res = _a.sent();
                    return [2, res.body.aggregations.earliest.value];
            }
        });
    });
}
function getVersion() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, client.info()];
                case 1: return [2, (_a.sent()).body.version.number.split(".")[0]];
            }
        });
    });
}
function reindex(sourceIndices, destIndex, offset) {
    return __awaiter(this, void 0, void 0, function () {
        var body, res, t;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    body = {
                        source: { index: sourceIndices },
                        dest: { index: destIndex },
                        script: {
                            source: "\n                        String offsetStr = Long.toString(params.offset);\n                        ctx._id = ctx._id + offsetStr;\n                        Instant origTs = Instant.parse(ctx._source[\"@timestamp\"]);\n                        ctx._source.monitor.check_group = ctx._source.monitor.check_group + \"-^-\" + offsetStr;\n                        ctx._source[\"@timestamp\"] = origTs.minus(params.offset, ChronoUnit.MILLIS);\n\n                        Instant tsStart = Instant.parse(ctx._source.monitor.timespan.gte);\n                        ctx._source.monitor.timespan.gte = tsStart.minus(params.offset, ChronoUnit.MILLIS);\n                        Instant tsEnd = Instant.parse(ctx._source.monitor.timespan.lt);\n                        ctx._source.monitor.timespan.lt = tsEnd.minus(params.offset, ChronoUnit.MILLIS);\n                    ",
                            params: { offset: offset }
                        }
                    };
                    return [4, client.reindex({
                            wait_for_completion: false,
                            refresh: true,
                            timeout: "1h",
                            max_docs: 1000000,
                            body: body
                        })];
                case 1:
                    res = _a.sent();
                    _a.label = 2;
                case 2:
                    if (!true) return [3, 5];
                    return [4, client.tasks.get({ task_id: res.body.task })];
                case 3:
                    t = _a.sent();
                    return [4, new Promise(function (r) { return setTimeout(r, 2000); })];
                case 4:
                    _a.sent();
                    console.log("Waiting for async reindex...");
                    if (t.body.completed) {
                        return [3, 5];
                    }
                    return [3, 2];
                case 5: return [2];
            }
        });
    });
}
//# sourceMappingURL=extend_history.js.map