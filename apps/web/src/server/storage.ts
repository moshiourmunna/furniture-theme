import 'server-only';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { env } from './env';
import { badRequest } from './http';

/** Storage adapter: `local` (disk, served at /uploads/*) now; `s3` (any S3-compatible: AWS, R2, MinIO) via env. */
export interface StorageDriver {
  put(key: string, data: Buffer, mime: string): Promise<string>; // returns public URL
  get?(key: string): Promise<Buffer | null>;
  remove(key: string): Promise<void>;
}

const localRoot = () => path.resolve(process.cwd(), env.storageLocalDir);

const local: StorageDriver = {
  async put(key, data) {
    const file = path.join(localRoot(), key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, data);
    return `/uploads/${key}`;
  },
  async get(key) {
    const file = path.resolve(localRoot(), key);
    if (!file.startsWith(localRoot() + path.sep)) return null; // path traversal guard
    try { return await readFile(file); } catch { return null; }
  },
  async remove(key) {
    try { await unlink(path.join(localRoot(), key)); } catch { /* already gone */ }
  },
};

const s3: StorageDriver = {
  async put(key, data, mime) {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const client = new S3Client({ region: process.env.S3_REGION || 'auto', endpoint: process.env.S3_ENDPOINT || undefined, credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID!, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! } });
    await client.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key, Body: data, ContentType: mime, CacheControl: 'public, max-age=31536000, immutable' }));
    return `${process.env.S3_PUBLIC_URL!.replace(/\/$/, '')}/${key}`;
  },
  async remove(key) {
    const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const client = new S3Client({ region: process.env.S3_REGION || 'auto', endpoint: process.env.S3_ENDPOINT || undefined, credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID!, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! } });
    await client.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }));
  },
};

export const storage: StorageDriver = env.storageDriver === 's3' ? s3 : local;
export const readLocalUpload = (key: string) => local.get!(key);

const ALLOWED: Record<string, { ext: string; magic: (b: Buffer) => boolean }> = {
  'image/jpeg': { ext: 'jpg', magic: (b) => b[0] === 0xff && b[1] === 0xd8 },
  'image/png': { ext: 'png', magic: (b) => b.subarray(0, 4).toString('hex') === '89504e47' },
  'image/webp': { ext: 'webp', magic: (b) => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP' },
  'image/avif': { ext: 'avif', magic: (b) => b.subarray(4, 12).toString().startsWith('ftyp') },
  'application/pdf': { ext: 'pdf', magic: (b) => b.subarray(0, 4).toString() === '%PDF' },
};
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export async function saveUpload(file: File, folder = 'media') {
  const spec = ALLOWED[file.type];
  if (!spec) throw badRequest('Unsupported file type (JPG, PNG, WebP, AVIF or PDF)');
  if (file.size > MAX_UPLOAD_BYTES) throw badRequest('File is larger than 15 MB');
  const buf = Buffer.from(await file.arrayBuffer());
  if (!spec.magic(buf)) throw badRequest('File content does not match its type');
  const d = new Date();
  const key = `${folder}/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${randomBytes(8).toString('hex')}.${spec.ext}`;
  const url = await storage.put(key, buf, file.type);
  return { key, url, mime: file.type, size: file.size };
}
