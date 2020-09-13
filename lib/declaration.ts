import http from "http";
import net from "net";
import http2 from "http2";

import tls from "tls";
import stream from "stream";
import https from "https";
export interface ServerRequest
    extends http.IncomingMessage,
        http2.Http2ServerRequest {
    socket: Socket;
}

export interface ServerResponse
    extends http.ServerResponse,
        http2.Http2ServerResponse {
    socket: Socket;
}
export type Socket = tls.TLSSocket & net.Socket;
export type RequestListener = (req: ServerRequest, res: ServerResponse) => void;
export type UpgradeListener = (
    req: ServerRequest,
    socket: Socket,
    head: Buffer
) => void;
export type ServerOptions = http2.SecureServerOptions & {
    allowHalfOpen?: boolean | undefined;
    pauseOnConnect?: boolean | undefined;
} & http.ServerOptions &
    tls.TlsOptions &
    https.ServerOptions & { allowHTTP1: boolean };
export const requestNotFound = function (
    req: ServerRequest,
    res: ServerResponse
) {
    res.statusCode = 404;

    res.end("404 Not Found");
};
export const upgradeNotFound = function (
    req: ServerRequest,
    socket: Socket,
    head: Buffer
) {
    const response = [
        `HTTP/1.1 404 Not Found`,

        `Content-Length: 0`,
        "",
        "",
    ].join("\r\n");
    socket.write(response);
    socket.end();
    socket.destroy();
};
