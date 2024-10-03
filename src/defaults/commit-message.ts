let title;
let value;

title = "Commit Message";

try {
  const ticketNumber = `CLOUDHUB-${config.ticketNumber}`;
  const title = `${config.title
    .replace("asdf", `${ticketNumber}`)
    .replace("arst", `${ticketNumber}`)}`;
  const body = checks["should use body"]
    ? config.body
        .split("|")
        .filter(Boolean)
        .map((x) => x.trim())
        .join("\n")
    : [
        `$(git log --cherry kb-CLOUDHUB-${config.ticketNumber} ^main --pretty="%s" | ForEach-Object { "- $_" })`,
      ];
  const footer = [
    " ",
    `#${config.workItem} [${ticketNumber}](https://imdexdev.atlassian.net/browse/${ticketNumber})`,
  ];
  value = [title].concat(body, footer).join("\n\n");
} catch (e) {
  console.log(e);
}

return {
  title,
  value: value,
};
