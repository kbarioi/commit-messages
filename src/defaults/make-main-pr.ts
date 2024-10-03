let title;
let value;

title = "Make Main PR";

try {
  const ticketNumber = `CLOUDHUB-${config.ticketNumber}`;
  const descHead = `"[${ticketNumber}](https://imdexdev.atlassian.net/browse/${ticketNumber}) ${config.ticketSummary}"`;
  const desc = checks["should use body"]
    ? config.body
        .split("|")
        .filter(Boolean)
        .map((x) => `"- ${x.trim()}"`)
        .join("\n")
    : [
        `$(git log --cherry kb-${ticketNumber} ^main --pretty="%s" | ForEach-Object { "- $_" })`,
      ];
  const footer = [" ", " ", `#${config.workItem}`]
    .map((x) => `"${x}"`)
    .join(" ");
  value = [
    "az repos pr create",
    checks["is draft"] ? "--draft" : "",
    `--work-items "${config.workItem}"`,
    '--output "table"',
    "--open", // open the browser
    `--source-branch "kb-${ticketNumber}"`,
    '--target-branch "main"',
    `--title "main [${config.epic}] ${config.title
      .replace("asdf", ticketNumber)
      .replace("arst", ticketNumber)}"`,
    `--description ${descHead} ${desc} ${footer}`,
  ]
    .filter(Boolean)
    .join(" ");
} catch (e) {
  console.log(e);
}

return {
  title,
  value: value,
};
