import { createServer } from "../dist/index.js";
import { cert, key } from "./key-cert.js";

import { test } from "vitest";
import assert from "assert";
import { fetch } from "undici";
test("simple-http", async () => {
    return new Promise<void>((resolve) => {
        const port = 9000;

        const server = createServer(
            {
                key,
                cert,
            },
            async function (req, res) {
                debugger;
                res.writeHead(200, { "Content-Type": "text/html" });
                const body =
                    (true === req.socket["encrypted"] ? "HTTPS" : "HTTP") +
                    " Connection!\n" +
                    "alpnProtocol:" +
                    req.socket.alpnProtocol +
                    " \n";

                res.end(body);
            }
        );

        server.listen(port, "localhost", async function () {
            console.log("httpolyglot server listening on port " + port);

            const response = await fetch("http://localhost:9000/");
            console.log(response.status, response.headers);
            assert(response.status === 200);
            const text = await response.text();
            console.log(text);
            assert.equal(text, "HTTP Connection!\nalpnProtocol:undefined \n");
            server.close();
            resolve();
        });
    });
});
