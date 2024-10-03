let title;
let value;

title = "Create Main Branch";

try {
  const ticketNumber = `CLOUDHUB-${config.ticketNumber}`;
  const checkout = [
    `git checkout`,
    checks["create new branch"] ? "-b" : "",
    `kb-${ticketNumber}`,
  ].join("");
  value = [`git checkout main && git pull`, checkout, `git push`]
    .filter(Boolean)
    .join("\n");
} catch (e) {
  console.log(e);
}

return {
  title,
  value: value,
};
