import http from "http";
export const requestNotFound = function (req, res) {
    res.statusCode = 404;
    res.setHeader("content-type", "text/html");
    res.end("404 Not Found");
    res.destroy();
};
export const upgradeNotFound = function (req, socket, head) {
    const res = new http.ServerResponse(req);
    requestNotFound(req, res);
};
