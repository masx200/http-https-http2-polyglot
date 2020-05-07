import assert from "assert";
import http from "http";
import net from "net";
import spdy from "spdy";
import { requestNotFound, upgradeNotFound, } from "./declaration.js";
export * from "./declaration.js";
export { createServer };
function createServer(config, requestListener = requestNotFound, upgradeListener = upgradeNotFound) {
    if (!(config && typeof config === "object")) {
        throw new Error("options are required!");
    }
    config.allowHalfOpen = false;
    if (typeof requestListener !== "function") {
        requestListener = requestNotFound;
    }
    if (typeof upgradeListener !== "function") {
        upgradeListener = upgradeNotFound;
    }
    const servernet = net.createServer(config);
    const serverhttp = http.createServer(config);
    const serverspdy = spdy.createServer(config);
    debugger
    serverhttp.emit = new Proxy(serverhttp.emit, {
        apply(target, thisarg, argsarray) {
            const [event] = argsarray;
            Reflect.apply(target, thisarg, argsarray);
            if (event !== "connection") {
                Reflect.apply(target, servernet, argsarray);
            }
        },
    });
    serverspdy.emit = new Proxy(serverspdy.emit, {
        apply(target, thisarg, argsarray) {
            const [event] = argsarray;
            Reflect.apply(target, thisarg, argsarray);
            if (event !== "connection") {
                Reflect.apply(target, servernet, argsarray);
            }
        },
    });
    servernet.addListener("error", () => { });
    serverhttp.addListener("error", () => { });
    serverspdy.addListener("error", () => { });
    serverspdy.prependListener("secureConnection", (socket) => {
        if (!socket.listeners("error").length) {
            socket.on("error", () => { });
        }
    });
    serverhttp.addListener("upgrade", upgradeListener);
    serverspdy.addListener("upgrade", upgradeListener);
    serverhttp.addListener("request", requestListener);
    serverspdy.addListener("request", requestListener);
    function handletls(socket) {
        serverspdy.emit("connection", socket);
    }
    function handlehttp(socket) {
        serverhttp.emit("connection", socket);
    }
    servernet.addListener("connection", connectionListener);
    function connectionListener(socket) {
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
                socket.destroy();
                servernet.emit("clientError", new Error("protocol error, not http or tls"), socket);
            }
        }
    }
    return servernet;
}
