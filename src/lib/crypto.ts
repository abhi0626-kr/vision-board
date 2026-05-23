// Minimal client-side encryption helpers using Web Crypto API
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(base64: string) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function deriveKeyFromPassword(password: string, salt: Uint8Array) {
  const passKey = await crypto.subtle.importKey('raw', encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 120_000,
      hash: 'SHA-256',
    },
    passKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  return key;
}

export async function encryptString(plaintext: string, password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyFromPassword(password, salt);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(plaintext)));

  return {
    version: 1,
    encrypted: true,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(ciphertext),
  };
}

export async function decryptString(blob: { salt: string; iv: string; ciphertext: string; version?: number }, password: string) {
  if (!blob || !blob.salt || !blob.iv || !blob.ciphertext) throw new Error('Malformed encrypted payload');
  const salt = fromBase64(blob.salt);
  const iv = fromBase64(blob.iv);
  const ciphertext = fromBase64(blob.ciphertext);
  const key = await deriveKeyFromPassword(password, salt);
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return decoder.decode(new Uint8Array(plainBuf));
}

export function isEncryptedContent(obj: unknown): obj is { encrypted: true; salt: string; iv: string; ciphertext: string } {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as any;
  return o.encrypted === true && typeof o.salt === 'string' && typeof o.iv === 'string' && typeof o.ciphertext === 'string';
}
