import * as net from "net";

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

function parseRESP(data: string): string[] {
  const lines = data.split("\r\n");
  const args: string[] = [];

  
  for(let i = 0; i < lines.length; i++){
    if(lines[i].startsWith("$")){
        args.push(lines[i+1]);
        i++;
    }
  }
  return args;
}
// Uncomment the code below to pass the first stage
const server: net.Server = net.createServer((connection: net.Socket) => {
  connection.on("data", (data) => {
    const args = parseRESP(data.toString());
      const command = args[0].toUpperCase();
    switch (command) {
      case "PING":
        connection.write("+PONG\r\n");
        break;
      case "ECHO":
        const msg = args[1];
        connection.write(`$${msg.length}\r\n${msg}\r\n`);
        break;
      default:
        connection.write("-ERR unknown command\r\n");
    }
  });
  // Handle connection
});

server.listen(6379, "127.0.0.1");
