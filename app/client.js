
console.info("...Starting client")

import net from 'net';
import readline from 'readline';


let id = null;
let rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});


let client = new net.Socket();
client.connect(process.env.PORT || 9000, process.env.SERVER);


client.on('data', (data) => {
	const [command, value] = data.toString().split(":");
	//console.debug("COMMAND:" + command, "VALUE:" + value)
	switch (command) {
		case "HI":
			client.write("PASSWORD:" + process.env.NAME + "@" + process.env.PASSWORD);
			break
		case "AUTHENTIZED":
			client.write("LIST:");
			break;
		case "USERLIST":
			console.log('Lists of oponents:\n', value);

			rl.question(`The game\n1:word\t\tchoose user and word\nlist\t\tfor list of users\nwait\t\tfor challenge waiting\nq\t\tfor quit\n`, (answer) => {
				if (answer === "wait") {
					return;
				}
				if (answer === "list") {
					client.write("LIST:");
					return;
				}
				if (answer === "q") {
					console.info("bye")
					process.exit()
				}
				let [user, word] = answer.split(":")
				user = parseInt(user, 10);
				if (isNaN(user) || !word || word.length == 0) {
					console.warn(`Incorect selection "${answer}"`);
					process.exit()
				}
				client.write(`START:${user}@${word}`);
			})
			break;
		case "STARTGAME":
			console.log(`Game with "${value}" is starting.`);
			rl.question("Guess the word:\n", (answer) => {
				client.write(`GUESS:${answer}`);
			})
			break;
		case "RESULT":
			if (value == "WRONG") {
				rl.question("Wrong. Guess the word (or type 'giveup'):\n", (answer) => {
					if (answer === "giveup") {
						client.write(`GUESS:GIVEUP`);
						return;
					}
					else {
						client.write(`GUESS:${answer}`);
					}
				})
			}
			if (value == "OK") {
				console.log("YOU GUESSED IT!!!!!");
				client.write("LIST:");
			}

			break;
		case "PROGRESS":
			if (value === "ATTEMPT") {
				console.log(`He tries.`);
			}
			if (value == "GUESS") {
				console.log(`He guessed it!!!!!`);
				client.write("LIST:");
			}
			if (value == "GIVEUP") {
				console.log(`He gave it up. Booooo!!!`);
				client.write("LIST:");
			}

			break;
		default:
		//console.log('--- Received: \n' + data);
	}


});

client.on('close', () => {
	console.log('--- Connection closed');
	process.exit()
});

client.on('error', (err) => {
	console.log('--- error', err);
});


