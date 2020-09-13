import assert from "assert";
import http from "http";
import net from "net";
import http2 from "http2";
import tls from "tls";
import {
    RequestListener,
    requestNotFound,
    ServerOptions,
    UpgradeListener,
    upgradeNotFound,
} from "./declaration.js";
export * from "./declaration.js";
export { createServer };

function createServer(
    options: ServerOptions,
    requestListener: RequestListener = requestNotFound,
    upgradeListener: UpgradeListener = upgradeNotFound
): net.Server {
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

    const servernet = net.createServer({ allowHalfOpen: false });
    Reflect.set(servernet, "allowHalfOpen", false);
    assert(Reflect.get(servernet, "allowHalfOpen") === false);
    const serverhttp = http.createServer(options);
    Reflect.set(serverhttp, "allowHalfOpen", false);
    //@ts-ignore
    const serverhttp2 = http2.createSecureServer(options);

    Reflect.set(serverhttp2, "allowHalfOpen", false);
    serverhttp.addListener("upgrade", upgradeListener);
    serverhttp2.addListener("upgrade", upgradeListener);
    serverhttp.addListener("request", requestListener);
    serverhttp2.addListener("request", requestListener);

    servernet.addListener("error", () => {});

    serverhttp.addListener("error", () => {});

    serverhttp2.addListener("error", () => {});
    serverhttp2.prependListener("secureConnection", (socket: tls.TLSSocket) => {
        if (!socket.listeners("error").length) {
            socket.on("error", () => {});
        }
    });

    /* 修复bug
    程序没有监听套接字上的error事件,然后程序崩溃了
net.Socket
tls.TLSSocket
自动监听error事件,防止服务器意外退出
*/
    function handletls(socket: net.Socket) {
        // serverhttp2.emit("connection", socket);
        serverhttp2.listeners("connection").forEach((callback: Function) => {
            Promise.resolve().then(() => {
                Reflect.apply(callback, serverhttp2, [socket]);
            });
        });
    }
    function handlehttp(socket: net.Socket) {
        // serverhttp.emit("connection", socket);
        serverhttp.listeners("connection").forEach((callback) => {
            Promise.resolve().then(() => {
                Reflect.apply(callback, serverhttp, [socket]);
            });
        });
    }
    // serverhttp2.addListener("connection", connectionListener);
    servernet.addListener("connection", connectionListener);
    function connectionListener(socket: net.Socket) {
        Reflect.set(socket, "allowHalfOpen", false);
        assert(Reflect.get(socket, "allowHalfOpen") === false);
        /* 类型“Socket”上不存在属性“allowHalfOpen” */
        // socket.allowHalfOpen = false;
        //如果没有error监听器就添加error 监听器
        if (!socket.listeners("error").length) {
            socket.on("error", () => {});
        }
        //   let ishttp = false;
        //     let istls = false;

        const data = socket.read(1);
        /* https://github.com/httptoolkit/httpolyglot/blob/master/lib/index.js */
        if (data === null) {
            socket.once("readable", () => {
                connectionListener(socket);
            });
        } else {
            const firstByte = data[0];
            socket.unshift(data);
            if (firstByte === 22) {
                //默认已经是false了
                //// TLS sockets don't allow half open
                //    socket.allowHalfOpen = false;
                handletls(socket);
                //      istls = true;
            } else if (32 < firstByte && firstByte < 127) {
                //   ishttp = true;

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
                servernet.emit(
                    "clientError",
                    new Error("protocol error, not http or tls"),
                    socket
                );
            }
        }
        /* 测试发现不能使用on data事件,会收不到响应,多次数据会漏掉 */
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
        const originhttp2fun = Reflect.get(serverhttp2, key);
        Reflect.set(servernet, key, (event: any, listener: any) => {
            Reflect.apply(originnetfun, servernet, [event, listener]);
            Reflect.apply(originhttpfun, serverhttp, [event, listener]);
            Reflect.apply(originhttp2fun, serverhttp2, [event, listener]);
            return servernet;
        });
    });

    return servernet;
}
