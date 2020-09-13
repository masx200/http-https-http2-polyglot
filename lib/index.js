import assert from "assert";
import http from "http";
import http2 from "http2";
import { requestNotFound, upgradeNotFound } from "./declaration.js";
export * from "./declaration.js";
export { createServer };
function createServer(
    options,
    requestListener = requestNotFound,
    upgradeListener = upgradeNotFound
) {
    if (!(options && typeof options === "object")) {
        throw new Error("options are required!");
    }
    if (!options.pfx && !(options.key && options.cert)) {
        throw new Error(
            "options.pfx or options.key and options.cert are required!"
        );
    }
    options = Object.assign({}, options);
    options.allowHalfOpen = false;
    options.allowHTTP1 = true;
    if (typeof requestListener !== "function") {
        requestListener = requestNotFound;
    }
    if (typeof upgradeListener !== "function") {
        upgradeListener = upgradeNotFound;
    }
    const serverhttp = http.createServer(options);
    const server = http2.createSecureServer(options);
    Reflect.set(server, "allowHalfOpen", false);
    server.addListener("upgrade", upgradeListener);
    server.addListener("request", requestListener);
    server.addListener("error", () => {});
    server.prependListener("secureConnection", (socket) => {
        if (!socket.listeners("error").length) {
            socket.on("error", () => {});
        }
    });
    function handletls(socket) {
        server.listeners("connection").forEach((callback) => {
            Promise.resolve().then(() => {
                Reflect.apply(callback, server, [socket]);
            });
        });
    }
    function handlehttp(socket) {
        serverhttp.listeners("connection").forEach((callback) => {
            Promise.resolve().then(() => {
                Reflect.apply(callback, serverhttp, [socket]);
            });
        });
    }
    function connectionListener(socket) {
        Reflect.set(socket, "allowHalfOpen", false);
        assert(Reflect.get(socket, "allowHalfOpen") === false);
        if (!socket.listeners("error").length) {
            socket.on("error", () => {});
        }
        const data = socket.read(1);
        if (data === null) {
            socket.once("readable", () => {
                connectionListener(socket);
            });
        } else {
            const firstByte = data[0];
            socket.unshift(data);
            if (firstByte === 22) {
                handletls(socket);
            } else if (32 < firstByte && firstByte < 127) {
                handlehttp(socket);
            } else {
                const response = [
                    `HTTP/1.1 400 Bad Request`,
                    `Content-Length: 0`,
                    "",
                    "",
                ].join("\r\n");
                socket.write(response);
                socket.end();
                socket.destroy();
                server.emit(
                    "clientError",
                    new Error("protocol error, not http or tls"),
                    socket
                );
            }
        }
    }
    return server;
}
