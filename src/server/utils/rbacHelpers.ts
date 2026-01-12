import type { Action, AccessContext } from "@/server/utils/rbac";
import { canTable } from "@/server/utils/rbac";

export const fetchIfAllowed = <T>(
	context: AccessContext,
	table: string,
	action: Action,
	fetcher: () => Promise<T>,
	fallback: T,
): Promise<T> => {
	return canTable(context, table, action)
		? fetcher()
		: Promise.resolve(fallback);
};
