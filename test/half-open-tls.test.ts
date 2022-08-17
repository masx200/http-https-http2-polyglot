import https from "https";
import assert from "assert";

import { createServer } from "../dist/index.js";
import { cert, key } from "./key-cert.js";

import { test } from "vitest";
test("half-open-tls", async () => {
    return new Promise<void>((res) => {
        var server = createServer(
            {
                key,
                cert,
            },
            function () {
                assert(false, "Request handler should not be called");
            }
        );

        server.listen(0, "127.0.0.1", function () {
            //@ts-ignore
            var port = server.address()?.port;
            console.log("listening ", port);
            var request = https.get({
                host: "127.0.0.1",
                port: port,
                rejectUnauthorized: true,
            });
            request.on("error", function (error) {
                console.error("client error", error);

                assert(
                    /certificate/.test(error.message),
                    "Request should be rejected with a certificate error"
                );
            });
        });

        // Without this change, this is never called:
        server.on("tlsClientError", function (e) {
            console.error("tlsClientError", e);
            server.close(() => {
                console.log("server closed");
                res();
            });
        });
    });
});
