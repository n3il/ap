import * as SecureStore from 'expo-secure-store';

/**
 * General-purpose secure storage utility using expo-secure-store
 * Provides encrypted storage for sensitive data on the device
 */

/**
 * Securely save a value to device storage
 * @param {string} key - The key to store the value under
 * @param {string} value - The value to store (must be a string)
 * @returns {Promise<void>}
 */
export async function setSecureItem(key, value) {
  try {
    if (!key || typeof key !== 'string') {
      throw new Error('Key must be a non-empty string');
    }
    if (typeof value !== 'string') {
      throw new Error('Value must be a string');
    }
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error(`Error saving item with key "${key}":`, error);
    throw error;
  }
}

/**
 * Retrieve a value from secure storage
 * @param {string} key - The key to retrieve
 * @returns {Promise<string|null>} The stored value or null if not found
 */
export async function getSecureItem(key) {
  try {
    if (!key || typeof key !== 'string') {
      throw new Error('Key must be a non-empty string');
    }
    const value = await SecureStore.getItemAsync(key);
    return value;
  } catch (error) {
    console.error(`Error retrieving item with key "${key}":`, error);
    return null;
  }
}

/**
 * Delete a value from secure storage
 * @param {string} key - The key to delete
 * @returns {Promise<void>}
 */
export async function deleteSecureItem(key) {
  try {
    if (!key || typeof key !== 'string') {
      throw new Error('Key must be a non-empty string');
    }
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error(`Error deleting item with key "${key}":`, error);
    throw error;
  }
}

/**
 * Store a JSON object securely (automatically stringifies)
 * @param {string} key - The key to store the object under
 * @param {Object} object - The object to store
 * @returns {Promise<void>}
 */
export async function setSecureObject(key, object) {
  try {
    const jsonString = JSON.stringify(object);
    await setSecureItem(key, jsonString);
  } catch (error) {
    console.error(`Error saving object with key "${key}":`, error);
    throw error;
  }
}

/**
 * Retrieve a JSON object from secure storage (automatically parses)
 * @param {string} key - The key to retrieve
 * @returns {Promise<Object|null>} The parsed object or null if not found
 */
export async function getSecureObject(key) {
  try {
    const jsonString = await getSecureItem(key);
    if (!jsonString) return null;
    return JSON.parse(jsonString);
  } catch (error) {
    console.error(`Error retrieving object with key "${key}":`, error);
    return null;
  }
}

// Common storage keys for the app
export const STORAGE_KEYS = {
  API_KEY: 'api_key',
  USER_SETTINGS: 'user_settings',
  AUTH_TOKEN: 'auth_token',
};
