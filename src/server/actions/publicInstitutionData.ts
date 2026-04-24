"use server";

import { getCurrentUserId } from "@/server/actions/auth";
import { logger } from "@/server/logging/logger";
import {
	loadPublicInstitutionData,
	loadPublicInstitutionDataBestEffort,
	type PublicInstitutionDataPayload,
} from "@/server/utils/publicInstitutionData";
import { getAccessContextForUser } from "@/server/utils/rbac";

export async function getPublicInstitutionData(): Promise<PublicInstitutionDataPayload> {
	try {
		const currentUserId = await getCurrentUserId();
		const ctx = await getAccessContextForUser(currentUserId);

		return await loadPublicInstitutionData({
			ctx,
			currentUserId,
		});
	} catch (error) {
		logger.warn("public_institution_data.load.failed", {
			subsystem: "institution",
			error: error instanceof Error ? error.message : String(error),
		});
		const currentUserId = await getCurrentUserId();
		const ctx = await getAccessContextForUser(currentUserId);
		const bestEffort = await loadPublicInstitutionDataBestEffort({
			ctx,
			currentUserId,
		});
		return {
			institutions: bestEffort.institutions ?? [],
			categories: bestEffort.categories ?? [],
			districts: bestEffort.districts ?? [],
		};
	}
}

export async function getPublicInstitutionRefreshData(): Promise<
	Partial<PublicInstitutionDataPayload>
> {
	try {
		const currentUserId = await getCurrentUserId();
		const ctx = await getAccessContextForUser(currentUserId);

		return await loadPublicInstitutionDataBestEffort({
			ctx,
			currentUserId,
		});
	} catch (error) {
		logger.warn("public_institution_data.refresh.failed", {
			subsystem: "institution",
			error: error instanceof Error ? error.message : String(error),
		});
		return {};
	}
}
