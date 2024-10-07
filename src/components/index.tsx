import { Accordion } from "@kobalte/core/accordion";
import { Button } from "@kobalte/core/button";
import { Checkbox } from "@kobalte/core/checkbox";
import { Tabs } from "@kobalte/core/tabs";
import { TextField } from "@kobalte/core/text-field";
import { Title } from "@solidjs/meta";
import { clientOnly } from "@solidjs/start";
import {
  createScheduled,
  debounce,
  throttle,
} from "@solid-primitives/scheduled";
import {
  Accessor,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  Index,
  mergeProps,
  ParentComponent,
  Resource,
  Setter,
  Show,
  Suspense,
  type Component,
} from "solid-js";
import { createStore, reconcile } from "solid-js/store";

const SolidMarkdown = clientOnly(
  async () => await import("../components/asdf")
);

const Editor = clientOnly(async () => await import("../components/Editor"));

type Block = { code: string; checks: { [k: string]: boolean } };

// const fetchTicket = async (
//   ticketNumber: string | undefined,
//   username: string | undefined,
//   apiKey: string | undefined
// ) => {
//   "use server";
//   const headers = new Headers({
//     authorization: `Basic ${btoa(`${username}:${apiKey}`)}`,
//   });
//   const response = await fetch(
//     `https://imdexdev.atlassian.net/rest/api/3/search?fields=summary,fixVersions,parent,assignee,customfield_13129&jql=project = "CLOUDHUB" AND Key = "CLOUDHUB-${ticketNumber}"`,
//     {
//       method: "GET",
//       headers,
//     }
//   );
//   return response.json();
// };

// const fetchActiveSprint = async (
//   boardId: string | undefined,
//   username: string | undefined,
//   apiKey: string | undefined
// ) => {
//   "use server";
//   const headers = new Headers({
//     authorization: `Basic ${btoa(`${username}:${apiKey}`)}`,
//   });
//   const response = await fetch(
//     `https://imdexdev.atlassian.net/rest/agile/1.0/board/${boardId}/sprint?state=active`,
//     {
//       method: "GET",
//       headers,
//     }
//   );
//   return response.ok ? response.json() : response.text();
// };

const CODE = "cm-code";
const BLOCKS = "cm-blocks";
const USER_SECRETS = "cm-user-secrets";
const USER_CONFIG = "cm-user-config";

function creatLocalStorage<T>(
  key: string,
  initialValue?: T
): [Accessor<T | undefined>, (v: T) => void] {
  const _value: T = localStorage.getItem(key)
    ? JSON.parse(localStorage.getItem(key)!).value
    : initialValue || undefined;
  const [value, _setValue] = createSignal(_value);
  function setValue(v: T) {
    localStorage.setItem(key, JSON.stringify({ value: v }));
    _setValue(() => v);
  }
  return [value, setValue];
}

