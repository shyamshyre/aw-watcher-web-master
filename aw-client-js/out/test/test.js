"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const aw_client_1 = require("../aw-client");
// Bucket info
const bucketId = "aw-client-js-test";
const eventType = "test";
const hostname = "http://imonitor.iconma.in/";
// Create client
const clientName = "aw-client-js-unittest";
const awc = new aw_client_1.AWClient(clientName, {
    testing: false,
});
const testevent = {
    timestamp: new Date(),
    duration: 0,
    data: {
        label: "this is a test label",
    },
};
describe("All", () => {
    before("Delete test bucket", () => {
        // Delete bucket if it exists
        return awc.deleteBucket(bucketId)
            .catch((err) => {
            if (err && err.response.status === 404) {
                return "ok";
            }
            throw err;
        });
    });
    // Make sure the test bucket exists before each test case
    beforeEach("Create test bucket", () => {
        return awc.ensureBucket(bucketId, eventType, hostname);
    });
    it("info", () => {
        return awc.getInfo().then((resp) => {
            console.log("info", resp);
            assert.equal(resp.testing, true);
        });
    });
    it("Post event, get event and assert", () => {
        return awc.insertEvent(bucketId, testevent).then((resp) => {
            console.log("insertEvent", resp);
            return awc.getEvents(bucketId, { limit: 1 });
        })
            .then((resp) => {
            console.log("getEvents", resp);
            assert.equal(testevent.timestamp.toISOString(), resp[0].timestamp.toISOString());
            assert.equal(testevent.data.label, resp[0].data.label);
        });
    });
    it("Create, delete and get buckets", () => {
        /* Create -> getBucketInfo and verify -> delete -> getBuckets and verify */
        return awc.ensureBucket(bucketId, eventType, hostname)
            .then(() => awc.getBuckets())
            .then((resp) => {
            console.log("getBuckets", resp);
            assert.equal(true, bucketId in resp);
        })
            .then(() => {
            return awc.getBucketInfo(bucketId);
        })
            .then((resp) => {
            console.log("getBucketInfo", resp);
            assert.equal(resp.created instanceof Date, true);
            assert.equal(clientName, resp.client);
            return awc.deleteBucket(bucketId);
        })
            .then(() => {
            return awc.getBuckets();
        })
            .then((resp) => {
            console.log("getBuckets", resp);
            assert.equal(false, bucketId in resp);
        });
    });
    it("Heartbeat", () => {
        // Send 10 heartbeat events with little time difference one after another (for testing the queue)
        return Promise.all(Array.from({ length: 10 }, (v, index) => {
            const { timestamp } = testevent, event = __rest(testevent, ["timestamp"]);
            const curTimestamp = new Date();
            const newEvent = Object.assign({ timestamp: curTimestamp }, event);
            return awc.heartbeat(bucketId, 5, newEvent);
        }))
            .then(([firstResponse]) => {
            console.log("heartbeat", firstResponse);
        });
    });
    it("Query", () => __awaiter(this, void 0, void 0, function* () {
        yield awc.heartbeat(bucketId, 5, testevent);
        // Both these are valid timeperiod specs
        const timeperiods = [
            { start: testevent.timestamp, end: testevent.timestamp },
            `${testevent.timestamp.toISOString()}/${testevent.timestamp.toISOString()}`,
        ];
        const query = [
            `bucket="${bucketId}";`,
            "RETURN=query_bucket(bucket);",
        ];
        const resp = yield awc.query(timeperiods, query);
        console.log("query", resp);
        assert.equal(testevent.timestamp.toISOString(), new Date(resp[0][0].timestamp).toISOString());
        assert.equal(testevent.data.label, resp[0][0].data.label);
    }));
});
//# sourceMappingURL=test.js.map