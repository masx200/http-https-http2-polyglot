import http from "http";
import net from "net";
import spdy from "spdy";
import tls from "tls";
import stream from "stream";
import https from "https";
export interface ServerRequest extends http.IncomingMessage {
    socket: Socket;
}
export interface PushOptions {
    status?: number;
    method?: string;
    request?: http.OutgoingHttpHeaders;
    response?: http.OutgoingHttpHeaders;
}
export interface ServerResponse extends http.ServerResponse {
    socket: Socket;
    push?: (pathname: string, options?: PushOptions) => stream.Writable;
}
export type Socket = tls.TLSSocket & net.Socket;
export type RequestListener = (req: ServerRequest, res: ServerResponse) => void;
export type UpgradeListener = (
    req: ServerRequest,
    socket: Socket,
    head: Buffer
) => void;
export type ServerOptions = spdy.ServerOptions & {
    allowHalfOpen?: boolean | undefined;
    pauseOnConnect?: boolean | undefined;
} & http.ServerOptions &
    tls.TlsOptions &
    https.ServerOptions;
export const requestNotFound = function (
    req: ServerRequest,
    res: ServerResponse
) {
    res.statusCode = 404;
    res.setHeader("content-type", "text/html");

    res.end("404 Not Found");
    // res.destroy();
};
export const upgradeNotFound = function (
    req: ServerRequest,
    socket: Socket,
    head: Buffer
) {
    // const res = new http.ServerResponse(req);
    // //@ts-ignore
    // requestNotFound(req, res);
    const response = [
        `HTTP/1.1 404 Not Found`,
        `content-type: text/html`,
      //  `Date: Fri, 08 May 2020 16:20:58 GMT`,
        `Connection: keep-alive`,
        `Content-Length: 0`,
        "",
        "",
    ].join("\r\n");
    socket.write(response);
    socket.end();
    socket.destroy();
};
