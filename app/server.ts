import * as net from 'net';
import * as http from 'http';
import { encodeMessage, decodeMessage } from "./protocol";
import { session, Sessions } from "./sessions";
import * as fs from 'fs';


type game = {
    challenger: session;
    player: session;
    word: string;
    counter: number;
}
let server = net.createServer();
let games: game[] = [];


let sessionStorage = new Sessions()

server.on("connection", (socket: net.Socket) => {
    socket.write(encodeMessage("HI:"));

    socket.on("data", (data: Buffer) => {
        const [command, value]: string[] = decodeMessage(data);

        switch (command) {
            case "PASSWORD":
                const [username, password] = value.split("@");
                if (["iddqd", "idkfa"].includes(password)) {
                    sessionStorage.add({ username, socket })
                    socket.write(encodeMessage(`AUTHENTIZED:${username}`));
                    console.debug("Logged users:\n", sessionStorage.getUsers().join("\n"))
                }
                else {
                    socket.write(encodeMessage("AUTHFAIL:"));
                }
                break;

            case "LIST":
                if (!sessionStorage.isAuthentized(socket)) {
                    socket.write(encodeMessage("AUTHFAIL:"));
                    break;
                }
                socket.write(encodeMessage(`USERLIST:${sessionStorage.getUsers().join("\n")}\n`));

                break
            case "START":
                if (!sessionStorage.isAuthentized(socket)) {
                    socket.write(encodeMessage("AUTHFAIL:"));
                    break;
                }

                const [user, word]: string[] = value.split("@");
                const challenger: session | undefined = sessionStorage.getSessionBySocket(socket)
                if (!challenger) {
                    break;
                }
                const game: game = {
                    challenger: challenger,
                    player: sessionStorage.getSessionByIndex(parseInt(user, 10)),
                    word: word,
                    counter: 0
                }
                if (game.player === game.challenger) {
                    socket.write(encodeMessage("GAMEFAIL:"));
                    break;
                }
                console.log(`starting match ${game.challenger.username} -> ${game.player.username}`)
                games.push(game);
                game.player.socket.write(encodeMessage(`STARTGAME:${game.challenger.username}`));
                break;

            case "GUESS":
                if (!sessionStorage.isAuthentized(socket)) {
                    socket.write(encodeMessage("AUTHFAIL:"));
                    break;
                }
                const currentGame = games.find(item => item.player.socket == socket);
                if (!currentGame) {
                    break;
                }
                if (value === "GIVEUP") {
                    currentGame.challenger.socket.write(encodeMessage(`PROGRESS:GIVEUP`));
                    const index: number = games.findIndex(item => item.player.socket == socket);
                    games.splice(index, 1);


                    socket.write(encodeMessage(`USERLIST: ${sessionStorage.getUsers().join("\n")}\n`));

                    console.log(`ending match ${currentGame.challenger.username} -> ${currentGame.player.username}`)
                    break;
                }
                if (currentGame.word == value) {
                    socket.write(encodeMessage(`RESULT:OK`));
                    currentGame.challenger.socket.write(encodeMessage(`PROGRESS:GUESS`));
                    const index: number = games.findIndex(item => item.player.socket == socket);
                    games.splice(index, 1);
                    console.log(`ending match ${currentGame.challenger.username} -> ${currentGame.player.username}`)
                }
                else {
                    currentGame.counter += 1;
                    socket.write(encodeMessage(`RESULT:WRONG`));
                    currentGame.challenger.socket.write(encodeMessage(`PROGRESS:ATTEMPT`));
                }
                break;

            case "HINT":
                if (!sessionStorage.isAuthentized(socket)) {
                    socket.write(encodeMessage("AUTHFAIL:"));
                    break;
                }
                const actualGame: game | undefined = games.find(item => item.challenger.socket == socket);
                if (actualGame && actualGame.player) {
                    actualGame.player.socket.write(encodeMessage(`TINYHINT:${value}`));
                }
                break;
            default:
                console.log('--- Server Received: ' + data);

        }
    })

    socket.on('close', function () {
        sessionStorage.removeUser(socket)
    });
})

server.on('error', (err) => {
    throw err;
});

if (process.env.USOCKET) {
    const socketPath: string = '/tmp/unixSocket';

    fs.unlinkSync(socketPath);
    server.listen(socketPath, () => {
        console.log(`Unix socker server is listening ${socketPath}`);
    });
}
else {
    server.listen(process.env.PORT || 9000, () => {
        console.log('server listening to %j', server.address());
    });
}

const webserver = http.createServer((req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.writeHead(200);

    let users: string = sessionStorage.getUsers().map(item => `<li>${item}</li>`).join("")
    let liveGames: string = games.map(
        item => `<li>${item.challenger.username} -> ${item.player.username} Atempts: ${item.counter}</li>`
    ).join("")

    res.end(
        `<style>*{font-family: sans-serif}</style><h1> The game</h1>
        <h2>Who is there</h2>
        <ul>${users}</ul>
        <h2>Who is playing</h2>
        <ul>${liveGames}</ul>
        <script>setTimeout(()=> {window.location.reload()}, 2000)</script>`
    );
});

webserver.listen(8080, () => {
    console.log(`Web Server is running on 127.0.0.1:8080 `);
});