import * as SecureStore from 'expo-secure-store';

/**
 * Custom storage adapter for Supabase auth using expo-secure-store
 * Handles large values by chunking them into 2KB pieces
 */
const SUPABASE_SESSION_KEY = 'supabase_session';
const CHUNK_SIZE = 2048; // SecureStore limit

/**
 * Split a large string into chunks
 */
const chunkString = (str, size) => {
  const chunks = [];
  for (let i = 0; i < str.length; i += size) {
    chunks.push(str.slice(i, i + size));
  }
  return chunks;
};

/**
 * Clear all chunks for a key
 */
const clearChunks = async (baseKey) => {
  let i = 0;
  while (true) {
    try {
      const chunkKey = `${baseKey}_chunk_${i}`;
      const exists = await SecureStore.getItemAsync(chunkKey);
      if (!exists) break;
      await SecureStore.deleteItemAsync(chunkKey);
      i++;
    } catch {
      break;
    }
  }
};

export const authStorage = {
  getItem: async (key) => {
    try {
      // Try to get the count of chunks
      const chunkCount = await SecureStore.getItemAsync(`${SUPABASE_SESSION_KEY}_count`);

      if (!chunkCount) {
        // Fallback: try to get single value (backward compatibility)
        return await SecureStore.getItemAsync(SUPABASE_SESSION_KEY);
      }

      // Reassemble chunks
      const chunks = [];
      const count = parseInt(chunkCount, 10);

      for (let i = 0; i < count; i++) {
        const chunk = await SecureStore.getItemAsync(`${SUPABASE_SESSION_KEY}_chunk_${i}`);
        if (chunk) {
          chunks.push(chunk);
        }
      }

      return chunks.length > 0 ? chunks.join('') : null;
    } catch (error) {
      return null;
    }
  },

  setItem: async (key, value) => {
    try {
      // Clear any existing chunks first
      await clearChunks(SUPABASE_SESSION_KEY);
      await SecureStore.deleteItemAsync(`${SUPABASE_SESSION_KEY}_count`);

      // If value is small enough, store directly
      if (value.length <= CHUNK_SIZE) {
        await SecureStore.setItemAsync(SUPABASE_SESSION_KEY, value);
        return;
      }

      // Split into chunks
      const chunks = chunkString(value, CHUNK_SIZE);

      // Store each chunk
      for (let i = 0; i < chunks.length; i++) {
        await SecureStore.setItemAsync(`${SUPABASE_SESSION_KEY}_chunk_${i}`, chunks[i]);
      }

      // Store the count
      await SecureStore.setItemAsync(`${SUPABASE_SESSION_KEY}_count`, chunks.length.toString());
    } catch (error) {
      throw error
    }
  },

  removeItem: async (key) => {
    try {
      // Remove all chunks
      await clearChunks(SUPABASE_SESSION_KEY);
      await SecureStore.deleteItemAsync(`${SUPABASE_SESSION_KEY}_count`);
      await SecureStore.deleteItemAsync(SUPABASE_SESSION_KEY);
    } catch (error) {
      throw error
    }
  },
};
