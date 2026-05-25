import { encryptMessage, decryptMessage } from '@/lib/crypto/messages';

describe('Crypto Messages E2E', () => {
  let keyPair: CryptoKeyPair;

  beforeAll(async () => {
    // Generate an RSA-OAEP key pair for testing
    keyPair = await globalThis.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );
  });

  it('should encrypt and decrypt a message successfully', async () => {
    const plaintext = "Hello, this is a secret message!";
    
    // Encrypt
    const encryptedPayload = await encryptMessage(
      plaintext,
      keyPair.publicKey, // recipient
      keyPair.publicKey  // sender
    );

    expect(encryptedPayload.ciphertext).toBeDefined();
    expect(encryptedPayload.encryptedKey).toBeDefined();
    expect(encryptedPayload.encryptedKeyForSender).toBeDefined();
    expect(encryptedPayload.iv).toBeDefined();

    // Decrypt as recipient
    const decryptedText = await decryptMessage(encryptedPayload, keyPair.privateKey);

    expect(decryptedText).toBe(plaintext);
  });

  it('should fail to decrypt with an invalid private key', async () => {
    const plaintext = "Another secret";
    
    // Encrypt
    const encryptedPayload = await encryptMessage(
      plaintext,
      keyPair.publicKey,
      keyPair.publicKey
    );

    // Generate a completely different key
    const wrongKeyPair = await globalThis.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );

    // Try to decrypt with wrong key, it should throw an OperationError
    await expect(decryptMessage(encryptedPayload, wrongKeyPair.privateKey))
      .rejects.toThrow();
  });
});
