let title;
let value;
let preview;

title = "Make PR";

const getEpic = (epic) => {
  if (!epic) return "";
  if (epic.includes("(") && epic.includes(")")) {
    return `[${epic
      .split(")")[0]
      .replace("(", "")
      .split(" ")
      .slice(0, 2)
      .filter(Boolean)
      .join(" ")}]`;
  } else {
    return `[${epic
      .split("-")[0]
      .split(" ")
      .slice(0, 2)
      .filter(Boolean)
      .join(" ")}]`;
  }
};

const branch = data["is main"] ? "main" : "sprint";
const sourceBranch = data["is main"]
  ? `kb-${data.ticketNumber}`
  : `sprint/kb-${data.ticketNumber}`;
const targetBranch = data["is main"]
  ? "main"
  : `feat/r${new Date().getFullYear()}-${data.sprint}`;
const ticketNumber = `${data.ticketNumber}`;
const epic = getEpic(data.epic);
const ticketTitle =
  `${ticketNumber} ${branch} ${epic} ${data.type}(${data.components}): ${data.title}`.replaceAll(
    '"',
    "'"
  );

const descHead =
  `# [${ticketNumber}](https://imdexdev.atlassian.net/browse/${ticketNumber}) ${data.summary}`.replaceAll(
    '"',
    "'"
  );
const desc = data.body
  .replaceAll('"', "'")
  .split("|")
  .filter(Boolean)
  .map((x) => `- ${x.trim()}`);

const footer = [" ", " ", `#${data.workItem}`];

const valueDesc = [descHead]
  .concat(desc)
  .map((x) => x.trim())
  .concat(footer)
  .map((x) => `"${x}"`)
  .join(" ");

value = [
  "az repos pr create",
  data["is draft"] ? "--draft" : "",
  data["set autocomplete"] ? "--auto-complete" : "",
  `--work-items "${data.workItem}"`,
  '--output "table"',
  "--open", // open the browser
  `--source-branch "${sourceBranch}"`,
  `--target-branch "${targetBranch}"`,
  `--title "${ticketTitle}"`,
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
