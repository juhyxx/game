import net from 'net';
import * as http from 'http';
import { encodeMessage, decodeMessage } from "./protocol.js"


let server = net.createServer();
let sessions = [];
let games = [];

const requestListener = function (req, res) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.writeHead(200);
    let users = ''
    let liveGames = ""
    if (sessions) {
        users = sessions.map(item => {
            return `<li>${item.username}</li>`;
        }).join("")
    }
    if (games) {
        liveGames = games.map(item => {
            return `<li>${item.challenger.username} -> ${item.player.username} Atempts: ${item.counter}</li>`;
        }).join("")
    }
    res.end(`<style>*{font-family: sans-serif}</style><h1> The game</h1>
    <h2>Who is there</h2>
    <ul>${users}</ul>
    <h2>Who is playing</h2>
    <ul>${liveGames}</ul>
    <script>setTimeout(()=> {window.location.reload()}, 2000)</script>`);
};
const webserver = http.createServer(requestListener);
webserver.listen(8080, "127.0.0.1", (params) => {
    console.log(`Web Server is running on 127.0.0.1:8080 `);
});

function isAuthentized(socket) {
    return sessions.find(item => item.socket === socket)
}

server.on("connection", (socket) => {
    socket.write(encodeMessage("HI:"));

    socket.on("data", (data) => {


        const [command, value] = decodeMessage(data);
        //console.debug("COMMAND", command)

        switch (command) {
            case "PASSWORD":
                const [username, password] = value.split("@");
                if (["iddqd", "idkfa"].includes(password)) {
                    sessions.push({ username, socket })
                    socket.write(encodeMessage(`AUTHENTIZED:${username}`));

                    let users = sessions.map((item, index) => `(${index}) ${item.username}`).join("\n");
                    console.debug("Logged users:\n", users)
                }
                else {
                    socket.write(encodeMessage("AUTHFAIL:"));
                }
                break;

            case "LIST":
                if (!isAuthentized(socket)) {
                    socket.write(encodeMessage("AUTHFAIL:"));
                    break;
                }
                const users = sessions.map((item, index) => {

                    if (item.socket == socket) {
                        return `(${index}) ${item.username} (YOU)`;
                    }
                    return `(${index}) ${item.username}`;
                });
                socket.write(encodeMessage(`USERLIST:${users.join("\n")}\n`));

                break
            case "START":
                if (!isAuthentized(socket)) {
                    socket.write(encodeMessage("AUTHFAIL:"));
                    break;
                }

                const [user, word] = value.split("@");
                let game = {
                    challenger: sessions.find(item => item.socket == socket),
                    player: sessions[parseInt(user, 10)],
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
                if (!isAuthentized(socket)) {
                    socket.write(encodeMessage("AUTHFAIL:"));
                    break;
                }
                let currentGame = games.find(item => item.player.socket == socket);
                if (value === "GIVEUP") {
                    currentGame.challenger.socket.write(encodeMessage(`PROGRESS:GIVEUP`));
                    const index = games.findIndex(item => item.player.socket == socket);
                    games.splice(index, 1);

                    const users = sessions.map((item, index) => `(${index}) ${item.username}`);
                    socket.write(encodeMessage(`USERLIST: ${users.join("\n")}\n`));
                    break;
                }
                if (currentGame.word == value) {
                    socket.write(encodeMessage(`RESULT:OK`));
                    currentGame.challenger.socket.write(encodeMessage(`PROGRESS:GUESS`));
                    const index = games.findIndex(item => item.player.socket == socket);
                    games.splice(index, 1);
                }
                else {
                    currentGame.counter += 1;
                    socket.write(encodeMessage(`RESULT:WRONG`));
                    currentGame.challenger.socket.write(encodeMessage(`PROGRESS:ATTEMPT`));
                }
                break;

            case "HINT":
                if (!isAuthentized(socket)) {
                    socket.write(encodeMessage("AUTHFAIL:"));
                    break;
                }
                let actualGame = games.find(item => item.challenger.socket == socket);
                if (actualGame && actualGame.player) {
                    actualGame.player.socket.write(encodeMessage(`TINYHINT:${value}`));
                }
                break;
            default:
                console.log('--- Server Received: ' + data);

        }
    })

    socket.on('close', function () {
        let index = sessions.findIndex(item => item.socket == socket);
        if (index > -1) {
            sessions.splice(index, 1);
            console.log("disconect", index);
        }
    });
})

server.on('error', (err) => {
    throw err;
});

server.listen(process.env.PORT || 9000, () => {
    console.log('server listening to %j', server.address());
});
