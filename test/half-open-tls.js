import https from "https";
import assert from "assert";

import { createServer } from "../lib/index.js";
import { cert, key } from "./key-cert.js";
var srv = createServer(
    {
        key,
        cert,
    },
    function () {
        assert(false, "Request handler should not be called");
    }
);

srv.listen(0, "127.0.0.1", function () {
    var port = this.address().port;
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
srv.on("tlsClientError", function (e) {
    console.error("tlsClientError", e);
    srv.close(() => {
        console.log("server closed");
    });
});