const App: Component = () => {
  const [addSecretS, setAddSecretS] = createSignal("");
  const [secretsS, setSecretsS] = creatLocalStorage<object>(USER_SECRETS, {});
  const secretsM = createMemo(() =>
    !!secretsS ? Object.entries(secretsS() || {}) : []
  );
  const [addConfigS, setAddConfigS] = createSignal("");
  const [configS, setConfigS] = creatLocalStorage<object>(USER_CONFIG, {});
  const userConfigArrayM = createMemo(() => Object.entries(configS() || {}));

  const configGlobalVars = createMemo(() => {
    return [...Object.keys(secretsS() || {}), ...Object.keys(configS() || {})];
  });

  const [code, setCode] = creatLocalStorage<string>(CODE, "");

  const scheduled = createScheduled((fn) => debounce(fn, 2500));
  type AllM = {
    code: string | undefined;
    secrets: object | undefined;
    config: object | undefined;
  };
  const allM = createMemo<AllM>((p) => {
    if (!p) return { code: code(), secrets: secretsS(), config: configS() };

    const value = {
      code: code(),
      secrets: secretsS(),
      config: configS(),
    };

    return scheduled() ? value : p;
  });

  const [resources] = createResource(allM, async (props) => {
    "use server";
    try {
      return await new Function(
        `{ return async function(config){ ${props.code} } }`
      )
        .call(null)
        .call(null, Object.assign({}, props.secrets, props.config));
    } catch (fetchError) {
      console.log({ fetchError });
    }
  });
  createEffect(() => console.log({ resources: resources() }));

  const dataGlobalVars = createMemo(() => {
    return [
      ...new Set([
        ...Object.keys(resources() || {}),
        ...Object.keys(configS() || {}),
      ]),
    ];
  });

  const [blocks, setBlocks] = creatLocalStorage<Block[]>(BLOCKS, []);
  const [addBlock, setAddBlock] = createSignal("");

  return (
    <>
      <Title>Commit Messages</Title>
      <div class="flex gap-4 flex-col p-8">
        <header>
          <h1>commit messages</h1>
        </header>

        <Accordion
          collapsible
          defaultValue={["Configs"]}
          class="p-2 rounded border-slate-400 border"
        >
          <Accordion.Item value={"Secrets"}>
            <Accordion.Header class="accordion__item-header bg-slate-100">
              <Accordion.Trigger class="accordion__item-trigger ">
                Secrets
                <span class="text-xs text-slate-600">
                  Variables to use when fetching data
                </span>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content class="accordion__item-content w-full p-2 ">
              <Secrets
                addSecretS={addSecretS}
                setAddSecretS={setAddSecretS}
                secretsS={secretsS}
                setSecretsS={setSecretsS}
                secretsM={secretsM}
              />
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value={"Configs"}>
            <Accordion.Header class="accordion__item-header bg-slate-100">
              <Accordion.Trigger class="accordion__item-trigger">
                Config
                <span class="text-xs text-slate-600">
                  Variables for fetching data and in blocks
                </span>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content class="accordion__item-content w-full p-2 ">
              <Configs
                addConfigS={addConfigS}
                setAddConfigS={setAddConfigS}
                configS={configS}
                setConfigS={setConfigS}
                userConfigArrayM={userConfigArrayM}
              />
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value={"fetch"}>
            <Accordion.Header class="accordion__item-header bg-slate-100">
              <Accordion.Trigger class="accordion__item-trigger">
                Fetch Data
                <span class="text-xs text-slate-600">
                  The code that runs on the server
                </span>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content class="accordion__item-content w-full p-2 ">
              <AvailableVarsEditorWrapper
                prefix="config"
                vars={configGlobalVars()}
              >
                <Editor onDocChange={setCode} code={code()} />
              </AvailableVarsEditorWrapper>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>

        <Section>
          <h2>
            Blocks - Write code that uses fetched data and the config from above
            to output custom text
          </h2>
          <Blocks
            addBlock={addBlock}
            setAddBlock={setAddBlock}
            blocks={blocks}
            setBlocks={setBlocks}
            configS={configS}
            resources={resources}
            dataGlobalVars={dataGlobalVars()}
          />
        </Section>
      </div>
    </>
  );
};

export default App;

const Section: ParentComponent = (props) => {
  return (
    <section class="flex flex-col gap-2 p-2 rounded border-slate-400 border-solid">
      {props.children}
    </section>
  );
};

