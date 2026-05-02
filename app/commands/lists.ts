import { listStore, blpopWaiters } from "../store";
import { integer, nullBulk, respArray, writeRESPBulkString } from "../resp";
import * as net from "net";

export function handleRpush(args: string[], connection: net.Socket) {
  const key = args[1];
  if (!listStore.has(key)) listStore.set(key, []);
  const list = listStore.get(key)!;
  for (let i = 2; i < args.length; i++) {
    list.push(args[i]);
  }
  connection.write(integer(list.length));

//   Notify any BLPOP waiters for this key
  const waiters = blpopWaiters.get(key);
  while (waiters && waiters.length > 0 && list.length > 0) {
    const resolve = waiters.shift()!;
    const value = list.shift()!;
    resolve(value);
  }
}

export function handleLpush(args: string[], connection: net.Socket) {
  const key = args[1];
  if (!listStore.has(key)) listStore.set(key, []);
  const list = listStore.get(key)!;
  for (let i = 2; i < args.length; i++) {
    list.unshift(args[i]);
  }
  connection.write(integer(list.length));
}
export function handleLrange(args: string[], connection: net.Socket) {
  const key = args[1];
  const list = listStore.get(key) || [];

  let start = parseInt(args[2]);
  let end = parseInt(args[3]);
  if (start < 0) start = Math.max(list.length + start, 0);
  if (end < 0) end = list.length + end;

  const slice = list.slice(start, end + 1);
  connection.write(respArray(slice));
}

export function handleLlen(args: string[], connection: net.Socket) {
  const key = args[1];
  const list = listStore.get(key) || [];
  connection.write(integer(list.length));
}

export function handleLpop(args: string[], connection: net.Socket) {
  const key = args[1];
  const count = parseInt(args[2]) || 1;
  const list = listStore.get(key) || [];
  const res: string[] = [];
  if (count > 1 || count > list.length) {
    for (let i = 0; i < count && list.length > 0; i++) {
      res.push(list.shift()!);
    }
    connection.write(respArray(res));
  } else {
    const value = list.shift();
    if (value) {
      connection.write(writeRESPBulkString(value));
    } else {
      connection.write(nullBulk());
    }
  }
}
export function handleBLPop(args: string[], connection: net.Socket) {
  const key = args[1];
  const timeout = parseFloat(args[2]);

  // If the list already has data, pop immediately
  const list = listStore.get(key);
  if (list && list.length > 0) {
    const value = list.shift()!;
    connection.write(respArray([key, value]));
    return;
  }

  // Otherwise, register a waiter that will be resolved when RPUSH adds data
  if (!blpopWaiters.has(key)) blpopWaiters.set(key, []);

  let resolved = false;
  const waiterPromise = new Promise<string>((resolve) => {
    blpopWaiters.get(key)!.push((value: string) => {
      resolved = true;
      resolve(value);
    });

    // If timeout > 0, set a timer to give up
    if (timeout > 0) {
      setTimeout(() => {
        if (!resolved) {
          // Remove this waiter from the queue
          const waiters = blpopWaiters.get(key);
          if (waiters) {
            const idx = waiters.indexOf(resolve as any);
            if (idx !== -1) waiters.splice(idx, 1);
          }
          connection.write("*-1\r\n");
        }
      }, timeout * 1000);
    }
  });

  waiterPromise.then((value) => {
    if (resolved) {
      connection.write(respArray([key, value]));
    }
  });
}