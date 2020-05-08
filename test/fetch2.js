import fetch2 from "fetch-h2";
import { cert } from "./key-cert.js";
import { urls } from "./urls.js";
import { formatresponse } from "./format-response.js";
import { logjson } from "./logjson.js";

process.on("unhandledRejection", console.error);

const fetch = fetch2.context({
    session: { rejectUnauthorized: false, ca: cert },
}).fetch;

// @ts-ignore

~((fetch) => {
    Promise.all(
        urls.map(async (url) => {
            return fetch(url, { timeout: 2000, redirect: "manual" }).then(
                async (r) => {
                    return formatresponse(r);
                }
            );
        })
    ).then(logjson);
    // @ts-ignore
})(fetch);
