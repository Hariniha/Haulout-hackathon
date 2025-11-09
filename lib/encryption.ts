/**
 * Client-side Encryption Service
 * Using Web Crypto API for AES-256-GCM
 */

/**
 * Generate encryption key
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Export key to string
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

/**
 * Import key from string
 */
export async function importKey(keyString: string): Promise<CryptoKey> {
  const keyData = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data
 */
export async function encryptData(
  data: string,
  key: CryptoKey
): Promise<{ encrypted: string; iv: string }> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    dataBuffer
  );

  return {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

/**
 * Decrypt data
 */
export async function decryptData(
  encrypted: string,
  key: CryptoKey,
  iv: string
): Promise<string> {
  const encryptedData = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  const ivData = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivData,
    },
    key,
    encryptedData
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * Generate key pair and encrypt data in one go
 */
export async function encryptDataWithNewKey(data: string): Promise<{
  encrypted: string;
  iv: string;
  key: string;
}> {
  const key = await generateEncryptionKey();
  const { encrypted, iv } = await encryptData(data, key);
  const exportedKey = await exportKey(key);

  return {
    encrypted,
    iv,
    key: exportedKey,
  };
}

/**
 * Decrypt data with key string
 */
export async function decryptDataWithKeyString(
  encrypted: string,
  keyString: string,
  iv: string
): Promise<string> {
  const key = await importKey(keyString);
  return await decryptData(encrypted, key, iv);
}
