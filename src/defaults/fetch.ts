const headers = new Headers({
  authorization: `Basic ${btoa(
    `${config["Jira Username"]}:${config["Jira API Key"]}`
  )}`,
});

const [fetchTicket, fetchSprint] = await Promise.all([
  fetch(
    `https://imdexdev.atlassian.net/rest/api/3/search?fields=summary,fixVersions,parent,assignee,components,customfield_13129&jql=project="CLOUDHUB" AND Key="CLOUDHUB-${config["Jira Ticket"]}"`,
    {
      method: "GET",
      headers,
    }
  ),
  fetch(
    `https://imdexdev.atlassian.net/rest/agile/1.0/board/101/sprint?state=active`,
    {
      method: "GET",
      headers,
    }
  ),
]);

const [ticket, sprint] = await Promise.all([
  fetchTicket.json(),
  fetchSprint.json(),
]);

const { key, fields } = ticket.issues[0];

return {
  og: { sprint: sprint.values[0], ticket },
  sprint: sprint.values[0].name.split(" ").pop().split("-")[1],
  components: fields.components
    .filter((x) => x.name.includes("hubv3"))
    .map((x) => x.name.toLowerCase().split(" ").join("-"))
    .join(":"),
  ticketNumber: key,
  workItem: fields.customfield_13129,
  epic: fields.parent.fields.summary,
  summary: fields.summary,
};
