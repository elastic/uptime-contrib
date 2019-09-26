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
var client = new Client({ node: 'http://localhost:9200' });
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var version, indexPrefix, doublings, templateName, template, now, sourceIndices, earliest, offset, totalCreated, i, destIndex, created, e_1, name_1, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, getVersion()];
                case 1:
                    version = _a.sent();
                    indexPrefix = "heartbeat-" + version;
                    doublings = process.argv[2] ? parseInt(process.argv[2]) : 10;
                    console.log("Will double contents " + doublings + " times in " + indexPrefix);
                    templateName = "heartbeat-" + version + ".0.0";
                    return [4, client.indices.getTemplate({ name: templateName })];
                case 2:
                    template = (_a.sent()).body[templateName];
                    template.index_patterns = ["heartbeat-" + version + ".0.0-*", "extended-hb-*"];
                    return [4, client.indices.putTemplate({ name: templateName, body: template })];
                case 3:
                    _a.sent();
                    console.log("Deleting all previous doubled indices...");
                    return [4, client.indices["delete"]({ index: "extended-hb-*" })];
                case 4:
                    _a.sent();
                    now = new Date().valueOf();
                    sourceIndices = [indexPrefix + ".*"];
                    return [4, earliestTimestamp(indexPrefix)];
                case 5:
                    earliest = _a.sent();
                    offset = now - earliest;
                    totalCreated = 0;
                    i = 0;
                    _a.label = 6;
                case 6:
                    if (!(i < doublings)) return [3, 15];
                    destIndex = "extended-hb-" + i;
                    _a.label = 7;
                case 7:
                    _a.trys.push([7, 9, , 10]);
                    console.log("Reindex " + sourceIndices + " -> " + destIndex + " (offset = " + offset / 1000 / 60 + " minutes)");
                    return [4, reindex(sourceIndices, destIndex, offset)];
                case 8:
                    created = _a.sent();
                    totalCreated += created;
                    console.log("Created " + created + " new docs");
                    return [3, 10];
                case 9:
                    e_1 = _a.sent();
                    console.error("Error reindexing", JSON.stringify(e_1));
                    process.exit(1);
                    return [3, 10];
                case 10:
                    _a.trys.push([10, 12, , 13]);
                    name_1 = indexPrefix + ".0.0-extension-" + i;
                    console.log("Alias index " + destIndex + " to " + name_1);
                    return [4, client.indices.putAlias({
                            index: destIndex,
                            name: name_1
                        })];
                case 11:
                    _a.sent();
                    return [3, 13];
                case 12:
                    e_2 = _a.sent();
                    console.error("Error aliasing", JSON.stringify(e_2));
                    process.exit(1);
                    return [3, 13];
                case 13:
                    sourceIndices.push(destIndex);
                    offset = offset * 2;
                    _a.label = 14;
                case 14:
                    i++;
                    return [3, 6];
                case 15:
                    console.log("Done created " + totalCreated + " docs");
                    return [2];
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
        var body, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    body = {
                        source: { index: sourceIndices },
                        dest: { index: destIndex },
                        script: {
                            source: "\n                        String offsetStr = Long.toString(params.offset);\n                        ctx._id = ctx._id + offsetStr;\n                        Instant orig = Instant.parse(ctx._source[\"@timestamp\"]);\n                        ctx._source.monitor.check_group = ctx._source.monitor.check_group + \"-^-\" + offsetStr;\n                        ZonedDateTime zdt = ZonedDateTime.ofInstant(orig.minus(params.offset, ChronoUnit.MILLIS), ZoneId.of('Z'));\n                        ctx._source[\"@timestamp\"] = zdt.toString();\n                    ",
                            params: { offset: offset }
                        }
                    };
                    return [4, client.reindex({
                            wait_for_completion: true,
                            refresh: true,
                            body: body
                        })];
                case 1:
                    res = _a.sent();
                    return [2, res.body.created];
            }
        });
    });
}
//# sourceMappingURL=extend_history.js.map