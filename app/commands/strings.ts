import { stringStore } from "../store";
import { writeRESPSimpleString, writeRESPBulkString, nullBulk } from "../resp";
import * as net from "net";

export function handleSet(args: string[], connection: net.Socket){
    const key = args[1];
    let expiresAt: number | null = null;
    if(args[3]?.toUpperCase() === "PX"){
        expiresAt = Date.now() + parseInt(args[4]);
    }else if(args[3]?.toUpperCase() === "EX"){
        expiresAt = Date.now() + parseInt(args[4]) * 1000;
    }
    stringStore.set(key, {value: args[2], expiresAt});
    connection.write(writeRESPSimpleString("OK"));
}

export function handleGet(args: string[], connection: net.Socket){
    const key = args[1];
    const value = stringStore.get(key);
    if (!value || (value.expiresAt && value.expiresAt < Date.now())) {
    stringStore.delete(key);
    connection.write(nullBulk());
  } else {
    connection.write(writeRESPBulkString(value.value));
  }
}