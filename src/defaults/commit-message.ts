let title;
let value;
let preview;

title = "Commit Message";

try {
  const ticketNumber = `${data.ticketNumber}`;
  const title = `${data.type}(${ticketNumber}:${data.components}): ${data.title}`;
  const body = data["should use body"]
    ? data.body
        .split("|")
        .filter(Boolean)
        .map((x) => `${x.trim()}`)
        .join("\n")
    : [
        `$(git log --cherry kb-CLOUDHUB-${data.ticketNumber} ^main --pretty="%s" | ForEach-Object { "- $_" })`,
      ];
  const footer = [
    `\n#${data.workItem} [${ticketNumber}](https://imdexdev.atlassian.net/browse/${ticketNumber})`,
  ];
  value = [title].concat(body, footer).join("\n\n");
} catch (e) {
  console.log({ tryError: e });
}

return {
  title,
  value,
  preview,
};
