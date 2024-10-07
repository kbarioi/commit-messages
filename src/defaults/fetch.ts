const headers = new Headers({
  authorization: `Basic ${btoa(
    `${config["Jira Username"]}:${config["Jira API Key"]}`
  )}`,
});

const fetchTicket = await fetch(
  `https://imdexdev.atlassian.net/rest/api/3/search?fields=summary,fixVersions,parent,assignee,customfield_13129&jql=project="CLOUDHUB" AND Key="CLOUDHUB-${config["Jira Ticket"]}"`,
  {
    method: "GET",
    headers,
  }
);

const fetchSprint = await fetch(
  `https://imdexdev.atlassian.net/rest/agile/1.0/board/101/sprint?state=active`,
  {
    method: "GET",
    headers,
  }
);

const ticket = (await fetchTicket.json()).issues?.[0];
const sprint = await fetchSprint.json();

const temp = sprint.values[0].name.split(" ").pop();
return {
  sprint: temp.split("-")[1],
  ticketNumber: ticket.key,
  workItem: ticket.fields.customfield_13129,
  epic: ticket.fields.parent.fields.summary,
  summary: ticket.fields.summary,
};
