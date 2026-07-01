// Reserved for future OAuth token storage — no code path currently calls
// this, since no OAuth provider is implemented yet. Never log plaintext or
// ciphertext. ENCRYPTION_SECRET must come from environment, never hardcoded.
import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from 'crypto';

const IV_LENGTH = 12; // recommended IV length for AES-GCM
const ALGORITHM = 'aes-256-gcm';

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) throw new Error('ENCRYPTION_SECRET is not configured');
  return scryptSync(secret, 'learning-tracker-salt', 32);
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join(':');
}

export function decrypt(payload: string): string {
  const key = getKey();
  const [ivB64, authTagB64, ciphertextB64] = payload.split(':');
  if (!ivB64 || !authTagB64 || !ciphertextB64) {
    throw new Error('Invalid encrypted payload format');
  }
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const ciphertext = Buffer.from(ciphertextB64, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}
