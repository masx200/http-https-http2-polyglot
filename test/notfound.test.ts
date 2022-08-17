import { createServer } from "../dist/index.js";
import { cert, key } from "./key-cert.js";
import { fetch } from "undici";
import { test } from "vitest";
import assert from "assert";

test("notfound", async () => {
    return new Promise<void>((resolve) => {
        const port = 8998;
        // @ts-ignore

        const server = createServer({
            key,
            cert,
        });

        server.listen(port, "localhost", async function () {
            console.log("httpolyglot server listening on port " + port);

            const response = await fetch("http://localhost:8998/notfound");
            console.log(response.status, response.headers);
            assert.equal(response.status, 404);
            resolve();
        });
    });
});
