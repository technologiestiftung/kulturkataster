import type { Action, AccessContext } from "@/server/utils/rbac";
import { canTable } from "@/server/utils/rbac";

export const fetchIfAllowed = <T>(
	context: AccessContext,
	table: string,
	action: Action,
	fetcher: () => Promise<T>,
	fallback: T,
): Promise<T> => {
	if (!canTable(context, table, action)) {
		return Promise.resolve(fallback);
	}

	return fetcher().catch((error: unknown) => {
		if (error instanceof Error && error.name === "RBACError") {
			return fallback;
		}
		throw error;
	});
};
