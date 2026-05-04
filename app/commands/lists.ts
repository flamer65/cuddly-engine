import { listStore, blpopWaiters } from "../store";
import { integer, nullBulk, respArray, writeRESPBulkString } from "../resp";
import * as net from "net";
import { waitForDebugger } from "inspector";
type waiter = (value: string) => void;
export function handleRpush(args: string[], connection: net.Socket) {
  const key = args[1];
  if (!listStore.has(key)) listStore.set(key, []);
  const list = listStore.get(key)!;
  for (let i = 2; i < args.length; i++) {
    list.push(args[i]);

    // Notify any BLPOP waiters for this key immediately per element
    const waiters = blpopWaiters.get(key);
    if (waiters && waiters.length > 0) {
      const workerResolve = waiters.shift()!;
      const value = list.shift()!;
      workerResolve(value);
    }
  }
  connection.write(integer(list.length));
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

export async function handleBLPop(
  args: string[],
  connection: net.Socket,
): Promise<string | null> {
  const key = args[1];
  const timeout = parseFloat(args[2]);
  if (!blpopWaiters.has(key)) blpopWaiters.set(key, []);
  const list = listStore.get(key) || [];
  if (list.length > 0) {
    const value = list.shift()!;
    connection.write(respArray([key, value]));
    return value;
  }
  let resolved = false;
  return new Promise<string>((resolve) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const workerPromise: waiter = (value: string) => {
      if (resolved) return;
      resolved = true;
      if (timer) clearTimeout(timer);
      connection.write(respArray([key, value]));
      resolve(value);
    };
    blpopWaiters.get(key)!.push(workerPromise as any);
    // If timeout > 0, set a timer to give up
    if (timeout > 0) {
      timer = setTimeout(() => {
        if (resolved) return;
        resolved = true;
          const waiter = blpopWaiters.get(key);
          if (waiter) {
            const idx = waiter.indexOf(workerPromise as any);
            if (idx !== -1) {
              waiter.splice(idx, 1);
            }
          }
          connection.write(nullBulk());
      }, timeout * 1000);
    }
  });
}

// function handleGet(args: string[], connection: net.Socket){
//   const key = args[1];
//   for(let key in listStore){

//   }
// }
