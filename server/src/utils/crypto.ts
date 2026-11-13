import crypto from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt);

const SCRYPT_KEY_LENGTH = 64;
const SALT_BYTES = 16;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_BYTES).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, SCRYPT_KEY_LENGTH)) as Buffer;
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash || !storedHash.startsWith('scrypt$')) {
    return false;
  }
  const parts = storedHash.split('$');
  if (parts.length !== 3) return false;
  const [, salt, keyHex] = parts;
  const expectedKey = Buffer.from(keyHex, 'hex');
  const derivedKey = (await scryptAsync(password, salt, expectedKey.length)) as Buffer;
  if (expectedKey.length !== derivedKey.length) return false;
  return crypto.timingSafeEqual(expectedKey, derivedKey);
}

export function generateSecureToken(prefix: string, byteLength = 32): string {
  const random = crypto.randomBytes(byteLength).toString('hex');
  return `${prefix}_${random}`;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getTokenPrefix(token: string): string {
  return token.slice(0, 14);
}

export function computeEventDedupHash(input: {
  agentId: string;
  windowsEventId: number;
  recordId?: number | string | null;
  timestamp: string;
  computerName: string;
  channel: string;
  originalMessage: string;
}): string {
  const canonical = [
    input.agentId,
    String(input.windowsEventId),
    input.recordId !== undefined && input.recordId !== null ? String(input.recordId) : '',
    input.timestamp,
    input.computerName.toLowerCase(),
    input.channel.toLowerCase(),
    input.originalMessage
  ].join('|');

  return crypto.createHash('sha256').update(canonical).digest('hex');
}
