import { AxiosInstance } from "axios";
export interface IEvent {
    id?: number;
    timestamp: Date;
    duration?: number;
    data: {
        [k: string]: any;
    };
}
export interface IAppEditorEvent extends IEvent {
    data: {
        project: string;
        file: string;
        language: string;
        [k: string]: any;
    };
}
export interface IBucket {
    id: string;
    name: string;
    type: string;
    client: string;
    hostname: string;
    created: Date;
    last_update?: Date;
}
interface IInfo {
    hostname: string;
    version: string;
    testing: boolean;
}
export declare class AWClient {
    clientname: string;
    baseURL: string;
    testing: boolean;
    req: AxiosInstance;
    private heartbeatQueues;
    constructor(clientname: string, options?: {
        testing?: boolean;
        baseURL?: string;
    });
    getInfo(): Promise<IInfo>;
    ensureBucket(bucketId: string, type: string, hostname: string): Promise<{
        alreadyExist: boolean;
    }>;
    createBucket(bucketId: string, type: string, hostname: string): Promise<undefined>;
    deleteBucket(bucketId: string): Promise<undefined>;
    getBuckets(): Promise<{
        [bucketId: string]: IBucket;
    }>;
    getBucketInfo(bucketId: string): Promise<IBucket>;
    getEvents(bucketId: string, params: {
        [k: string]: any;
    }): Promise<IEvent[]>;
    countEvents(bucketId: string, startTime?: Date, endTime?: Date): Promise<import("../../../../../../../Users/shyam/Documents/activity-watch/aw-watch-web.bkup/aw-client-js/node_modules/axios").AxiosResponse<any>>;
    insertEvent(bucketId: string, event: IEvent): Promise<IEvent>;
    insertEvents(bucketId: string, events: IEvent[]): Promise<IEvent[]>;
    replaceEvent(bucketId: string, event: IEvent): Promise<IEvent>;
    deleteEvent(bucketId: string, eventId: number): Promise<undefined>;
    /**
     *
     * @param bucketId The id of the bucket to send the heartbeat to
     * @param pulsetime The maximum amount of time in seconds since the last heartbeat to be merged
     *                  with the previous heartbeat in aw-server
     * @param heartbeat The actual heartbeat event
     */
    heartbeat(bucketId: string, pulsetime: number, heartbeat: IEvent): Promise<undefined>;
    query(timeperiods: Array<string | {
        start: Date;
        end: Date;
    }>, query: string[]): Promise<any>;
    private send_heartbeat;
    private updateHeartbeatQueue;
}
export {};
