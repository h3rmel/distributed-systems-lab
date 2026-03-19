declare module 'https://jslib.k6.io/k6-utils/1.2.0/index.js' {
  export function randomString(length: number, charset?: string): string;
  export function randomIntBetween(min: number, max: number): number;
  export function randomItem<T>(array: T[]): T;
  export function uuidv4(): string;
}
