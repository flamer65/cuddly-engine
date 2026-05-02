export const stringStore = new Map<string, {value: string, expiresAt: number | null}>();
export const listStore = new Map<string, string[]>();

// Queue of BLPOP waiters per key. Each waiter is a resolve callback.
export const blpopWaiters = new Map<string, Array<(value: string) => void>>();