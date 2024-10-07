import { Accordion } from "@kobalte/core/accordion";
import { Button } from "@kobalte/core/button";
import { Checkbox } from "@kobalte/core/checkbox";
import { Tabs } from "@kobalte/core/tabs";
import { TextField } from "@kobalte/core/text-field";
import { Title } from "@solidjs/meta";
import { clientOnly } from "@solidjs/start";
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  ParentComponent,
  Resource,
  Suspense,
  type Component,
} from "solid-js";
import { getCookie, setCookie } from "vinxi/http";
const Index = clientOnly(() => import("../components/index"));

const App: Component = () => {
  return <Index />
};

export default App;
