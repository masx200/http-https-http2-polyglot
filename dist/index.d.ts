/// <reference types="node" />
import http from "http";
import http2 from "http2";
import net from "net";
import tls from "tls";
import https from "https";
type ServerRequest = http.IncomingMessage & http2.Http2ServerRequest & {
    socket: Socket;
};
type ServerResponse = http.ServerResponse & http2.Http2ServerResponse & {
    socket: Socket;
};
type Socket = tls.TLSSocket & net.Socket;
type RequestListener = (req: ServerRequest, res: ServerResponse) => void;
type UpgradeListener = (req: ServerRequest, socket: Socket, head: Buffer) => void;
type ServerOptions = http2.SecureServerOptions & {
    allowHalfOpen?: boolean | undefined;
    pauseOnConnect?: boolean | undefined;
} & http.ServerOptions & tls.TlsOptions & https.ServerOptions & {
    allowHTTP1: boolean;
};
declare const requestNotFound: (req: ServerRequest, res: ServerResponse) => Promise<void>;
declare const upgradeNotFound: (req: ServerRequest, socket: Socket, head: Buffer) => Promise<void>;
declare function createServer(options: ServerOptions, requestListener?: RequestListener, upgradeListener?: UpgradeListener): http2.Http2SecureServer & http.Server;
export { ServerRequest, ServerResponse, Socket, RequestListener, UpgradeListener, ServerOptions, requestNotFound, upgradeNotFound, createServer };
