let title;
let value;
let preview;

title = "Create Branch";

try {
  const sprintBranch = `feat/r${new Date().getFullYear()}-${data.sprint}`;
  const checkout = [
    `git checkout`,
    data["create new branch"] ? "-b" : "",
    `sprint/kb-${data.ticketNumber}`,
  ].join(" ");
  const cherryPickAll = `git cherry-pick kb-${data.ticketNumber} ^main`;
  const cherryPickLast = `git cherry-pick $(git log --cherry kb-${data.ticketNumber} ^main --pretty="%H" -n )                                  `;

  value = [
    `git checkout main && git pull`,
    `git checkout ${sprintBranch} && git pull`,
    checkout,
    data["cherry-pick all"] ? cherryPickAll : cherryPickLast,
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
