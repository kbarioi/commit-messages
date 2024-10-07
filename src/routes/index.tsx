import { clientOnly } from "@solidjs/start";
import { type Component } from "solid-js";
const Index = clientOnly(() => import("../components/index"));

const App: Component = () => {
  return <Index />;
};

export default App;
