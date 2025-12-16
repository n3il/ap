// Custom entry point to ensure polyfills are loaded first
import { Buffer } from "buffer";
global.Buffer = Buffer;

import "fast-text-encoding";
import "react-native-get-random-values";
import "./src/polyfills/crypto";
import "@ethersproject/shims";
import "event-target-polyfill";
import "./src/polyfills/domException";

// Now load the Expo Router entry
import "expo-router/entry";
