import { set, get, del } from "idb-keyval";
import { exportPrivateKey, importPrivateKey } from "./keys";

const STORE_PREFIX = "messenger_priv_key_";

/**
 * Saves the private key to IndexedDB securely.
 */
export async function savePrivateKey(userId: string, privateKey: CryptoKey): Promise<void> {
  const jwk = await exportPrivateKey(privateKey);
  await set(`${STORE_PREFIX}${userId}`, jwk);
}

/**
 * Retrieves the private key from IndexedDB.
 */
export async function getPrivateKey(userId: string): Promise<CryptoKey | null> {
  const jwk = await get<JsonWebKey>(`${STORE_PREFIX}${userId}`);
  if (!jwk) {
    return null;
  }
  return await importPrivateKey(jwk);
}

/**
 * Removes the private key from IndexedDB (e.g., on logout/device wipe).
 */
export async function deletePrivateKey(userId: string): Promise<void> {
  await del(`${STORE_PREFIX}${userId}`);
}
