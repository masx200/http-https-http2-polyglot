import { createServer } from "../dist/index.js";
import { test } from "vitest";
import got from "got";
import { cert, key } from "./key-cert.js";
import assert from "assert";

test("simple-http2", async () => {
    return new Promise<void>((resolve) => {
        const port = 9001;

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

            const response = await got("https://localhost:9001/", {
                http2: true,
                https: {
                    rejectUnauthorized: false,
                },
            });
            console.log(response.statusCode);
            assert(response.statusCode === 200);
            console.log(response.headers);
            const text = response.body;
            console.log(text);
            assert.equal(text, "HTTPS Connection!\nalpnProtocol:h2 \n");
            resolve();
        });
    });
});
