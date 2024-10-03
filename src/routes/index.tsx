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
  Index,
  ParentComponent,
  Resource,
  Suspense,
  type Component,
} from "solid-js";
import { getCookie, setCookie } from "vinxi/http";

const Editor = clientOnly(() => import("../components/Editor"));

type Block = { code: string; checks: { [k: string]: boolean } };
type UserConfig = {
  body: string;
  ticketNumber: number;
  title: number;
};
type Config = UserConfig & {
  epic: string;
  workItem: number;
  sprint: number;
};

const fetchTicket = async (
  ticketNumber: string | undefined,
  username: string | undefined,
  apiKey: string | undefined
) => {
  "use server";
  const headers = new Headers({
    authorization: `Basic ${btoa(`${username}:${apiKey}`)}`,
  });
  const response = await fetch(
    `https://imdexdev.atlassian.net/rest/api/3/search?fields=summary,fixVersions,parent,assignee,customfield_13129&jql=project = "CLOUDHUB" AND Key = "CLOUDHUB-${ticketNumber}"`,
    {
      method: "GET",
      headers,
    }
  );
  return response.json();
};

const fetchActiveSprint = async (
  boardId: string | undefined,
  username: string | undefined,
  apiKey: string | undefined
) => {
  "use server";
  const headers = new Headers({
    authorization: `Basic ${btoa(`${username}:${apiKey}`)}`,
  });
  const response = await fetch(
    `https://imdexdev.atlassian.net/rest/agile/1.0/board/${boardId}/sprint?state=active`,
    {
      method: "GET",
      headers,
    }
  );
  return response.ok ? response.json() : response.text();
};

const setV = (name: string, value: string) => {
  "use server";
  setCookie(name, value, { httpOnly: true });
};
const getC = (name: string) => {
  "use server";
  return getCookie(name) || "";
};

function createCookie<T>(name: string): [Resource<T>, (value: T) => void] {
  const [res, { mutate }] = createResource<T>(
    () => JSON.parse(getC(name) || '{"value":""}').value
  );
  const setRes = (value: T) => {
    setV(name, JSON.stringify({ value }));
    mutate(() => value);
  };
  return [res, setRes];
}

const App: Component = () => {
  const [globalS, setGlobals] = createCookie<{
    apiKey: string;
    username: string;
  }>("cm-globals");
  const globalM = createMemo(() =>
    !!globalS() ? Object.entries(globalS()!) : []
  );

  const [userConfig, setUserConfig] = createCookie<UserConfig>("cm-config");

  const [ticket] = createResource(
    async () =>
      await fetchTicket(
        userConfig()?.ticketNumber.toString(),
        globalS()?.username,
        globalS()?.apiKey
      )
  );
  createEffect(() => console.log({ ticket: ticket() }));

  const [sprint] = createResource(async () => {
    const a = await fetchActiveSprint(
      "101",
      globalS()?.username,
      globalS()?.apiKey
    );
    const v = a.values[0].name.split(" ").pop();
    return v.split("-")[1];
  });
  createEffect(() => console.log({ sprint: sprint() }));

  const config = createMemo<Config>(() => ({
    ...userConfig()!,
    epic: ticket()?.issues[0].fields.parent.fields.summary,
    sprint: sprint(),
    ticketSummary: ticket()?.issues?.[0].fields.summary,
    workItem: ticket()?.issues?.[0].fields.customfield_13129,
  }));

  const [blocks, setBlocks] = createCookie<Block[]>("cm-blocks");

  const userConfigArray = createMemo(() => Object.entries(userConfig()!));
  const [addBlock, setAddBlock] = createSignal("");

  return (
    <>
      <Title>Commit Messages</Title>
      <Button
        onClick={() => {
          if (!blocks()) return;
          console.log("saving...");
          setBlocks(blocks()!);
        }}
      >
        Save
      </Button>
      <header>commit messages</header>
      <div class="flex gap-2 flex-col">
        <h1>Globals</h1>
        <Accordion collapsible class="p-2">
          <For each={globalM()}>
            {([key, value]) => (
              <Accordion.Item value={key}>
                <Accordion.Header class="accordion__item-header">
                  <Accordion.Trigger class="accordion__item-trigger">
                    {key}
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content class="accordion__item-content w-full">
                  <TextField
                    value={value}
                    onChange={(e) =>
                      setGlobals({
                        ...globalS(),
                        [key]: e,
                      })
                    }
                    class="text-field w-full"
                  >
                    <TextField.Input class="text-field__input" />
                  </TextField>
                </Accordion.Content>
              </Accordion.Item>
            )}
          </For>
        </Accordion>

        <Index each={userConfigArray()}>
          {(asdf) => (
            <TextField
              value={asdf()[1].toString()}
              onChange={(v) =>
                setUserConfig({
                  ...userConfig()!,
                  [asdf()[0]]: typeof v === "number" ? parseInt(v) : v,
                })
              }
              class="text-field"
            >
              <TextField.Label class="text-field__label">
                {asdf()[0]}
              </TextField.Label>
              <TextField.Input class="text-field__input" />
            </TextField>
          )}
        </Index>

        <TextField value={addBlock()} onChange={setAddBlock} class="text-field">
          <TextField.Label class="text-field__label">Add Block</TextField.Label>
          <TextField.Input class="text-field__input" />
        </TextField>
        <Button
          onClick={() => {
            setBlocks([
              ...blocks()!,
              {
                checks: { wrap: true },
                code: `let title;
let value;

title = "${addBlock()}"

try {
    value = "hello"
} catch (e) {
    console.log(e)
}

return {
    title,
    value: value
}`,
              },
            ]);

            setAddBlock("");
          }}
        >
          Add Block
        </Button>
      </div>
      <Suspense>
        <div class="flex flex-col gap-4 p-8">
          <Index each={blocks()}>
            {(a, idx) => (
              <Block
                globals={globalS()}
                config={config()}
                remove={() => {
                  console.log("remove");
                  setBlocks(blocks()!.filter((a, i) => i !== idx));
                }}
                setChecks={(v, b) => {
                  if (!blocks()) return;
                  setBlocks(
                    blocks()!.map((x, i) =>
                      i === idx ? { ...x, checks: { ...x.checks, [v]: b } } : x
                    )
                  );
                }}
                setCode={(code) => {
                  if (!blocks()) return;
                  setBlocks(
                    blocks()!.map((x, i) => (i === idx ? { ...x, code } : x))
                  );
                }}
                block={a()}
              />
            )}
          </Index>
        </div>
      </Suspense>
    </>
  );
};

