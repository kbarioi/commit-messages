import { Accordion } from "@kobalte/core/accordion";
import { Checkbox } from "@kobalte/core/checkbox";
import { Tabs } from "@kobalte/core/tabs";
import { TextField } from "@kobalte/core/text-field";
import { throttle } from "@solid-primitives/scheduled";
import { Title } from "@solidjs/meta";
import { cache, createAsync } from "@solidjs/router";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
// import {
//   KeyCode,
//   KeyMod,
//   languages,
//   editor as mEditor,
//   Uri,
// } from "monaco-editor";
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  Index,
  Match,
  onCleanup,
  onMount,
  ParentComponent,
  Resource,
  Signal,
  splitProps,
  Suspense,
  Switch,
  type Component,
} from "solid-js";
import { createStore, reconcile, unwrap } from "solid-js/store";
import { getCookie, setCookie } from "vinxi/http";
import { useZoom } from "~/hooks/useZoom";
import { clientOnly } from "@solidjs/start";
import { NumberField } from "@kobalte/core/number-field";
import { Button } from "@kobalte/core/button";
// import { useZoom } from "../../hooks/useZoom";
// import { liftOff } from "./setupSolid";

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

// const getUsers = cache(
//   async (
//     ticketNumber: string | undefined,
//     username: string | undefined,
//     apiKey: string | undefined
//   ) => {
//     return fetchTicket(ticketNumber, username, apiKey);
//   },
//   "users"
// );

