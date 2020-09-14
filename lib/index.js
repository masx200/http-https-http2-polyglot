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
    const tlsconlisteners = server.listeners("connection");
    async function handletls(socket) {
        tlsconlisteners.forEach((callback) => {
            Promise.resolve().then(() => {
                Reflect.apply(callback, serverproxy, [socket]);
            });
        });
    }
    const httpconlisteners = serverhttp.listeners("connection");
    async function handlehttp(socket) {
        httpconlisteners.forEach((callback) => {
            Promise.resolve().then(() => {
                Reflect.apply(callback, serverproxy, [socket]);
            });
        });
    }
    server.removeAllListeners("connection");
    server.addListener("connection", connectionListener);
    async function connectionListener(socket) {
        Reflect.set(socket, "allowHalfOpen", false);
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
                    new Error("protocol error, Neither http, nor tls"),
                    socket
                );
            }
        }
    }
    const replacement = serverhttp;
    const serverproxy = new Proxy(server, {
        has(target, key) {
            return Reflect.has(target, key) || Reflect.has(replacement, key);
        },
        get(target, key) {
            return Reflect.has(target, key)
                ? Reflect.get(target, key)
                : Reflect.get(replacement, key);
        },
        set(target, key, value) {
            return Reflect.has(target, key)
                ? Reflect.set(target, key, value)
                : Reflect.set(replacement, key, value);
        },
    });
    return serverproxy;
}
