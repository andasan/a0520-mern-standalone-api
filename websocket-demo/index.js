const http = require('http');
const WebSocketServer = require('websocket').server;
let connection = null;

const httpServer = http.createServer((req, res) => {
    console.log('We have received a request!');
});

const webSocket = new WebSocketServer({
    httpServer: httpServer,
});

httpServer.listen(8888, () => {
    console.log('My server is listening on port 8888');
});

webSocket.on("request", (request) => {
    connection = request.accept(null, request.origin);
    connection.on('open', () => console.log('Open!'))
    connection.on('close', () => console.log('Close!'))
    connection.on('message', (message) => {
        connection.send(`Got your message: ${message.utf8Data}`)
    });
})