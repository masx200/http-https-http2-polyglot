import { createServer } from "../dist/index.js";
import { cert, key } from "./key-cert.js";
const port = 9002;
const server = createServer({ key, cert }, async (req, res) => {
    if (req.url == "/main.js") {
        res.statusCode = 200;
        res.setHeader("content-type", "application/javascript");
        res.end('alert("not from push stream")');
        return;
    } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        if ("function" === typeof res["createPushResponse"]) {
            res.createPushResponse(
                { ":method": "GET", ":path": "/main.js" },
                (err, stream) => {
                    if (err) {
                        console.error(err);
                    } else {
                        stream.setHeader(
                            "content-type",
                            "application/javascript"
                        );
                        stream.end('alert("hello from push stream!");');
                    }
                }
            );
        }
        res.end('push<script src="/main.js"></script>');
    }
});
server.listen(port, "localhost", function () {
    console.log("httpolyglot server listening on port " + port);
});
