import { registerRootComponent } from "expo";
import { createElement } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import App from "./App";

registerRootComponent(() =>
  createElement(SafeAreaProvider, null, createElement(App))
);
