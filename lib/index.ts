import assert from "assert";
import http from "http";
import net from "net";
import spdy from "spdy";
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
    config: ServerOptions,
    requestListener: RequestListener = requestNotFound,
    upgradeListener: UpgradeListener = upgradeNotFound
): net.Server {
    if (!(config && typeof config === "object")) {
        throw new Error("options are required!");
    }
        
    if (!options.pfx && !(options.key && options.cert)) {
		throw new Error('options.pfx or options.key and options.cert are required!');
	}    
	    
	    config=Object.assign({},config)
    config.allowHalfOpen = false;
	    config.allowHTTP1= true
    if (typeof requestListener !== "function") {
        requestListener = requestNotFound;
    }
    if (typeof upgradeListener !== "function") {
        upgradeListener = upgradeNotFound;
    }

    const servernet = net.createServer({ allowHalfOpen: false });
    Reflect.set(servernet, "allowHalfOpen", false);
    assert(Reflect.get(servernet, "allowHalfOpen") === false);
    const serverhttp = http.createServer(config);
	    Reflect.set(serverhttp, "allowHalfOpen", false);
    //@ts-ignore
    const serverspdy = spdy.createServer(config);
	    
	    Reflect.set(serverspdy, "allowHalfOpen", false);
    serverhttp.addListener("upgrade", upgradeListener);
    serverspdy.addListener("upgrade", upgradeListener);
    serverhttp.addListener("request", requestListener);
    serverspdy.addListener("request", requestListener);
    // serverhttp.emit = new Proxy(serverhttp.emit, {
    //     apply(target, thisarg, argsarray) {
    //         const [event] = argsarray;

    //         Reflect.apply(target, thisarg, argsarray);
    //         if (event !== "connection") {
    //             Reflect.apply(target, servernet, argsarray);
    //         }
    //     },
    // });
    /* 代理emit函数出现未知bug */
    // serverspdy.emit = new Proxy(serverspdy.emit, {
    //     apply(target, thisarg, argsarray) {
    //         const [event] = argsarray;

    //         Reflect.apply(target, thisarg, argsarray);
    //         if (event !== "connection") {
    //             Reflect.apply(target, servernet, argsarray);
    //         }
    //     },
    // });
    // servernet.emit = new Proxy(servernet.emit, {
    //     apply(target, thisarg, argsarray) {
    //         const [event, ...args] = argsarray;
    //         if (event === "request" && thisarg.listenerCount(event) === 0) {
    //             Reflect.apply(requestNotFound, undefined, args);
    //             return;
    //         }
    //         if (event === "upgrade" && thisarg.listenerCount(event) === 0) {
    //             Reflect.apply(upgradeNotFound, undefined, args);
    //             return;
    //         }
    //         return Reflect.apply(target, thisarg, argsarray);
    //     },
    // });
    // if (typeof requestListener === "function") {
    //     servernet.addListener("request", requestListener);
    // }
    // if (typeof upgradeListener === "function") {
    //     servernet.addListener("upgrade", upgradeListener);
    // }
    servernet.addListener("error", () => {});
    // serverhttp.addListener("clientError", (err: Error, socket: net.Socket) => {
    //     socket.destroy();
    //     servernet.emit("clientError", err, socket);
    // });
    serverhttp.addListener("error", () => {});
    // serverspdy.addListener("clientError", (err: Error, socket: net.Socket) => {
    //     socket.destroy();
    //     servernet.emit("clientError", err, socket);
    // });
    // serverspdy.addListener(
    //     "tlsClientError",
    //     (err: Error, socket: tls.TLSSocket) => {
    //         socket.destroy();
    //         servernet.emit("tlsClientError", err, socket);
    //     }
    // );
    serverspdy.addListener("error", () => {});
    serverspdy.prependListener("secureConnection", (socket: tls.TLSSocket) => {
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
        // serverspdy.emit("connection", socket);
        serverspdy.listeners("connection").forEach((callback: Function) => {
            Promise.resolve().then(() => {
                Reflect.apply(callback, serverspdy, [socket]);
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
    // serverspdy.addListener("connection", connectionListener);
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
                    `content-type: text/html`,
                    //   `Date: Fri, 08 May 2020 16:20:58 GMT`,
                    `Connection: keep-alive`,
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
        const originspdyfun = Reflect.get(serverspdy, key);
        Reflect.set(servernet, key, (event: any, listener: any) => {
            Reflect.apply(originnetfun, servernet, [event, listener]);
            Reflect.apply(originhttpfun, serverhttp, [event, listener]);
            Reflect.apply(originspdyfun, serverspdy, [event, listener]);
            return servernet;
        });
    });

    return servernet;
}
