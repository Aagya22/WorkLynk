import crypto from 'crypto';

const getEncryptionKey = (): Buffer => {
  const secret = process.env.ENCRYPTION_KEY || 'worklynk_local_fallback_encryption_key_2026';
  // Standardize the key to exactly 32 bytes using SHA-256
  return crypto.createHash('sha256').update(secret).digest();
};


export const encrypt = (text: string): string => {
  if (!text) return '';

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // GCM standard IV size is 12 bytes
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};


export const decrypt = (cipherText: string): string => {
  if (!cipherText) return '';

  try {
    const parts = cipherText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid ciphertext format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = Buffer.from(parts[2], 'hex');

    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.error('[crypto]: Decryption failed:', err);
    return 'DECRYPTION_ERROR';
  }
};