export default App;

const Block: ParentComponent<{
  globals: { apiKey: string; username: string } | undefined;
  config: Config | undefined;
  setChecks: (...args: any[]) => void;
  setCode: (...args: any[]) => void;
  remove: () => void;
  block: Block;
}> = (props) => {
  const [newCheck, setNewCheck] = createSignal("");
  const checksArray = createMemo(() => Object.entries(props.block.checks));
  const data = createMemo(
    (prev) => {
      try {
        return new Function(
          `{ return function(globals, config, checks){ ${props.block.code} } }`
        )
          .call(null)
          .call(null, props.globals, props.config, props.block.checks);
      } catch (e) {
        console.log(e);
        return prev;
      }
    },
    { title: "", value: "", checks: {} }
  );
  return (
    <div class="p-4 bg-slate-200 border border-solid border-slate-800 rounded">
      <div class="flex gap-8">
        <h4>{data()?.title}</h4>
        <For each={checksArray()}>
          {(check) => {
            return (
              <Checkbox
                checked={check[1]}
                onChange={(a) => {
                  props.setChecks(check[0], a);
                }}
                class="checkbox"
              >
                <Checkbox.Input class="checkbox__input" />
                <Checkbox.Control class="checkbox__control">
                  <Checkbox.Indicator>x</Checkbox.Indicator>
                </Checkbox.Control>
                <Checkbox.Label class="checkbox__label">
                  {check[0]}
                </Checkbox.Label>
              </Checkbox>
            );
          }}
        </For>
        <TextField value={newCheck()} onChange={setNewCheck} class="text-field">
          <TextField.Input class="text-field__input" />
        </TextField>
        <Button onClick={() => props.setChecks(newCheck(), true)}>add</Button>
        <Button onClick={props.remove}> remove </Button>
      </div>
      <Tabs aria-label="Main navigation" class="tabs">
        <Tabs.List class="tabs__list">
          <Tabs.Trigger class="tabs__trigger" value="preview">
            Preview
          </Tabs.Trigger>
          <Tabs.Trigger class="tabs__trigger" value="code">
            Code
          </Tabs.Trigger>
          <Tabs.Indicator class="tabs__indicator" />
        </Tabs.List>
        <Tabs.Content class="tabs__content" value="preview">
          {props.block.checks.wrap ? (
            <code>{data().value}</code>
          ) : (
            <pre>{data().value}</pre>
          )}
        </Tabs.Content>
        <Tabs.Content class="tabs__content" value="code">
          <Editor onDocChange={props.setCode} code={props.block.code} />
        </Tabs.Content>
      </Tabs>
      {props.children}
    </div>
  );
};
