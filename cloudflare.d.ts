type Fetcher = { fetch(input: Request): Promise<Response> };
type D1Database = any;
type R2ObjectBody = { body: ReadableStream<Uint8Array>; size: number };
type R2Bucket = {
  put(key: string, value: ReadableStream<Uint8Array>, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  get(key: string): Promise<R2ObjectBody | null>;
  delete(key: string): Promise<void>;
};

declare module "cloudflare:workers" {
  export const env: { DB: D1Database; BUCKET: R2Bucket };
}
