"use server";

import { getCurrentUserId } from "@/server/actions/auth";
import {
	loadPublicInstitutionData,
	loadPublicInstitutionDataBestEffort,
	type PublicInstitutionDataPayload,
} from "@/server/utils/publicInstitutionData";
import { getAccessContextForUser } from "@/server/utils/rbac";

export async function getPublicInstitutionData(): Promise<PublicInstitutionDataPayload> {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);

	return loadPublicInstitutionData({
		ctx,
		currentUserId,
	});
}

export async function getPublicInstitutionRefreshData(): Promise<
	Partial<PublicInstitutionDataPayload>
> {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);

	return loadPublicInstitutionDataBestEffort({
		ctx,
		currentUserId,
	});
}
