let commands = [
    "HI",
    "PASSWORD",
    "LIST",
    "START",
    "GUESS",
    "HINT",
    "AUTHENTIZED",
    "TINYHINT",
    "PROGRESS",
    "USERLIST",
    "STARTGAME",
    "RESULT",
    "AUTHFAIL",
    "GAMEFAIL"
];

function encodeMessage(message) {
    const [command, value] = message.split(":");
    // console.log(command)
    const encodedValue = Buffer.from(value, 'latin1');
    const index = commands.indexOf(command);
    const encodedCommand = Buffer.allocUnsafe(1);

    encodedCommand.writeUInt8(index);
    return Buffer.concat([encodedCommand, encodedValue]);
}

function decodeMessage(encoded) {
    let index = encoded.slice(0, 1).readInt8(0);
    let value = encoded.slice(1, encoded.lenght).toString();

    return [commands[index], value];

}

export { encodeMessage, decodeMessage }