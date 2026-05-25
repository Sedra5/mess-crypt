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

export interface EncryptedMessagePayload {
  ciphertext: string;
  encryptedKey: string;
  encryptedKeyForSender?: string;
  iv: string;
}

/**
 * Encrypts a plaintext message using AES-GCM and encrypts the AES key using the recipient's RSA public key.
 */
export async function encryptMessage(
  plaintext: string,
  recipientPublicKey: CryptoKey,
  senderPublicKey: CryptoKey
): Promise<EncryptedMessagePayload> {
 
  const sessionKey = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );

 
  const encoder = new TextEncoder();
  const encodedPlaintext = encoder.encode(plaintext);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const ciphertextBuf = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    sessionKey,
    encodedPlaintext
  );

 
  const exportedSessionKey = await window.crypto.subtle.exportKey("raw", sessionKey);

 
  const encryptedSessionKeyBuf = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    recipientPublicKey,
    exportedSessionKey
  );

 
  const encryptedSessionKeyForSenderBuf = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    senderPublicKey,
    exportedSessionKey
  );

 
  return {
    ciphertext: arrayBufferToBase64(ciphertextBuf),
    encryptedKey: arrayBufferToBase64(encryptedSessionKeyBuf),
    encryptedKeyForSender: arrayBufferToBase64(encryptedSessionKeyForSenderBuf),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

/**
 * Decrypts a message payload using the recipient's RSA private key to recover the AES session key.
 */
export async function decryptMessage(
  payload: EncryptedMessagePayload,
  recipientPrivateKey: CryptoKey
): Promise<string> {
   
    const encryptedKeyBuf = base64ToArrayBuffer(payload.encryptedKey);
    const ciphertextBuf = base64ToArrayBuffer(payload.ciphertext);
    const ivBuf = base64ToArrayBuffer(payload.iv);

   
    const decryptedSessionKeyRaw = await window.crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
      },
      recipientPrivateKey,
      encryptedKeyBuf
    );

   
    const sessionKey = await window.crypto.subtle.importKey(
      "raw",
      decryptedSessionKeyRaw,
      {
        name: "AES-GCM",
      },
      false,
      ["decrypt"]
    );

   
    const decryptedContentBuf = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: ivBuf,
      },
      sessionKey,
      ciphertextBuf
    );

   
    const decoder = new TextDecoder();
    return decoder.decode(decryptedContentBuf);
}
