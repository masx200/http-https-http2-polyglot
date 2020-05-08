/**
 * @param {Response} r
 */
export function formatresponse(r) {
    return Promise.all([r.url, r.status, Object.fromEntries([...r.headers]), r.text()]);
}