// export const route = {
//   load: (ticketNumber: string, username: string, apiKey: string) =>
//     getUsers(ticketNumber, username, apiKey),
// };

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

  // const [title, setTitle] = createSignal(""); //createCookie<string>("cm-title");
  // const [epic, setEpic] = createSignal(""); //createCookie<string>("cm-epic");
  // const [bodyS, setBody] = createSignal(""); //createCookie<string>("cm-body");
  // const [arst, setarst] = createSignal(""); //createCookie<string>("cm-arst");
  // const [shouldUseCommitMessages, setShouldUseCommitMessages] =
  //   createSignal(true);

  // const user = createAsync(() =>
  //   getUsers(
  //     config()?.ticketNumber.toString(),
  //     globalS()?.username,
  //     globalS()?.apiKey
  //   )
  // );
  const [ticket] = createResource(
    async () =>
      await fetchTicket(
        userConfig()?.ticketNumber.toString(),
        globalS()?.username,
        globalS()?.apiKey
      )
  );
  createEffect(() => console.log(ticket()));

  const [sprint] = createResource(async () => {
    const a = await fetchActiveSprint(
      "101",
      globalS()?.username,
      globalS()?.apiKey
    );
    const v = a.values[0].name.split(" ").pop();
    return v.split("-")[1];
  });

  const config = createMemo<Config>(() => ({
    ...userConfig()!,
    sprint: sprint(),
    epic: ticket()?.issues[0].fields.parent.fields.summary,
    workItem: ticket()?.issues?.[0].fields.customfield_13129,
  }));

  const [blocks, setBlocks] = createCookie<Block[]>("cm-blocks");
  // setBlocks({
  //   blocks: [
  //     {
  //       title: "Block 1",
  //       code: '[`git checkout main && git pull`, `git checkout -b kb-CLOUDHUB-${globals?.apiKey}`,  `git push`].join("\\n")',
  //     },
  //   ],
  // });
  // const [sprint, setSprint] = createSignal(0);

  // const workItemNumber = createMemo(
  //   () => user()?.issues?.[0].fields.customfield_13129
  // );
  // const cloudhubTicket = createMemo(() => user()?.issues?.[0].key);
  // const ticketSummary = createMemo(() => user()?.issues?.[0].fields.summary);
  // const ticketLink = createMemo(
  //   () =>
  //     `[${cloudhubTicket()}](https://imdexdev.atlassian.net/browse/${cloudhubTicket()})`
  // );

  // const footer = createMemo(() => `#${workItemNumber()} ${ticketLink()}`);

  // const titleM = createMemo(
  //   () =>
  //     `${title()
  //       ?.replace("arst", cloudhubTicket())
  //       ?.replace("asdf", cloudhubTicket())}`
  // );
  // const epicM = createMemo(() => (epic() ? `[${epic()}]` : ""));

  // const desc = createMemo(() => {
  //   const title = `"${ticketLink()} ${ticketSummary()}"`;
  //   const body = shouldUseCommitMessages()
  //     ? [
  //         `$(git log --cherry kb-CLOUDHUB-${ticketNumber()} ^main --pretty="%s" | ForEach-Object { "- $_" })`,
  //       ]
  //     : bodyS()
  //         ?.split("\n")
  //         .map((x) => x.trim())
  //         .filter(Boolean)
  //         .map((x) => `"- ${x}"`) || [];
  //   const footer = [" ", " ", `#${workItemNumber()}`].map((x) => `"${x}"`);

  //   return [title].concat(body, footer).join(" ");
  // });

  // [
  //   `git checkout main && git pull`,
  //   `git checkout -b kb-CLOUDHUB-${apiKey()}`,
  //   `git push`,
  // ].join("\n")

  // const createNewMainBranch = createMemo(() => {
  //   try {
  //     return eval(arst()!);
  //   } catch (e) {
  //     return e.message;
  //   }
  // });
  // const createNewSprintBranch = createMemo(() =>
  //   [
  //     `git checkout main && git pull`,
  //     `git checkout feat/r2024-${sprint()} && git pull`,
  //     `git checkout -b sprint/kb-CLOUDHUB-${ticketNumber()}`,
  //     `git cherry-pick kb-CLOUDHUB-${ticketNumber()} ^main`,
  //     `git push`,
  //   ].join("\n")
  // );

  // const commitMessage = createMemo(() =>
  //   [`${titleM()}`, `${bodyS()}\n`, footer()]
  //     .filter((x) => x.trim())
  //     .join("\n\n")
  // );

  // const mainCommand = createMemo(() => {
  //   const commands = [
  //     "az repos pr create",
  //     "--draft",
  //     `--work-items "${workItemNumber()}"`,
  //     '--output "table"',
  //     "--open", // open the browser
  //     `--source-branch "kb-${cloudhubTicket()}"`,
  //     '--target-branch "main"',
  //     `--title "main ${epicM()} ${titleM()}"`,
  //     `--description ${desc()}`,
  //   ];
  //   return commands.join(" ");
  // });
  // const sprintCommand = createMemo(() => {
  //   const commands = [
  //     "az repos pr create",
  //     `--work-items "${workItemNumber()}"`,
  //     '--output "table"',
  //     "--open", // open the browser
  //     `--source-branch "sprint/kb-${cloudhubTicket()}"`,
  //     `--target-branch "feat/r2024-${sprint()}"`,
  //     `--title "sprint ${epicM()} ${titleM()}"`,
  //     `--description ${desc()}`,
  //   ];
  //   return commands.join(" ");
  // });

  // const config = createMemo(() => [
  //   {
  //     content: createNewMainBranch(),
  //     label: "Create Main Branch",
  //     shouldRespectNewLines: true,
  //   },
  //   {
  //     content: commitMessage(),
  //     label: "Commit Message",
  //     shouldRespectNewLines: true,
  //   },
  //   {
  //     content: mainCommand(),
  //     label: "Main PR Command",
  //     shouldRespectNewLines: false,
  //   },
  //   {
  //     content: createNewSprintBranch(),
  //     label: "Create Sprint Branch",
  //     shouldRespectNewLines: true,
  //   },
  //   {
  //     content: sprintCommand(),
  //     label: "Sprint PR Command",
  //     shouldRespectNewLines: false,
  //   },
  // ]);
  const userConfigArray = createMemo(() => Object.entries(userConfig()!));
  const [addBlock, setAddBlock] = createSignal("");

  return (
    <>
      <Title>Commit Messages</Title>
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

        {/* <TextField
          value={ticketNumber()}
          onChange={setTicketNumber}
          class="text-field"
        >
          <TextField.Label class="text-field__label">
            Ticket Number
          </TextField.Label>
          <TextField.Input class="text-field__input" />
        </TextField>

        <TextField value={title()} onChange={setTitle} class="text-field">
          <TextField.Label class="text-field__label">Title</TextField.Label>
          <TextField.Input class="text-field__input" />
        </TextField>

        <TextField value={epic()} onChange={setEpic} class="text-field">
          <TextField.Label class="text-field__label">Epic</TextField.Label>
          <TextField.Input class="text-field__input" />
        </TextField>

        <TextField value={bodyS()} onChange={setBody} class="text-field">
          <TextField.Label class="text-field__label">body</TextField.Label>
          <TextField.TextArea class="text-field__input" />
        </TextField>

        <Checkbox
          checked={shouldUseCommitMessages()}
          onChange={setShouldUseCommitMessages}
          class="checkbox"
        >
          <Checkbox.Input class="checkbox__input" />
          <Checkbox.Control class="checkbox__control">
            <Checkbox.Indicator>x</Checkbox.Indicator>
          </Checkbox.Control>
          <Checkbox.Label class="checkbox__label">
            Should use commit messages (instead use body from above)
          </Checkbox.Label>
        </Checkbox> */}
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
      {/* <Suspense>
        <Switch>
          <Match when={!!user()?.issues?.length}>
            <div class="flex flex-col gap-4 p-8">
              <For each={config()}>
                {(c) => (
                  <div class="p-4 bg-slate-200 border border-solid border-slate-800 rounded">
                    <h4>{c.label}</h4>
                    {c.shouldRespectNewLines ? (
                      <pre>{c.content}</pre>
                    ) : (
                      <code>{c.content}</code>
                    )}
                  </div>
                )}
              </For>
            </div>
          </Match>
        </Switch>
      </Suspense> */}
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
