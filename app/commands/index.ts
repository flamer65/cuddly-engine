import { writeRESPSimpleString, writeRESPBulkString } from "../resp";
import { handleSet, handleGet } from "./strings";
import { handleRpush, handleLpush, handleLrange, handleLlen, handleRpop, handleLpop } from "./lists";
import * as net from "net";

export function dispatch(args: string[], connection: net.Socket) {
  const command = args[0].toUpperCase();

  switch (command) {
    case "PING":
      connection.write(writeRESPSimpleString("PONG"));
      break;
    case "ECHO":
      connection.write(writeRESPBulkString(args[1]));
      break;
    case "SET":
      handleSet(args, connection);
      break;
    case "GET":
      handleGet(args, connection);
      break;
    case "RPUSH":
      handleRpush(args, connection);
      break;
    case "LPUSH":
      handleLpush(args, connection);
      break;
    case "LRANGE":
      handleLrange(args, connection);
      break;
    case "LLEN":
      handleLlen(args, connection);
      break;
    case "RPOP":
      handleRpop(args, connection);
      break;
    case "LPOP":
      handleLpop(args, connection);
      break;
    default:
      connection.write("-ERR unknown command\r\n");
  }
}
