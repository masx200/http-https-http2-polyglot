export const requestNotFound = function (req, res) {
    res.statusCode = 404;
    res.end("404 Not Found");
};
export const upgradeNotFound = function (req, socket, head) {
    const response = [
        `HTTP/1.1 404 Not Found`,
        `Content-Length: 0`,
        "",
        "",
    ].join("\r\n");
    socket.write(response);
    socket.end();
    socket.destroy();
};
