import * as net from "net";
import { dispatch } from "./commands";
import { commandsParser } from "./resp";
// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");


const mem = new Map<String, {value: string, expiresAt: number | null}>();
// Uncomment the code below to pass the first stage
const server: net.Server = net.createServer((connection: net.Socket) => {
    connection.on("data", (data: Buffer) => {
      const args = commandsParser(data);
      dispatch(args, connection);
    })
  // Handle connection
});

server.listen(6379, "127.0.0.1");