const Block: ParentComponent<{
  config: object | undefined;
  data: object | undefined;
  setChecks: (...args: any[]) => void;
  setCode: (...args: any[]) => void;
  removeCheck: (check: string) => void;
  remove: () => void;
  block: Block;
  dataGlobalVars: string[];
}> = (props) => {
  const [newCheck, setNewCheck] = createSignal("");
  const checksArray = createMemo(() => Object.entries(props.block.checks));
  const data = createMemo(
    (prev) => {
      try {
        return new Function(`{ return function(data){ ${props.block.code} } }`)
          .call(null)
          .call(
            null,
            Object.assign({}, props.data, props.block.checks, props.config)
          );
      } catch (blockError) {
        console.log({ blockError });
        return prev;
      }
    },
    { title: "", value: "", checks: {} }
  );
  const dataGlobalVars = createMemo(() => [
    ...new Set([...props.dataGlobalVars, ...checksArray().map((a) => a[0])]),
  ]);
  return (
    <div class="p-4 bg-slate-100 border border-solid border-slate-800 rounded">
      <div class="flex justify-between">
        <div class="flex gap-4 items-center">
          <h4>{data()?.title}</h4>
          <For each={checksArray()}>
            {(check) => {
              return (
                <div class="flex items-center h-8 p-2 justify-center rounded-full gap-2 border-slate-400 border-solid border">
                  <Checkbox
                    checked={check[1]}
                    onChange={(a) => props.setChecks(check[0], a)}
                    class="checkbox"
                  >
                    <Checkbox.Input class="checkbox__input cursor-pointer" />
                    <Checkbox.Control class="checkbox__control flex items-center justify-center">
                      <Checkbox.Indicator>x</Checkbox.Indicator>
                    </Checkbox.Control>
                    <Checkbox.Label class="checkbox__label cursor-pointer">
                      {check[0]}
                    </Checkbox.Label>
                  </Checkbox>
                  <Show when={!["show preview", "wrap"].includes(check[0])}>
                    <Button
                      class="rounded-full flex items-center justify-center bg-red-500 w-4 h-4"
                      onClick={() => {
                        //remove this item from list
                        if (
                          !window.confirm("Do you really want to delete this?")
                        )
                          return;
                        props.removeCheck(check[0]);
                      }}
                    >
                      -
                    </Button>
                  </Show>
                </div>
              );
            }}
          </For>
          <Add
            addS={newCheck}
            setS={setNewCheck}
            setGlobalS={() => props.setChecks(newCheck(), true)}
            placeholder="Add Check"
          />
        </div>
        <Button onClick={props.remove}> remove </Button>
      </div>
      <Tabs aria-label="Main navigation" class="tabs">
        <Tabs.List class="tabs__list">
          <Tabs.Trigger class="tabs__trigger" value="actual">
            Actual
          </Tabs.Trigger>
          <Tabs.Trigger class="tabs__trigger" value="code">
            Code
          </Tabs.Trigger>
          <Show when={props.block.checks["show preview"]}>
            <Tabs.Trigger class="tabs__trigger" value="preview">
              Preview
            </Tabs.Trigger>
          </Show>
          <Tabs.Indicator class="tabs__indicator" />
        </Tabs.List>
        <Show when={props.block.checks["show preview"]}>
          <Tabs.Content class="tabs__content" value="preview">
            <SolidMarkdown children={data().value} />
          </Tabs.Content>
        </Show>
        <Tabs.Content class="tabs__content" value="code">
          <AvailableVarsEditorWrapper prefix="data" vars={dataGlobalVars()}>
            <Editor onDocChange={props.setCode} code={props.block.code} />
          </AvailableVarsEditorWrapper>
        </Tabs.Content>
        <Tabs.Content class="tabs__content" value="actual">
          {props.block.checks.wrap ? (
            <code>{data().value}</code>
          ) : (
            <pre>{data().value}</pre>
          )}
        </Tabs.Content>
      </Tabs>
      {props.children}
    </div>
  );
};

const Add = (props: {
  addS: Accessor<string>;
  setS: Setter<string>;
  setGlobalS: (s: string) => void;
  label?: string;
  placeholder?: string;
}) => {
  return (
    <div class=" flex gap-2 items-center ">
      <TextField value={props.addS()} onChange={props.setS} class="text-field">
        <Show when={props.label}>
          <TextField.Label class="text-field__label">
            {props.label}
          </TextField.Label>
        </Show>
        <div class="flex gap-2 items-center">
          <TextField.Input
            placeholder={props.placeholder}
            class="text-field__input"
          />
          <Button
            class="rounded-full bg-slate-400 w-8 h-8"
            onClick={() => {
              props.setGlobalS(props.addS());
              props.setS("");
            }}
          >
            +
          </Button>
        </div>
      </TextField>
    </div>
  );
};

const Secrets = (props: {
  setSecretsS(arg0: any): unknown;
  secretsS(): any;
  secretsM(): any;
  addSecretS: Accessor<string>;
  setAddSecretS: Setter<string>;
}) => {
  return (
    <>
      <Add
        addS={props.addSecretS}
        setS={props.setAddSecretS}
        setGlobalS={(s: string) => {
          props.setSecretsS({
            ...props.secretsS()!,
            [s]: "",
          });
        }}
        placeholder="Add Secret"
      />
      <Accordion collapsible class="p-2">
        <Index each={props.secretsM()}>
          {(secret) => (
            <Accordion.Item value={secret()[0]}>
              <Accordion.Header class="accordion__item-header">
                <Accordion.Trigger class="accordion__item-trigger flex justify-between items-center">
                  {secret()[0]}
                  <Button
                    class="rounded bg-red-500"
                    onClick={
                      //remove this item from list
                      () => {
                        if (
                          !window.confirm("Do you really want to delete this?")
                        )
                          return;
                        props.setSecretsS(
                          Object.fromEntries(
                            Object.entries(props.secretsS()!).filter(
                              (a) => a[0] !== secret()[0]
                            )
                          )
                        );
                      }
                    }
                  >
                    Remove
                  </Button>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content class="accordion__item-content w-full">
                <TextField
                  value={secret()[1]}
                  onChange={(e) =>
                    props.setSecretsS({
                      ...props.secretsS()!,
                      [secret()[0]]: e,
                    })
                  }
                  class="text-field w-full"
                >
                  <TextField.Input class="text-field__input" />
                </TextField>
              </Accordion.Content>
            </Accordion.Item>
          )}
        </Index>
      </Accordion>
    </>
  );
};

