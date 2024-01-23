
console.info("...Starting client")

import net from 'net';
import readline from 'readline';
import { encodeMessage, decodeMessage } from "./protocol.js"

let ac = new AbortController();
let signal = ac.signal;
let client = new net.Socket();
let rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

client.connect(process.env.PORT || 9000, process.env.SERVER);

client.on('data', (data) => {
	const [command, value] = decodeMessage(data);
	//console.debug("COMMAND:" + command, "VALUE:" + value)
	switch (command) {
		case "HI":
			client.write(encodeMessage("PASSWORD:" + process.env.NAME + "@" + process.env.PASSWORD));
			break;

		case "AUTHENTIZED":
			client.write(encodeMessage("LIST:"));
			break;

		case "AUTHFAIL":
			console.info("wrong password");
			console.info("bye");
			client.destroy();
			process.exit();
			break;

		case "USERLIST":
			console.log('Lists of oponents:\n', value);

			if (signal.aborted) {
				ac = new AbortController();
				signal = ac.signal;
			}

			rl.question(`The game\n1:word\t\tchoose user and word\nlist\t\tfor list of users\nq\t\tfor quit\n`, { signal }, (answer) => {
				if (answer === "list") {
					client.write(encodeMessage("LIST:"));
					return;
				}
				if (answer === "q") {
					console.info("bye");
					client.destroy();
					process.exit();
				}
				let [user, word] = answer.split(":")
				user = parseInt(user, 10);
				if (isNaN(user) || !word || word.length == 0) {
					console.warn(`Incorect selection "${answer}"`);
					client.write(encodeMessage("LIST:"));
					return;
				}
				client.write(encodeMessage(`START:${user}@${word}`));
			})
			break;

		case "STARTGAME":
			ac.abort()
			console.log(`Game with "${value}" is starting.`);
			rl.question("Guess the word:\n", (answer) => {
				client.write(encodeMessage(`GUESS:${answer}`));
			})
			break;

		case "RESULT":
			if (value == "WRONG") {
				rl.question("Wrong. Guess the word (or type ':giveup'):\n", (answer) => {
					if (answer === ":giveup") {
						client.write(encodeMessage(`GUESS:GIVEUP`));
						return;
					}
					else {
						client.write(encodeMessage(`GUESS:${answer}`));
					}
				})
			}
			if (value == "OK") {
				console.log("YOU GUESSED IT!!!!!");
				client.write(encodeMessage("LIST:"));
			}

			break;

		case "TINYHINT":
			console.info(value)
			break;

		case "GAMEFAIL":
			console.info("\nDon't play with yourself!\n")
			client.write(encodeMessage("LIST:"));
			break

		case "PROGRESS":
			if (value === "ATTEMPT") {
				rl.question("He tries. What about a little hint?:\n", { signal }, (answer) => {
					client.write(encodeMessage("HINT:" + answer));
				})
			}
			if (value == "GUESS") {
				ac.abort()
				console.info(`He guessed it!!!!!`);
				client.write(encodeMessage("LIST:"));
			}
			if (value == "GIVEUP") {
				ac.abort()
				console.log(`He gave it up. Booooo!!!`);
				client.write(encodeMessage("LIST:"));
			}
			break;
	}
});

client.on('close', () => {
	console.log('--- Connection closed');
	process.exit()
});

client.on('error', (err) => {
	console.log('--- error', err);
});

process.stdin.resume();
process.on('SIGINT', () => {
	console.info("bye");
	client.destroy();
	process.exit();
});


