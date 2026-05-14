"use server";

import { getCurrentProfile, getCurrentUser } from "@/server/actions/auth";
import { prisma } from "@/server/prisma";
import { sendInstitutionDownloadNotificationEmail } from "@/server/email/dispatcher";
import { logger } from "@/server/logging/logger";
import {
	runWithServerRequestContext,
	setRequestContext,
} from "@/server/logging/requestContext";

type NotifyInstitutionDownloadInput = {
	filename: string;
	format: "csv" | "xlsx" | "xls";
	institutionCount: number;
	institutionIds: number[];
	requesterFirstName?: string;
	requesterLastName?: string;
	requesterEmail?: string;
	usagePurpose?: string;
};

const ADMIN_DOWNLOAD_NOTIFICATION_EMAIL =
	process.env.DOWNLOAD_NOTIFICATION_EMAIL?.trim() ||
	"info@kulturkataster.berlin";
const MAX_LISTED_INSTITUTION_IDS = 50;

export async function notifyInstitutionDownload(
	input: NotifyInstitutionDownloadInput,
) {
	return runWithServerRequestContext(
		async () => {
			const [currentUser, currentProfile] = await Promise.all([
				getCurrentUser(),
				getCurrentProfile(),
			]);

			const actorUserId = currentUser?.id ?? null;
			const email =
				input.requesterEmail ??
				currentProfile?.email ??
				currentUser?.email ??
				"";
			const firstName =
				input.requesterFirstName ?? currentProfile?.first_name ?? "";
			const lastName =
				input.requesterLastName ?? currentProfile?.last_name ?? "";

			if (!actorUserId && !email) {
				return { ok: false as const, error: "unauthorized" as const };
			}

			setRequestContext({ userId: actorUserId });
			const institutionIds = input.institutionIds.filter(Number.isFinite);
			const shouldListInstitutionIds =
				institutionIds.length > 0 &&
				institutionIds.length <= MAX_LISTED_INSTITUTION_IDS;
			const requesterName =
				`${firstName} ${lastName}`.trim() || email || "Unknown";

			try {
				await prisma.entityAudit.create({
					data: {
						entity_id: actorUserId ?? email,
						entity_type: "user",
						action: "update",
						status: "completed",
						changed_by: actorUserId,
						new_data: {
							status: "completed",
							download_type: "institution_export",
							filename: input.filename,
							format: input.format,
							institution_count: input.institutionCount,
							institution_ids: shouldListInstitutionIds ? institutionIds : null,
							usage_purpose: input.usagePurpose ?? null,
						},
						meta_info: {
							download_event: true,
							download_type: "institution_export",
							requester_name: requesterName,
							requester_email: email,
							usage_purpose: input.usagePurpose ?? null,
							institution_ids_listed: shouldListInstitutionIds,
							institution_ids_count: institutionIds.length,
						},
					},
				});
			} catch (error) {
				logger.error("download.institution_audit.failed", error, {
					subsystem: "db",
					db_subsystem: "db",
					actor_user_id: actorUserId,
					export_filename: input.filename,
					export_format: input.format,
					institution_count: input.institutionCount,
				});
			}

			try {
				await sendInstitutionDownloadNotificationEmail({
					to: ADMIN_DOWNLOAD_NOTIFICATION_EMAIL,
					requesterEmail: email,
					requesterFirstName: firstName,
					requesterLastName: lastName,
					filename: input.filename,
					format: input.format,
					institutionCount: input.institutionCount,
					institutionIds,
					usagePurpose: input.usagePurpose,
				});
			} catch (error) {
				logger.error("download.institution_notification.failed", error, {
					subsystem: "email",
					actor_user_id: actorUserId,
					email_to: ADMIN_DOWNLOAD_NOTIFICATION_EMAIL,
					export_filename: input.filename,
					export_format: input.format,
					institution_count: input.institutionCount,
				});
			}

			return { ok: true as const };
		},
		{ route: "server_action:downloads.notifyInstitutionDownload" },
	);
}
