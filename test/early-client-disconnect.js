import assert from "assert";
import { Socket } from "net";
import { createServer } from "../lib/index.js";
import { cert, key } from "./key-cert.js";
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
    var port = this.address().port;
    console.log("httpolyglot server listening on port " + port);
    const socket = new Socket();

    socket.connect(port, "localhost", () => {
        console.log("client connect");
        socket.end(() => {
            server.close(() => {
                console.log("server close");
            });
        });
        socket.on("close", (e) => {
            console.log("client close", e);
        });
    });
});
