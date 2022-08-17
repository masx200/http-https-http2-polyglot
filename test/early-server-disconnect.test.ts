import assert from "assert";
import net from "net";
import { createServer } from "../dist/index.js";
import { cert, key } from "./key-cert.js";
import { test } from "vitest";
test("early-client-disconnect", async () => {
    return new Promise<void>((res) => {
        const port = 0;
        // @ts-ignore

        const server = createServer(
            {
                key,
                cert,
            },
            async function (req, res) {
                assert(false, "Request handler should not be called");
            }
        );

        server.listen(port, "localhost", function () {
            // @ts-ignore
            var port = server.address()?.port;
            console.log("httpolyglot server listening on port " + port);
            const socket = net.connect(port, "localhost", () => {
                console.log("client connect");
                server.close(() => {
                    console.log("server close");
                    res();
                });
                socket.end();
            });
            socket.on("close", (e) => {
                console.log("client close", e);
            });
        });
        setTimeout(() => {
            server.close();
            process.exit(0);
        }, 1000);
    });
});
