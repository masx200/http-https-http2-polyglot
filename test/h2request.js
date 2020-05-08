process.on("unhandledRejection", console.error);
import got from "got";
import { cert } from "./key-cert.js";
import { logjson } from "./logjson.js";
import { urls } from "./urls.js";
Promise.allSettled(
    urls.map(async (url) => {
        return got(url, { rejectUnauthorized: false, ca: cert, http2: true })
            .then(async (r) => {
                return [r.url, r.statusCode, r.headers, r.body];
            })
            .then(logjson);
    })
).then(console.log);
