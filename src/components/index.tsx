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
  Match,
  mergeProps,
  ParentComponent,
  Resource,
  Setter,
  Show,
  Suspense,
  Switch,
  type Component,
} from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { Select } from "@kobalte/core/select";
import { c } from "vinxi/dist/types/lib/logger";

const SolidMarkdown = clientOnly(
  async () => await import("../components/asdf")
);

const Editor = clientOnly(async () => await import("../components/Editor"));

type Block = { code: string; checks: { [k: string]: boolean } };

const CODE = "cm-code";
const BLOCKS = "cm-blocks";
const USER_SECRETS = "cm-user-secrets";
const FETCH_DATA = "cm-user-config";
const BLOCK_DATA = "cm-block-data";

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

  const [addFetchDataS, setAddFetchDataS] = createSignal("");
  const [fetchDataS, setFetchDataS] = creatLocalStorage<object>(FETCH_DATA, {});
  const fetchDataArrayM = createMemo(() => Object.entries(fetchDataS() || {}));
  const fetchDataAndSecrets = createMemo(() => {
    return [
      ...Object.keys(secretsS() || {}),
      ...Object.keys(fetchDataS() || {}),
    ];
  });

  const [addBlockDataS, setAddBlockDataS] = createSignal("");
  const [blockDataS, setBlockDataS] = creatLocalStorage<object>(BLOCK_DATA, {});
  const blockDataEntriesM = createMemo(() =>
    !!blockDataS ? Object.entries(blockDataS() || {}) : []
  );
  const blockDataKeysM = createMemo(() =>
    !!blockDataS ? Object.keys(blockDataS() || {}) : []
  );

  const [code, setCode] = creatLocalStorage<string>(CODE, "");

  const scheduled = createScheduled((fn) => debounce(fn, 2500));
  type AllM = {
    code: string;
    secrets: object;
    config: object;
  };
  const allFetchDataM = createMemo<AllM>((p) => {
    if (!p) return { code: code(), secrets: secretsS(), config: fetchDataS() };

    const value = {
      code: code(),
      secrets: secretsS(),
      config: fetchDataS(),
    };

    return scheduled() ? value : p;
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
          defaultValue={["Block"]}
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
                Fetch Data
                <span class="text-xs text-slate-600">
                  Variables for fetching data and in blocks
                </span>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content class="accordion__item-content w-full p-2 ">
              <Configs
                addConfigS={addFetchDataS}
                setAddConfigS={setAddFetchDataS}
                configS={fetchDataS}
                setConfigS={setFetchDataS}
                userConfigArrayM={fetchDataArrayM}
              />
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value={"fetch"}>
            <Accordion.Header class="accordion__item-header bg-slate-100">
              <Accordion.Trigger class="accordion__item-trigger">
                Fetch Code
                <span class="text-xs text-slate-600">
                  The code that runs on the server
                </span>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content class="accordion__item-content w-full p-2 ">
              <AvailableVarsEditorWrapper
                prefix="config"
                vars={fetchDataAndSecrets()}
              >
                <Editor onDocChange={setCode} code={code()} />
              </AvailableVarsEditorWrapper>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value={"Block"}>
            <Accordion.Header class="accordion__item-header bg-slate-100">
              <Accordion.Trigger class="accordion__item-trigger">
                Block Data
                <span class="text-xs text-slate-600">
                  Variables to use in blocks (doesn't trigger a fetch)
                </span>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content class="accordion__item-content w-full p-2 ">
              <Configs
                addConfigS={addBlockDataS}
                setAddConfigS={setAddBlockDataS}
                configS={blockDataS}
                setConfigS={setBlockDataS}
                userConfigArrayM={blockDataEntriesM}
              />
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
            allM={allFetchDataM}
            blockDataS={blockDataS}
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
  blockDataS: Accessor<object>;
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
            Object.assign(
              {},
              props.data,
              props.block.checks,
              props.config,
              props.blockDataS()
            )
          );
      } catch (blockError) {
        console.log({ blockError });
        return prev;
      }
    },
    { title: "", value: "", preview: "" }
  );
  const dataGlobalVars = createMemo(() => [
    ...new Set([...props.dataGlobalVars, ...checksArray().map((a) => a[0])]),
  ]);
  const [isCheck, setIsCheck] = createSignal(false);
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
                  <Show when={!["wrap"].includes(check[0])}>
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
            setGlobalS={() => {
              //select=name?key:value,key:value
              const isSelect = newCheck().startsWith("select=");
              if (isSelect) {
                const [name, values] = newCheck().split("?");
                const key = name.split("=")[1];
                const value = values.split(",").reduce((acc, a) => {
                  const [label, value] = a.split(":");
                  acc.push({ label, value });
                  return acc;
                }, [] as { label: string; value: string }[]);
                props.setChecks(key, value);
              } else {
                props.setChecks(newCheck(), true);
              }
            }}
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
          <Show when={!!data()?.preview}>
            <Tabs.Trigger class="tabs__trigger" value="preview">
              Preview
            </Tabs.Trigger>
          </Show>
          <Tabs.Indicator class="tabs__indicator" />
        </Tabs.List>
        <Show when={!!data()?.preview}>
          <Tabs.Content class="tabs__content" value="preview">
            <SolidMarkdown children={data()?.preview} />
          </Tabs.Content>
        </Show>
        <Tabs.Content class="tabs__content" value="code">
          <AvailableVarsEditorWrapper prefix="data" vars={dataGlobalVars()}>
            <Editor onDocChange={props.setCode} code={props.block.code} />
          </AvailableVarsEditorWrapper>
        </Tabs.Content>
        <Tabs.Content class="tabs__content" value="actual">
          <div class="flex gap-4 items-start justify-between">
            {props.block.checks.wrap ? (
              <code>{data()?.value}</code>
            ) : (
              <pre>{data()?.value}</pre>
            )}
            <Button
              class=" rounded border border-solid border-slate-400 p-2"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(data()?.value);
                  console.log("Content copied to clipboard");
                  setIsCheck(true);
                  setTimeout(() => setIsCheck(false), 2000);
                } catch (err) {
                  console.error("Failed to copy: ", err);
                }
              }}
            >
              {isCheck() ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="size-6"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="m4.5 12.75 6 6 9-13.5"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="size-6"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
                  />
                </svg>
              )}
            </Button>
          </div>
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
  allM: Accessor<{ code: string; secrets: object; config: object }>;
  blockDataS: Accessor<object>;
}) => {
  const [resources] = createResource(props.allM, async (x) => {
    "use server";
    try {
      return await new Function(
        `{ return async function(config){ ${x.code} } }`
      )
        .call(null)
        .call(null, Object.assign({}, x.secrets, x.config));
    } catch (fetchError) {
      return { fetchError };
    }
  });
  createEffect(() => console.log({ resources: resources() }));

  const dataGlobalVars = createMemo(() => {
    return [
      ...new Set([
        ...Object.keys(resources() || {}),
        ...Object.keys(props.allM().config || {}),
        ...Object.keys(props.blockDataS()),
      ]),
    ];
  });
  return (
    <>
      <Add
        addS={props.addBlock}
        setS={props.setAddBlock}
        setGlobalS={(add: string) => {
          props.setBlocks([
            ...props.blocks()!,
            {
              checks: { wrap: true },
              code: `let title;
let value;
let preview;

title = "${add}"

try {
    value = "hello"
} catch (e) {
    console.log({ valueError: e })
}
    
try {
    preview = "hello"
} catch (e) {
    console.log({ previewError: e })
}

return {
    title,
    value,
    preview
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
                dataGlobalVars={dataGlobalVars()}
                config={props.allM().config}
                blockDataS={props.blockDataS}
                data={resources()}
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
