let title;
let value;

title = "Commit Message";

try {
  const ticketNumber = `CLOUDHUB-${data.ticketNumber}`;
  const title = `${data.title
    .replace("asdf", `${ticketNumber}`)
    .replace("arst", `${ticketNumber}`)}`;
  const body = data["should use body"]
    ? data.body
        .split("|")
        .filter(Boolean)
        .map((x) => x.trim())
        .join("\n")
    : [
        `$(git log --cherry kb-CLOUDHUB-${data.ticketNumber} ^main --pretty="%s" | ForEach-Object { "- $_" })`,
      ];
  const footer = [
    " ",
    `#${data.workItem} [${ticketNumber}](https://imdexdev.atlassian.net/browse/${ticketNumber})`,
  ];
  value = [title].concat(body, footer).join("\n\n");
} catch (e) {
  console.log(e);
}

return {
  title,
  value,
};
