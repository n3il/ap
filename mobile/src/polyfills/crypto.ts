// Crypto polyfill for React Native environments
// This must be imported after react-native-get-random-values
import { Buffer } from "buffer";

// Ensure crypto object exists
if (typeof globalThis.crypto === "undefined") {
  // @ts-expect-error - injecting into global scope
  globalThis.crypto = {};
}

// react-native-get-random-values should have set up getRandomValues
// but we'll ensure it exists
if (!globalThis.crypto.getRandomValues) {
  throw new Error(
    "crypto.getRandomValues not found. Ensure react-native-get-random-values is imported before this polyfill."
  );
}

// Add randomUUID using getRandomValues
if (!globalThis.crypto.randomUUID) {
  globalThis.crypto.randomUUID = (): string => {
    // Generate random bytes
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);

    // Set version (4) and variant bits
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    // Convert to UUID string format
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  };
}

// Add a minimal crypto.subtle implementation
// This is a basic polyfill that may need to be extended based on Privy's requirements
if (!globalThis.crypto.subtle) {
  // @ts-expect-error - partial implementation
  globalThis.crypto.subtle = {
    // Minimal digest implementation - may need to use expo-crypto if this doesn't work
    digest: async (
      algorithm: AlgorithmIdentifier,
      data: BufferSource
    ): Promise<ArrayBuffer> => {
      // For now, we'll import expo-crypto dynamically to avoid import-time issues
      const ExpoCrypto = require("expo-crypto");

      let digestAlgorithm: any;
      if (typeof algorithm === "string") {
        const alg = algorithm.toUpperCase().replace("-", "");
        switch (alg) {
          case "SHA1":
            digestAlgorithm = ExpoCrypto.CryptoDigestAlgorithm.SHA1;
            break;
          case "SHA256":
            digestAlgorithm = ExpoCrypto.CryptoDigestAlgorithm.SHA256;
            break;
          case "SHA384":
            digestAlgorithm = ExpoCrypto.CryptoDigestAlgorithm.SHA384;
            break;
          case "SHA512":
            digestAlgorithm = ExpoCrypto.CryptoDigestAlgorithm.SHA512;
            break;
          default:
            throw new Error(`Unsupported algorithm: ${algorithm}`);
        }
      } else {
        throw new Error("Algorithm object not supported");
      }

      // Convert BufferSource to Uint8Array
      let uint8: Uint8Array;
      if (data instanceof ArrayBuffer) {
        uint8 = new Uint8Array(data);
      } else if (ArrayBuffer.isView(data)) {
        uint8 = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      } else {
        throw new Error("Unsupported data type");
      }

      // Convert to base64 for expo-crypto
      const base64 = Buffer.from(uint8).toString("base64");

      // Get digest
      const digest = await ExpoCrypto.digestStringAsync(
        digestAlgorithm,
        base64,
        { encoding: ExpoCrypto.CryptoEncoding.HEX }
      );

      // Convert hex string to ArrayBuffer
      const bytes = new Uint8Array(
        digest.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? []
      );
      return bytes.buffer;
    },
  };
}
