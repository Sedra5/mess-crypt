/**
 * Utility to convert ArrayBuffer to base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Utility to convert base64 to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function deriveKeyFromPhrase(phrase: string, saltString: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(phrase),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  const salt = encoder.encode(`messenger-recovery-salt-v1-${saltString}`);
  
  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptPrivateKey(privateKey: CryptoKey, phraseKey: CryptoKey): Promise<string> {
  const privateKeyRaw = await window.crypto.subtle.exportKey("pkcs8", privateKey);

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    phraseKey,
    privateKeyRaw
  );

 
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return arrayBufferToBase64(combined.buffer);
}

export async function decryptPrivateKey(encryptedPrivateKeyBase64: string, phraseKey: CryptoKey): Promise<CryptoKey> {
  const combinedBuffer = base64ToArrayBuffer(encryptedPrivateKeyBase64);
  const combinedBytes = new Uint8Array(combinedBuffer);

  const iv = combinedBytes.slice(0, 12);
  const ciphertext = combinedBytes.slice(12);

  const privateKeyRaw = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    phraseKey,
    ciphertext.buffer
  );

 
  return await window.crypto.subtle.importKey(
    "pkcs8",
    privateKeyRaw,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true, 
    ["decrypt"]
  );
}
