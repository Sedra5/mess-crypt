import { deriveKeyFromPhrase, encryptPrivateKey, decryptPrivateKey } from '@/lib/crypto/recovery';

describe('Crypto Recovery (12 words / PIN)', () => {
  let privateKey: CryptoKey;

  beforeAll(async () => {
    // Generate a dummy RSA-OAEP private key for testing
    const keyPair = await globalThis.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );
    privateKey = keyPair.privateKey;
  });

  it('deriveKeyFromPhrase should generate the same PBKDF2 key for identical phrases', async () => {
    const phrase1 = "festival informer immobile onduler nouveau";
    const phrase2 = "festival informer immobile onduler nouveau";
    
    const key1 = await deriveKeyFromPhrase(phrase1);
    const key2 = await deriveKeyFromPhrase(phrase2);
    
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const data = new TextEncoder().encode("secret message");
    
    // Encrypt with key1, decrypt with key2
    const ciphertext = await globalThis.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key1, data);
    const decrypted = await globalThis.crypto.subtle.decrypt({ name: "AES-GCM", iv }, key2, ciphertext);
    
    expect(new TextDecoder().decode(decrypted)).toBe("secret message");
  });

  it('encryptPrivateKey and decryptPrivateKey should work in a full round trip', async () => {
    const phrase = "festival informer immobile onduler nouveau gronder crucial épaule phobie teneur effusion citerne";
    const phraseKey = await deriveKeyFromPhrase(phrase);
    
    // Encrypt
    const encryptedBase64 = await encryptPrivateKey(privateKey, phraseKey);
    expect(encryptedBase64).toBeDefined();
    expect(typeof encryptedBase64).toBe("string");

    // Decrypt
    const decryptedKey = await decryptPrivateKey(encryptedBase64, phraseKey);
    expect(decryptedKey.type).toBe("private");
    expect(decryptedKey.algorithm.name).toBe("RSA-OAEP");
  });

  it('decryptPrivateKey should throw OperationError if wrong phrase is used', async () => {
    const phrase = "correct phrase here";
    const wrongPhrase = "wrong phrase here";
    
    const phraseKey = await deriveKeyFromPhrase(phrase);
    const wrongPhraseKey = await deriveKeyFromPhrase(wrongPhrase);
    
    const encryptedBase64 = await encryptPrivateKey(privateKey, phraseKey);

    await expect(decryptPrivateKey(encryptedBase64, wrongPhraseKey))
      .rejects
      .toThrow();
  });
});
