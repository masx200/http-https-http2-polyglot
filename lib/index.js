import assert from "assert";
import http from "http";
import net from "net";
import spdy from "spdy";
import { requestNotFound, upgradeNotFound, } from "./declaration.js";
export * from "./declaration.js";
export { createServer };
function createServer(options, requestListener = requestNotFound, upgradeListener = upgradeNotFound) {
    if (!(options && typeof options === "object")) {
        throw new Error("options are required!");
    }
    if (!options.pfx && !(options.key && options.cert)) {
        throw new Error("options.pfx or options.key and options.cert are required!");
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
    const servernet = net.createServer({ allowHalfOpen: false });
    Reflect.set(servernet, "allowHalfOpen", false);
    assert(Reflect.get(servernet, "allowHalfOpen") === false);
    const serverhttp = http.createServer(options);
    Reflect.set(serverhttp, "allowHalfOpen", false);
    const serverspdy = spdy.createServer(options);
    Reflect.set(serverspdy, "allowHalfOpen", false);
    serverhttp.addListener("upgrade", upgradeListener);
    serverspdy.addListener("upgrade", upgradeListener);
    serverhttp.addListener("request", requestListener);
    serverspdy.addListener("request", requestListener);
    servernet.addListener("error", () => { });
    serverhttp.addListener("error", () => { });
    serverspdy.addListener("error", () => { });
    serverspdy.prependListener("secureConnection", (socket) => {
        if (!socket.listeners("error").length) {
            socket.on("error", () => { });
        }
    });
    function handletls(socket) {
        serverspdy.listeners("connection").forEach((callback) => {
            Promise.resolve().then(() => {
                Reflect.apply(callback, serverspdy, [socket]);
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
    servernet.addListener("connection", connectionListener);
    function connectionListener(socket) {
        Reflect.set(socket, "allowHalfOpen", false);
        assert(Reflect.get(socket, "allowHalfOpen") === false);
        if (!socket.listeners("error").length) {
            socket.on("error", () => { });
        }
        const data = socket.read(1);
        if (data === null) {
            socket.once("readable", () => {
                connectionListener(socket);
            });
        }
        else {
            const firstByte = data[0];
            socket.unshift(data);
            if (firstByte === 22) {
                handletls(socket);
            }
            else if (32 < firstByte && firstByte < 127) {
                handlehttp(socket);
            }
            else {
                const response = [
                    `HTTP/1.1 400 Bad Request`,
                    `content-type: text/html`,
                    `Connection: keep-alive`,
                    `Content-Length: 0`,
                    "",
                    "",
                ].join("\r\n");
                socket.write(response);
                socket.end();
                socket.destroy();
                servernet.emit("clientError", new Error("protocol error, not http or tls"), socket);
            }
        }
    }
    const profun = [
        "on",
        "addListener",
        "once",
        "prependListener",
        "prependOnceListener",
    ];
    profun.forEach((key) => {
        const originnetfun = Reflect.get(servernet, key);
        const originhttpfun = Reflect.get(serverhttp, key);
        const originspdyfun = Reflect.get(serverspdy, key);
        Reflect.set(servernet, key, (event, listener) => {
            Reflect.apply(originnetfun, servernet, [event, listener]);
            Reflect.apply(originhttpfun, serverhttp, [event, listener]);
            Reflect.apply(originspdyfun, serverspdy, [event, listener]);
            return servernet;
        });
    });
    return servernet;
}
