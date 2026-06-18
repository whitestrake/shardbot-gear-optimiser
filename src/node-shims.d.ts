/// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
  }
}

declare class Buffer extends Uint8Array {
  static from(input: string, encoding?: string): Buffer;
  static alloc(size: number, fill?: string | number, encoding?: string): Buffer;
}

declare module 'node:*' {
  const value: any;
  export = value;
}

interface ImportMeta {
  glob<T = unknown>(
    pattern: string,
    options?: {
      eager?: boolean;
      query?: string;
      import?: string;
    },
  ): Record<string, T>;
}
