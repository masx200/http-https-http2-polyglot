# Description

说明

Serve http and https and http2 connections over the same port with node.js，

and add "typescript" support。

Thanks to the original author，

使用 node.js 在同一端口上服务 http 和 https 以及 http2 连接，

优化和重构，

并添加"TYPESCRIPT"支持。

多亏了原作者，

https://github.com/mscdex/httpolyglot

https://github.com/httptoolkit/httpolyglot

# Requirements

要求

[node.js](http://nodejs.org/) -- v12.0.0 or newer

# Install

安装

```shell
yarn add @masx200/http-https-http2-polyglot
```

# Connection protocol judgment

连接协议判断

确定连接是否通过 tls。

Determine if the connection is over tls.

```js
const istls = true === req.socket["encrypted"];
```

Determine if the connection is `http/2`.

确定连接是否为“ http / 2”。

```js
const ishttp2 = "h2" === req.socket.alpnProtocol;
```

# Examples

例子

`http2` 服务器推送

`http2` server push

https://github.com/masx200/http-https-http2-polyglot/blob/master/test/push.js

```js
import { createServer } from "../lib/index.js";
import { cert, key } from "./key-cert.js";
const port = 9002;
// @ts-ignore

const server = createServer(
    {
        key,
        cert,
    },
    (req, res) => {
        if (req.url == "/main.js") {
            res.statusCode = 200;
            res.setHeader("content-type", "application/javascript");
            res.end('alert("not from push stream")');
            return;
        } else {
            res.writeHead(200, { "Content-Type": "text/html" });

            if (res.push) {
                var stream = res.push("/main.js", {
                    status: 200, // optional
                    method: "GET", // optional
                    request: {
                        accept: "*/*",
                    },
                    response: {
                        "content-type": "application/javascript",
                    },
                });
                stream.on("error", function (e) {
                    console.log(e);
                });
                stream.end('alert("hello from push stream!");');
            }

            res.end('push<script src="/main.js"></script>');
        }
    }
);
server.listen(port, "localhost", function () {
    console.log("httpolyglot server listening on port " + port);
});
```

Websocket server

Websocket 服务器

https://github.com/masx200/http-https-http2-polyglot/blob/master/test/websocket.js

```js
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import ws from "ws";
import { createServer } from "../lib/index.js";
import { cert, key } from "./key-cert.js";
const port = 8999;
const wsServer = new ws.Server({ noServer: true });
wsServer.on("connection", (websocket, req) => {
    websocket.on("error", () => {});
    websocket.send(JSON.stringify(req.headers));
    websocket.send(
        (true === req.socket["encrypted"] ? "HTTPS" : "HTTP") + " Connection!"
    );
});
// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const server = createServer(
    {
        key,
        cert,
    },
    async function (req, res) {
        if (req.url === "/") {
            res.writeHead(200, { "Content-Type": "text/html" });

            res.end(
                "websocket<script type='module' src='./index.js'></script>"
            );
        } else if (req.url === "/index.js") {
            res.writeHead(200, { "Content-Type": "text/javascript" });
            const jsfile = await fs.promises.readFile(
                path.join(__dirname, "index.js")
            );
            res.write(jsfile);
            res.end();
        } else {
            res.statusCode = 404;
            res.write("404");
            res.end();
        }
    },
    function (req, socket, head) {
        wsServer.handleUpgrade(req, socket, head, function done(ws) {
            wsServer.emit("connection", ws, req);
        });
    }
);
//server.on("request", console.log);
//server.on("upgrade", console.log);
server.listen(port, "localhost", function () {
    console.log("httpolyglot server listening on port " + port);
});
```

Simple Determine the connection protocol

简单确定连接协议

```javascript
import * as httpolyglot from "@masx200/http-https-http2-polyglot";
import fs from "fs";

const port = 9000;
const server = httpolyglot.createServer(
    {
        key: fs.readFileSync("server.key.pem"),
        cert: fs.readFileSync("server.crt.pem"),
    },
    function (req, res) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(
            (true === req.socket["encrypted"] ? "HTTPS" : "HTTP") +
                " Connection!"
        );
    }
);
server.listen(port, "localhost", function () {
    console.log("httpolyglot server listening on port " + port);
});
```

redirect all http connections to https:

将所有 http 连接重定向到 https

https://github.com/masx200/http-https-http2-polyglot/blob/master/test/redirect.js

```js
import { createServer } from "../lib/index.js";
import { cert, key } from "./key-cert.js";
// @ts-ignore

const port = 9001;
const server = createServer(
    {
        key,
        cert,
    },
    function (req, res) {
        if (true === req.socket["encrypted"]) {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end("Welcome, HTTPS user!");
        } else {
            const host = req.headers["host"] || req.authority;
            const originurl = req.url || "";
            const tourl = new URL(originurl, "https://" + host);
            tourl.port = String(port);
            res.writeHead(302, {
                Location: tourl.href,
                "Content-Type": "text/html",
            });
            res.write("302");
            return res.end();
        }
    }
);

server.listen(port, "localhost", function () {
    console.log("httpolyglot server listening on port " + port);
});
```

create a "404 not found" server

创建“ 404 未找到”服务器

https://github.com/masx200/http-https-http2-polyglot/blob/master/test/notfound.js

```js
import { createServer } from "../lib/index.js";
import { cert, key } from "./key-cert.js";
const port = 8998;
// @ts-ignore

const server = createServer({
    key,
    cert,
});

server.listen(port, "localhost", function () {
    console.log("httpolyglot server listening on port " + port);
});
```

# API

## Exports

https://github.com/masx200/http-https-http2-polyglot/blob/master/dist/index.d.ts

**createServer** - Creates and returns a new Server instance.

创建并返回一个新的 Server 实例。

```ts
declare function createServer(
    options: ServerOptions,
    requestListener?: RequestListener,
    upgradeListener?: UpgradeListener
):  http2.Http2SecureServer & http.Server;
```

The `requestListener` is a function which is automatically added to the 'request' event

The `upgradeListener` is a function which is automatically added to the 'upgrade' event

If no "requestListener" or "upgradeListener" is provided, the default "404 not found" listener will be used instead.

Event "clientError", If a client connection emits an 'error' event, it will be forwarded here.

Event "tlsClientError", The 'tlsClientError' event is emitted when an error occurs before a secure connection is established.

Event: 'listening',Emitted when the server has been bound after calling `server.listen()`.

Event: 'close', Emitted when the server closes

Event: 'error',Emitted when an error occurs on the server

Only "requestListener" will be called when the "request" event occurs.

Only "upgradeListener" will be called when the "upgrade" event occurs.

Do not add "request" or "upgrade" event listener because it is not recommended to add multiple event listeners for "request"or "upgrade".

`requestListener`是一个自动添加到'request'事件的函数

“ upgradeListener”是一个自动添加到“ upgrade”事件中的函数

如果未提供“ requestListener”或“ upgradeListener”，则将使用默认的“ 404 not found”监听器。

事件“ clientError”，如果客户端连接发出`error`事件，它将在此处转发。

事件“ tlsClientError”，在建立安全连接之前发生错误时，将发出“ tlsClientError”事件。

事件：'listening'，在调用`server.listen（）`后绑定服务器时触发。

事件：“ close”，在服务器关闭时发出

事件：`error`，在服务器上发生错误时发出

发生“ request”事件时，仅将调用“ requestListener”。

发生`upgrade`事件时，仅会调用“ upgradeListener”。

不要添加`request`或`request`事件侦听器，因为不建议为`request`或`request`添加多个事件侦听器。

# How it Works

这个怎么运作

https://github.com/lvgithub/blog/blob/master/http_and_https_over_same_port/README.MD

TLS and HTTP connections are easy to distinguish based on the first byte sent by clients trying to connect. See this comment for more information.

TLS 和 HTTP 连接很容易根据尝试连接的客户端发送的第一个字节进行区分。有关更多信息，请参见此评论。

https://github.com/mscdex/httpolyglot/issues/3#issuecomment-173680155

https://github.com/httptoolkit/httpolyglot/blob/master/lib/index.js

# test

测试

```powershell
yarn install
```

```powershell
yarn build
```

```powershell
yarn generate
```

```powershell
yarn serve
```

```powershell
yarn test
```

```powershell
yarn curl
```

```powershell
yarn open
```
