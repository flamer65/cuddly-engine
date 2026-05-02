export const commandsParser = (data: Buffer) => {
 return data.toString().split("\r\n").filter((c) => !c.startsWith("*") && !c.startsWith("$") && c !== "");
}

export const writeRESPSimpleString = (data: string):string =>{
     return `+${data}\r\n`;
}
export const writeRESPBulkString = (data: string):string =>{
     return `$${data.length}\r\n${data}\r\n`;
}
export const nullBulk = (): string => `$-1\r\n`;
export const integer = (n: number): string => `:${n}\r\n`;
export const respArray = (items: string[]): string => {
  // Encode an array of bulk strings
  let result = `*${items.length}\r\n`;
  for (const item of items) {
    result += writeRESPBulkString(item);
  }
  return result;
};