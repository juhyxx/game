
console.info("Starting client")

import net from 'net';
import readline from 'readline';

let id = null;
let client = new net.Socket();
client.connect(process.env.PORT, process.env.SERVER);

client.on('data', (data) => {
	if (data == "HI") {
		client.write("PASSWORD:" + process.env.PASSWORD);
	}
	if (data.toString().match(/^ID:/)) {
		console.log('Logged in');
		id = data;
	}
	console.log('Received: ' + data);

});

client.on('close', () => {
	console.log('Connection closed');
});

client.on('error', () => {
	console.log('error');
});

let r = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});