const Configs = (props: {
  setConfigS: any;
  configS(): any;
  userConfigArrayM(): any;
  addConfigS: Accessor<string>;
  setAddConfigS: Setter<string>;
}) => {
  return (
    <>
      <Add
        addS={props.addConfigS}
        setS={props.setAddConfigS}
        setGlobalS={(s: string) => {
          props.setConfigS({
            ...props.configS()!,
            [s]: "",
          });
        }}
        placeholder="Add Config"
      />
      <Index each={props.userConfigArrayM()}>
        {(asdf) => (
          <div class="flex gap-2 items-center">
            <TextField
              value={asdf()[1]?.toString()}
              onChange={(v) =>
                props.setConfigS({
                  ...props.configS()!,
                  [asdf()?.[0]]: typeof v === "number" ? parseInt(v) : v,
                })
              }
              class="text-field w-full"
            >
              <TextField.Label class="text-field__label">
                {asdf()?.[0]}
              </TextField.Label>
              <div class="flex items-center gap-2 w-full">
                <TextField.Input class="text-field__input w-full" />
                <Button
                  class="rounded-full bg-red-500 w-8 h-8"
                  onClick={
                    //remove this item from list
                    () => {
                      if (!window.confirm("Do you really want to delete this?"))
                        return;
                      props.setConfigS(
                        Object.fromEntries(
                          Object.entries(props.configS()!).filter(
                            (a) => a[0] !== asdf()?.[0]
                          )
                        )
                      );
                    }
                  }
                >
                  -
                </Button>
              </div>
            </TextField>
          </div>
        )}
      </Index>
    </>
  );
};

const Blocks = (props: {
  addBlock: Accessor<string>;
  setAddBlock: Setter<string>;
  blocks: Accessor<Block[] | undefined>;
  setBlocks: Setter<Block[]>;
  configS: any;
  resources: any;
  dataGlobalVars: string[];
}) => {
  return (
    <>
      <Add
        addS={props.addBlock}
        setS={props.setAddBlock}
        setGlobalS={(add: string) => {
          props.setBlocks([
            ...props.blocks()!,
            {
              checks: { wrap: true, "show preview": true },
              code: `let title;
let value;

title = "${add}"

try {
    value = "hello"
} catch (e) {
    console.log({ tryError: e })
}

return {
    title,
    value
}`,
            },
          ]);
        }}
        placeholder="Add Block"
      />
      <Suspense>
        <div class="flex flex-col gap-4">
          <Index each={props.blocks()}>
            {(a, idx) => (
              <Block
                dataGlobalVars={props.dataGlobalVars}
                config={props.configS()}
                data={props.resources()}
                remove={() => {
                  if (!window.confirm("Do you really want to delete this?"))
                    return;
                  props.setBlocks(props.blocks()!.filter((a, i) => i !== idx));
                }}
                removeCheck={(check) => {
                  if (!props.blocks) return;
                  props.setBlocks(
                    props.blocks()!.map((x, i) => {
                      if (i !== idx) return x;
                      const checks = { ...x.checks };
                      delete checks[check];
                      return { ...x, checks };
                    })
                  );
                }}
                setChecks={(v, b) => {
                  if (!props.blocks) return;
                  props.setBlocks(
                    props
                      .blocks()!
                      .map((x, i) =>
                        i === idx
                          ? { ...x, checks: { ...x.checks, [v]: b } }
                          : x
                      )
                  );
                }}
                setCode={(code) => {
                  if (!props.blocks) return;
                  props.setBlocks(
                    props
                      .blocks()!
                      .map((x, i) => (i === idx ? { ...x, code } : x))
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

const AvailableVarsEditorWrapper: ParentComponent<{
  prefix: string;
  vars: string[];
}> = (props) => {
  return (
    <div class="h-[600px] flex gap-4">
      <div class="flex flex-col gap-2">
        <span class="font-bold">Available Variables</span>
        <ul>
          <For each={props.vars}>
            {(v) => (
              <li>
                {props.prefix}["{v}"]
              </li>
            )}
          </For>
        </ul>
      </div>
      {props.children}
    </div>
  );
};
