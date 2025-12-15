import { createClient } from "@dynamic-labs/client";
import { ReactNativeExtension } from "@dynamic-labs/react-native-extension";
import { ViemExtension } from "@dynamic-labs/viem-extension";
import { SolanaExtension } from "@dynamic-labs/solana-extension";
import { ZeroDevExtension } from "@dynamic-labs/zerodev-extension";

export const dynamicClient = createClient({
  environmentId: "6423dab0-3d26-4f29-aefb-e208d6adc228",
  // Optional:
  appLogoUrl: "https://demo.dynamic.xyz/favicon-32x32.png",
  appName: "Dynamic Demo",
})
  .extend(ReactNativeExtension())
  .extend(ViemExtension())
  .extend(SolanaExtension())
  .extend(ZeroDevExtension());

// TODO: Check if I need to fix file resolution error by following
// https://docs.dynamic.xyz/react-native/account-abstraction#resolve-file-resolution-error-optional

