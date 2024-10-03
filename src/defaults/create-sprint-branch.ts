let title;
let value;

title = "Create Sprint Branch";

try {
  const ticketNumber = `CLOUDHUB-${config.ticketNumber}`;
  const sprintBranch = `feat/r-${new Date().getFullYear()}-${config.sprint}`;
  const checkout = [
    `git checkout`,
    checks["create new branch"] ? "-b" : "",
    `sprint/kb-${ticketNumber}`,
  ].join("");
  const cherryPickAll = `git cherry-pick kb-${ticketNumber} ^main`;
  const cherryPickLast = `git cherry-pick $(git log --cherry kb-${ticketNumber} ^main --pretty="%H" -n )                                  `;

  value = [
    `git checkout main && git pull`,
    `git checkout ${sprintBranch} && git pull`,
    checkout,
    checks["cherry-pick all"] ? cherryPickAll : cherryPickLast,
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
};
