/// <reference types="node" />
import http from 'http';
import http2 from 'http2';
import https from 'https';
import net from 'net';
import tls from 'tls';

export declare function createServer(
    options: ServerOptions,
    requestListener?: RequestListener,
    upgradeListener?: UpgradeListener
): http2.Http2SecureServer;

export declare type RequestListener = (
    req: ServerRequest,
    res: ServerResponse
) => void;

export declare const requestNotFound: (
    req: ServerRequest,
    res: ServerResponse
) => void;

export declare type ServerOptions = http2.SecureServerOptions & {
    allowHalfOpen?: boolean | undefined;
    pauseOnConnect?: boolean | undefined;
} & http.ServerOptions &
    tls.TlsOptions &
    https.ServerOptions & {
        allowHTTP1: boolean;
    };

export declare type ServerRequest = http.IncomingMessage &
    http2.Http2ServerRequest & {
        socket: Socket;
    };

export declare type ServerResponse = http.ServerResponse &
    http2.Http2ServerResponse & {
        socket: Socket;
    };

export declare type Socket = tls.TLSSocket & net.Socket;

export declare type UpgradeListener = (
    req: ServerRequest,
    socket: Socket,
    head: Buffer
) => void;

export declare const upgradeNotFound: (
    req: ServerRequest,
    socket: Socket,
    head: Buffer
) => void;

export { }
