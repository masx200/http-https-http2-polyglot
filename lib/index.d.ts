/// <reference types="node" />
import http from "http";
import http2 from "http2";
import {
    RequestListener,
    ServerOptions,
    UpgradeListener,
} from "./declaration.js";
export * from "./declaration.js";
export { createServer };
declare function createServer(
    options: ServerOptions,
    requestListener?: RequestListener,
    upgradeListener?: UpgradeListener
): http2.Http2SecureServer & http.Server;
