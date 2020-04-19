import http from "http";
import https from "https";
import net from "net";
import spdy from "spdy";
import tls from "tls"




export interface ServerRequest extends ServerRequest{

socket:Socket
}

export interface ServerResponse extends ServerResponse{

socket:Socket

}
export type Socket=tls.TLSSocket|net.Socket
export type RequestListener = (req:ServerRequest,res:ServerResponse)=>void;
export type UpgradeListener = (
    req: ServerRequest,
    socket:Socket,
    head: Buffer
) => void;
export type ServerOptions = https.ServerOptions;
const notfoundrequestlistener = function (
    req: ServerRequest,
    res: ServerResponse
) {
    res.statusCode = 404;
    
    res.end();
};
const notfoundupgradelistener = function (
    req: ServerRequest,
    socket:Socket,
    head: Buffer
) {
    socket.write(`HTTP/1.1 404 Not Found\r\nConnection: keep-alive\r\n\r\n`);
    socket.destroy();
};
function createServer(
    config: ServerOptions,
    requestListener: RequestListener = notfoundrequestlistener,
    upgradeListener: UpgradeListener = notfoundupgradelistener
): https.Server {
    if (!(typeof config === "object")) {
        throw new Error("options are required!");
    }

    const serverhttp = http.createServer(config);
    //@ts-ignore
    const serverspdy = spdy.createServer(config);
    serverhttp.removeAllListeners("request");
    serverspdy.removeAllListeners("request");
    serverspdy.addListener("request", requestListener);
    serverhttp.addListener("request", (req, res) => {
        serverspdy.emit("request", req, res);
    });
    serverhttp.addListener(
        "upgrade",
        (req: ServerRequest, socket:Socket, head: Buffer) => {
            serverspdy.emit("upgrade", req, socket, head);
        }
    );
    serverspdy.addListener("upgrade", upgradeListener);
    const onconnection = serverspdy.listeners("connection");
    serverspdy.removeAllListeners("connection");
    function handletls(socket:net.Socket) {
        onconnection.forEach((listeners: Function) =>
            Reflect.apply(listeners, serverspdy, [socket])
        );
    }
    function handlehttp(socket:net.Socket) {
        serverhttp.emit("connection", socket);
    }
    serverspdy.addListener("connection", connectionListener);

    function connectionListener(socket:net.Socket) {
        socket.on("error", function onError() {});

     //   let ishttp = false;
   //     let istls = false;

        const data = socket.read(1);
        /* https://github.com/httptoolkit/httpolyglot/blob/master/lib/index.js */
        if (data === null) {
            socket.once("readable", () => {
                connectionListener(socket);
            });
        } else {
            const firstByte = data[0];
            socket.unshift(data);
            if (firstByte === 22) {
            	
            handletls(socket);
          //      istls = true;
            } else if (32 < firstByte && firstByte < 127) {
             //   ishttp = true;
             
             handlehttp(socket);
            } else {
                socket.destroy();
            }
         //   if (ishttp) {
                
        //    }
      //      if (istls) {
                
    //        }
        }
        /* 测试发现不能使用on data事件,会收不到响应,多次数据会漏掉 */
    }

    return serverspdy;
}
export { createServer };
