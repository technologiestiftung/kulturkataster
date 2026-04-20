"use server";

import { getCurrentUser } from "@/server/actions/auth";
import {
	loadAccountDataBestEffort,
	type AccountDataPayload,
} from "@/server/utils/accountData";
import { getAccessContextForUser } from "@/server/utils/rbac";

export async function getAccountRefreshData(): Promise<Partial<AccountDataPayload> | null> {
	const user = await getCurrentUser();
	if (!user) return null;

	const ctx = await getAccessContextForUser(user.id);
	return loadAccountDataBestEffort({
		ctx,
		currentUserId: user.id,
	});
}
