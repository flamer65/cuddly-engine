import { listStore } from "../store";
import { integer, nullBulk, respArray } from "../resp";
import * as net from "net";

export function handleRpush(args: string[], connection: net.Socket){
    const key = args[1];
    if(!listStore.has(key)) listStore.set(key, [])
    const list = listStore.get(key)!;
    for (let i = 2; i < args.length; i++) {
    list.push(args[i]);
  }
  connection.write(integer(list.length));
}

export function handleLpush(args: string[], connection: net.Socket){
    const key = args[1];
    if(!listStore.has(key)) listStore.set(key, [])
    const list = listStore.get(key)!;
    for (let i = 2; i < args.length; i++) {
    list.unshift(args[i]);
  }
  connection.write(integer(list.length));
}
export function handleLrange(args: string[], connection: net.Socket){
    const key = args[1];
    const list = listStore.get(key) || [];
   
    let start = parseInt(args[2]);
    let end = parseInt(args[3]);
    if(start < 0) start = Math.max(list.length + start, 0);
    if(end < 0) end = list.length + end;

    const slice = list.slice(start, end + 1);
    connection.write(respArray(slice));
}

export function handleLlen(args: string[], connection: net.Socket){
    const key = args[1];
    const list = listStore.get(key) || [];
    connection.write(integer(list.length));
}
