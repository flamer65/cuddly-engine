import { listStore } from "../store";
import { integer, nullBulk, respArray,writeRESPBulkString } from "../resp";
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

export function handleRpop(args: string[], connection: net.Socket){
    const key = args[1];
    const list = listStore.get(key);
    if(!list){
        connection.write(nullBulk());
        return;
    }
    const value = list.shift();
    if(value){
        connection.write(writeRESPBulkString(value));
    }else{
        connection.write(nullBulk());
    }
}
export function handleLpop(args: string[], connection: net.Socket){
    const key = args[1];
    const count = parseInt(args[2]) || 1;
    const list = listStore.get(key);
    const res:string[] = []
    if(list){
        for (let i = 0; i < count && list.length > 0; i++) {
            res.push(list.pop()!);
        }
        connection.write(respArray(res));
    }
}