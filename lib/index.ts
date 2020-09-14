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
): http2.Http2SecureServer {
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

    //@ts-ignore
    const server = http2.createSecureServer(options);

    Reflect.set(server, "allowHalfOpen", false);

    server.addListener("upgrade", upgradeListener);

    server.addListener("request", requestListener);

    server.addListener("error", () => {});
    server.prependListener("secureConnection", (socket: tls.TLSSocket) => {
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
    const tlsconlisteners = server.listeners("connection");
    async function handletls(socket: net.Socket) {
        tlsconlisteners.forEach((callback: Function) => {
            Promise.resolve().then(() => {
                Reflect.apply(callback, server, [socket]);
            });
        });
    }
const httpconlisteners = serverhttp.listeners("connection");
 
    async function handlehttp(socket: net.Socket) {
        httpconlisteners.forEach((callback) => {
            Promise.resolve().then(() => {
                Reflect.apply(callback, server, [socket]);
            });
        });
    }
    server.removeAllListeners("connection");
    server.addListener("connection", connectionListener);

    async function connectionListener(socket: net.Socket) {
        Reflect.set(socket, "allowHalfOpen", false);

        /* 类型“Socket”上不存在属性“allowHalfOpen” */
        // socket.allowHalfOpen = false;
        //如果没有error监听器就添加error 监听器
        if (!socket.listeners("error").length) {
            socket.on("error", () => {});
        }

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
                server.emit(
                    "clientError",
                    new Error("protocol error, Neither http, nor tls"),
                    socket
                );
            }
        }
        /* 测试发现不能使用on data事件,会收不到响应,多次数据会漏掉 */
    }

    return new Proxy(
server,{


get(target,key){}
,set(target ,key,value){}


});
}
