"use server";

import { getCurrentUser } from "@/server/actions/auth";
import { logger } from "@/server/logging/logger";
import {
	loadAccountDataBestEffort,
	type AccountDataPayload,
} from "@/server/utils/accountData";
import { getAccessContextForUser } from "@/server/utils/rbac";

export async function getAccountRefreshData(
	keys?: Array<keyof AccountDataPayload>,
): Promise<Partial<AccountDataPayload> | null> {
	try {
		const user = await getCurrentUser();
		if (!user) return null;

		const ctx = await getAccessContextForUser(user.id);
		return loadAccountDataBestEffort({ ctx, currentUserId: user.id }, keys);
	} catch (error) {
		logger.warn("account.refresh.failed", {
			subsystem: "account",
			error: error instanceof Error ? error.message : String(error),
		});
		return null;
	}
}
