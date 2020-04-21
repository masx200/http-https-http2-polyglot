/**
 * @param {Response} r
 */
export function formatresponse(r) {
    return Promise.all([r.url, r.ok, r.status, [...r.headers], r.text()]);
}
