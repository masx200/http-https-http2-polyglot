import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import * as ws from "ws";
import websocketStream from "websocket-stream";
import { createServer } from "../dist/index.js";
import { cert, key } from "./key-cert.js";
import { test } from "vitest";
import { fetch } from "undici";
import assert from "assert";
// console.log(ws)
test("simple-http", async () => {
    return new Promise<void>((resolve) => {
        const port = 8999;
        const wsServer = new ws.WebSocketServer({ noServer: true });
        wsServer.on("connection", (websocket, req) => {
            websocket.on("error", () => {});
            console.log(JSON.stringify(req.headers));
            websocket.send(
                //@ts-ignore
                (true === req.socket?.["encrypted"] ? "HTTPS" : "HTTP") +
                    " Connection!" +
                    "alpnProtocol:" +
                    //@ts-ignore
                    req.socket?.alpnProtocol +
                    " \n"
            );
            websocket.close();
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
            async function (req, socket, head) {
                wsServer.handleUpgrade(req, socket, head, function done(ws) {
                    wsServer.emit("connection", ws, req);
                });
            }
        );
        //server.on("request", console.log);
        //server.on("upgrade", console.log);
        server.listen(port, "localhost", async function () {
            console.log("httpolyglot server listening on port " + port);
            const response = await fetch("http://localhost:8999/");
            console.log(response.status, response.headers);
            assert(response.status === 200);
            const text = await response.text();
            console.log(text);
            assert.equal(
                text,
                "websocket<script type='module' src='./index.js'></script>"
            );

            const data = await new Promise((resolve, reject) => {
                const ws = websocketStream("wss://localhost:8999/", {
                    rejectUnauthorized: false,
                });

                let datare = "";
                ws.on("data", (data) => {
                    console.log("data", data);
                    datare += data.toString();
                });

                ws.on("error", reject);
                ws.on("close", () => {
                    resolve(datare);
                });
            });
            console.log(data);
            assert.equal(data, "HTTPS Connection!alpnProtocol:false \n");
            server.close();
            resolve();
        });
    });
});
