"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
class AWClient {
    constructor(clientname, options = {}) {
        this.heartbeatQueues = {};
        this.clientname = clientname;
        this.testing = options.testing || false;
        if (typeof options.baseURL === "undefined") {
            //const port = !options.testing ? 5600 : 5666;
            this.baseURL = `http://157.245.110.199`;
        }
        else {
            this.baseURL = options.baseURL;
        }
        this.req = axios_1.default.create({
            baseURL: this.baseURL + "/api",
            timeout: 30000,
        });
    }
    getInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.req.get("/0/info").then(res => res.data);
        });
    }
    ensureBucket(bucketId, type, hostname) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.req.post(`/0/buckets/${bucketId}`, {
                    client: this.clientname,
                    type,
                    hostname,
                });
            }
            catch (err) {
                // Will return 304 if bucket already exists
                if (err && err.response && err.response.status === 304) {
                    return { alreadyExist: true };
                }
                throw err;
            }
            return { alreadyExist: false };
        });
    }
    createBucket(bucketId, type, hostname) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.req.post(`/0/buckets/${bucketId}`, {
                client: this.clientname,
                type,
                hostname,
            });
            return undefined;
        });
    }
    deleteBucket(bucketId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.req.delete(`/0/buckets/${bucketId}?force=1`);
            return undefined;
        });
    }
    getBuckets() {
        return __awaiter(this, void 0, void 0, function* () {
            let buckets = (yield this.req.get("/0/buckets/")).data;
            Object.keys(buckets).forEach(bucket => {
                buckets[bucket].created = new Date(buckets[bucket].created);
                if (buckets[bucket].last_updated) {
                    buckets[bucket].last_updated = new Date(buckets[bucket].last_updated);
                }
            });
            return buckets;
        });
    }
    getBucketInfo(bucketId) {
        return __awaiter(this, void 0, void 0, function* () {
            let bucket = (yield this.req.get(`/0/buckets/${bucketId}`)).data;
            bucket.created = new Date(bucket.created);
            return bucket;
        });
    }
    getEvents(bucketId, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let events = (yield this.req.get("/0/buckets/" + bucketId + "/events", { params })).data;
            events.forEach((event) => {
                event.timestamp = new Date(event.timestamp);
            });
            return events;
        });
    }
    countEvents(bucketId, startTime, endTime) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {
                starttime: startTime ? startTime.toISOString() : null,
                endtime: endTime ? endTime.toISOString() : null,
            };
            return this.req.get("/0/buckets/" + bucketId + "/events/count", { params });
        });
    }
    insertEvent(bucketId, event) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.insertEvents(bucketId, [event]).then(events => events[0]);
        });
    }
    insertEvents(bucketId, events) {
        return __awaiter(this, void 0, void 0, function* () {
            let insertedEvents = (yield this.req.post("/0/buckets/" + bucketId + "/events", events)).data;
            if (!Array.isArray(insertedEvents)) {
                insertedEvents = [insertedEvents];
            }
            insertedEvents.forEach((event) => {
                event.timestamp = new Date(event.timestamp);
            });
            return insertedEvents;
        });
    }
    // Just an alias for insertEvent requiring the event to have an ID assigned
    replaceEvent(bucketId, event) {
        return __awaiter(this, void 0, void 0, function* () {
            if (event.id === undefined) {
                throw ("Can't replace event without ID assigned");
            }
            return this.insertEvent(bucketId, event);
        });
    }
    deleteEvent(bucketId, eventId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.req.delete('/0/buckets/' + bucketId + '/events/' + eventId);
            return undefined;
        });
    }
    /**
     *
     * @param bucketId The id of the bucket to send the heartbeat to
     * @param pulsetime The maximum amount of time in seconds since the last heartbeat to be merged
     *                  with the previous heartbeat in aw-server
     * @param heartbeat The actual heartbeat event
     */
    heartbeat(bucketId, pulsetime, heartbeat) {
        // Create heartbeat queue for bucket if not already existing
        if (!this.heartbeatQueues.hasOwnProperty(bucketId)) {
            this.heartbeatQueues[bucketId] = {
                isProcessing: false,
                data: [],
            };
        }
        return new Promise((resolve, reject) => {
            // Add heartbeat request to queue
            this.heartbeatQueues[bucketId].data.push({
                onSuccess: resolve,
                onError: reject,
                pulsetime,
                heartbeat,
            });
            this.updateHeartbeatQueue(bucketId);
        });
    }
    query(timeperiods, query) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = {
                query,
                timeperiods: timeperiods.map(tp => {
                    return typeof tp !== "string" ? `${tp.start.toISOString()}/${tp.end.toISOString()}` : tp;
                }),
            };
            return (yield this.req.post("/0/query/", data)).data;
        });
    }
    send_heartbeat(bucketId, pulsetime, data) {
        return __awaiter(this, void 0, void 0, function* () {
            let heartbeat = (yield this.req.post("/0/buckets/" + bucketId + "/heartbeat?pulsetime=" + pulsetime, data)).data;
            heartbeat.timestamp = new Date(heartbeat.timestamp);
            return heartbeat;
        });
    }
    // Start heartbeat queue processing if not currently processing
    updateHeartbeatQueue(bucketId) {
        const queue = this.heartbeatQueues[bucketId];
        if (!queue.isProcessing && queue.data.length) {
            const { pulsetime, heartbeat, onSuccess, onError } = queue.data.shift();
            queue.isProcessing = true;
            this.send_heartbeat(bucketId, pulsetime, heartbeat)
                .then((response) => {
                onSuccess();
                queue.isProcessing = false;
                this.updateHeartbeatQueue(bucketId);
            })
                .catch((response) => {
                onError(response);
                queue.isProcessing = false;
                this.updateHeartbeatQueue(bucketId);
            });
        }
    }
}
exports.AWClient = AWClient;
//# sourceMappingURL=aw-client.js.map