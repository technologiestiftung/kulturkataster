const runtimeBooleanEnv = (name: string) => {
	const value = process.env[name];
	return typeof value === "string" && value.toLowerCase() === "true";
};

export const isInstitutionTableRowKindFilterEnabled = () =>
	runtimeBooleanEnv("INSTITUTION_TABLE_ROW_KIND_FILTER_ENABLED");
