let title;
let value;
let preview;

title = "Create Branch";

try {
  const sprintBranch = `feat/r${new Date().getFullYear()}-${data.sprint}`;
  const checkout = [
    `git checkout`,
    data["create new branch"] ? "-b" : "",
    `${data["is main"] ? "" : "sprint/"}kb-${data.ticketNumber}`,
  ]
    .filter(Boolean)
    .join(" ");
  const cherryPickAll = `git cherry-pick kb-${data.ticketNumber} ^main`;
  const cherryPickLast = `git cherry-pick $(git log --cherry kb-${data.ticketNumber} ^main --pretty="%H" -n )                                  `;

  value = [
    `git checkout main && git pull`,
    data["is main"] ? "" : `git checkout ${sprintBranch} && git pull`,
    checkout,
    data["is main"]
      ? ""
      : data["cherry-pick all"]
      ? cherryPickAll
      : cherryPickLast,
    `git push`,
  ]
    .filter(Boolean)
    .join("\n");
} catch (e) {
  console.log(e);
}

return {
  title,
  value,
  preview,
};
