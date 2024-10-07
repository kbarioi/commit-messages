let title;
let value;

title = "Make PR";

try {
  const ticketNumber = `CLOUDHUB-${data.ticketNumber}`;
  const descHead = `"[${ticketNumber}](https://imdexdev.atlassian.net/browse/${ticketNumber}) ${data.ticketSummary}"`;
  const desc = data["should use body"]
    ? data.body
        .split("|")
        .filter(Boolean)
        .map((x) => `"- ${x.trim()}"`)
        .join("\n")
    : [
        `$(git log --cherry kb-${ticketNumber} ^main --pretty="%s" | ForEach-Object { "- $_" })`,
      ];
  const footer = [" ", " ", `#${data.workItem}`].map((x) => `"${x}"`).join(" ");
  value = [
    "az repos pr create",
    data["is draft"] ? "--draft" : "",
    `--work-items "${data.workItem}"`,
    '--output "table"',
    "--open", // open the browser
    `--source-branch "kb-${ticketNumber}"`,
    '--target-branch "main"',
    `--title "main [${data.epic}] ${data.title
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
  value,
};
