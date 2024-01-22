import net from 'net';

import { v4 as uuidv4 } from 'uuid';

let server = net.createServer((socket) => {
    socket.write('Init\r\n');
    socket.pipe(socket);
});

server.on("connection", (socket) => {
    socket.write("HI");

    console.log("connected")
    socket.on("data", (data) => {
        if (data == "PASSWORD:iddqd" || data == "PASSWORD:idkfa") {
            socket.write("ID:" + uuidv4());
        } else {
            socket.write("wrong password");
        }
        socket.pipe(socket);
        console.log('Server Received: ' + data);
    })
})

server.on('error', (err) => {
    throw err;
});

server.listen(process.env.PORT, () => {
    console.log('server listening to %j', server.address());
});
