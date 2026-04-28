import * as net from "net";

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");
const commandsParser = (data: Buffer) => {
 return data.toString().split("\r\n").filter((c) => !c.startsWith("*") && !c.startsWith("$") && c !== "");
}
const writeRESPSimpleString = (data: string):string =>{
     return `+${data}\r\n`;
}
const writeRESPBulkString = (data: string):string =>{
     return `$${data.length}\r\n${data}\r\n`;
}
const mem = new Map<String, any>();
// Uncomment the code below to pass the first stage
const server: net.Server = net.createServer((connection: net.Socket) => {
  connection.on("data", (data: Buffer) => {
    const args = commandsParser(data);
    const command = args[0];
    const value = args[1];
    switch (command.toUpperCase()) {
      case "PING":
        connection.write(writeRESPSimpleString("PONG"));
        break;
      case "ECHO":
        connection.write(writeRESPBulkString(value));
        break;
      case "SET":
        mem.set(value, args[2]);
        connection.write(writeRESPSimpleString("OK"));
        break;
      case "GET":
        connection.write(writeRESPBulkString(mem.get(value) || ""));
        break;
      default:
        connection.write("-ERR unknown command\r\n");
        break;
    }
  });
  // Handle connection
});

server.listen(6379, "127.0.0.1");
