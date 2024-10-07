let title;
let value;
let preview;

title = "Make PR";

const branch = data["is main"] ? "main" : "sprint";
const sourceBranch = data["is main"]
  ? `kb-${data.ticketNumber}`
  : `sprint/kb-${data.ticketNumber}`;
const targetBranch = data["is main"]
  ? "main"
  : `feat/r${new Date().getFullYear()}-${data.sprint}`;
const ticketNumber = `${data.ticketNumber}`;
const ticketTitle = data.title
  .replace("asdf", ticketNumber)
  .replace("arst", ticketNumber);
const epic = data.epic ? `[${data.epic.split(" ").slice(0, 2).join(" ")}]` : "";

const descHead = `# [${ticketNumber}](https://imdexdev.atlassian.net/browse/${ticketNumber}) ${data.summary}`;
const desc = data.body
  .split("|")
  .filter(Boolean)
  .map((x) => `- ${x.trim()}`);

const footer = ["\n", "\n", `#${data.workItem}`];

const valueDesc = [descHead]
  .concat(desc, footer)
  .map((x) => `"${x.trim()}"`)
  .join(" ");

value = [
  "az repos pr create",
  data["is draft"] ? "--draft" : "",
  `--work-items "${data.workItem}"`,
  '--output "table"',
  "--open", // open the browser
  `--source-branch "${sourceBranch}"`,
  `--target-branch "${targetBranch}"`,
  `--title "${branch} ${epic} ${ticketTitle}"`,
  `--description ${valueDesc}`,
]
  .filter(Boolean)
  .join(" ");

preview = [descHead].concat(desc, footer).join("\n\n");

return {
  title,
  value,
  preview,
};
