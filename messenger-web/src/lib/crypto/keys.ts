// RSA-OAEP Key Pair Generation (2048-bit, SHA-256)
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
}

// Export public key to base64 encoded string (JWK format)
export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  const jwk = await window.crypto.subtle.exportKey("jwk", publicKey);
  return btoa(JSON.stringify(jwk));
}

// Import public key from base64 encoded string (JWK format)
export async function importPublicKey(base64Jwk: string): Promise<CryptoKey> {
  const jwk = JSON.parse(atob(base64Jwk)) as JsonWebKey;
  return await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
}

// Export private key to JWK object for storage in IndexedDB
export async function exportPrivateKey(privateKey: CryptoKey): Promise<JsonWebKey> {
  return await window.crypto.subtle.exportKey("jwk", privateKey);
}

// Import private key from JWK object (from IndexedDB)
export async function importPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"]
  );
}
