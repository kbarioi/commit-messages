let title;
let value;
let preview;

title = "Migrations";

try {
  const database = data["is tenant"]
    ? "TenantedDbConfiguration"
    : "HubDbConfiguration";
  if (
    [data["is create"], data["is update"], data["is revert"]].filter(Boolean)
      .length !== 1
  ) {
    value = "Please select one of 'is create', 'is update' or 'is revert'";
  } else if (data["is update"]) {
    value = `Update-Database -ConfigurationTypeName ${database}`;
  } else if (!data["migration name"]) {
    value = "please specify a migration name";
  } else if (data["is create"]) {
    value = `Add-Migration ${data["migration name"]} -ConfigurationTypeName ${database}`;
  } else if (data["is revert"]) {
    value = `Update-Database -ConfigurationTypeName ${database} -TargetMigration ${data["migration name"]}`;
  }
} catch (e) {
  console.log({ valueError: e });
}

return {
  title,
  value,
  preview,
};
