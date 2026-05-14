import type { UserStatus } from "@/generated/prisma";
import { sendTemplatedEmail } from "@/server/email/sendTemplatedEmail";
import { logger } from "@/server/logging/logger";

export type RoleEmailTarget = "district" | "state" | "network";
export type RoleEmailDecision = "approved" | "rejected";

const getBaseUrls = () => {
	const siteUrl = process.env.SITE_URL ?? "http://127.0.0.1:3000";
	return {
		siteUrl,
		portalUrl: `${siteUrl}/account`,
		faqUrl: `${siteUrl}/de/account/faq`,
		faqUrlEn: `${siteUrl}/en/account/faq`,
	};
};

export async function sendComplianceResendEmail(params: {
	email: string;
	firstName?: string | null;
	lastName?: string | null;
}) {
	const { siteUrl } = getBaseUrls();
	return sendTemplatedEmail({
		to: params.email,
		subject: "Kulturkataster: Bitte Compliance bestätigen",
		templatePath: "custom/compliance_resend.html",
		variables: {
			SiteURL: siteUrl,
			Email: params.email,
			Data: {
				first_name: params.firstName ?? "",
				last_name: params.lastName ?? "",
			},
		},
	});
}

export async function sendAccountDeletedEmail(params: {
	email: string;
	firstName?: string | null;
	lastName?: string | null;
}) {
	const { siteUrl } = getBaseUrls();
	try {
		await sendTemplatedEmail({
			to: params.email,
			subject:
				"Ihr Kulturkataster-Account wurde gelöscht / Your Kulturkataster account has been deleted",
			templatePath: "custom/account_deleted.html",
			variables: {
				SiteURL: siteUrl,
				Email: params.email,
				Data: {
					first_name: params.firstName ?? "",
					last_name: params.lastName ?? "",
				},
			},
		});
	} catch (error) {
		logger.error("email.account_deleted.failed", error, {
			subsystem: "email",
			email_to: params.email,
			template: "custom/account_deleted.html",
		});
	}
}

export async function sendClaimDecisionEmail(params: {
	decision: "approved" | "rejected";
	email: string;
	firstName?: string | null;
	lastName?: string | null;
	institutionName: string;
}) {
	const { siteUrl, portalUrl, faqUrl, faqUrlEn } = getBaseUrls();
	const templatePath =
		params.decision === "approved"
			? "custom/claim_approved.html"
			: "custom/claim_rejected.html";
	const subject =
		params.decision === "approved"
			? `Ihr Kulturort ${params.institutionName} wurde Ihrem Kulturkatasterportal hinzugefügt / Your venue ${params.institutionName} has been added to your Kulturkataster dashboard`
			: `Ihre Anfrage zur Pflege des Kulturorts ${params.institutionName} / Your request to maintain the venue ${params.institutionName}`;

	try {
		await sendTemplatedEmail({
			to: params.email,
			subject,
			templatePath,
			variables: {
				SiteURL: siteUrl,
				Email: params.email,
				Data: {
					first_name: params.firstName ?? "",
					last_name: params.lastName ?? "",
					institution_name: params.institutionName,
					portal_url: portalUrl,
					faq_url: faqUrl,
					faq_url_en: faqUrlEn,
				},
			},
		});
	} catch (error) {
		logger.error("email.claim_decision.failed", error, {
			subsystem: "email",
			email_to: params.email,
			template: templatePath,
			decision: params.decision,
			institution_name: params.institutionName,
		});
	}
}

export async function sendSubmissionDecisionEmail(params: {
	decision: "approved" | "rejected";
	email: string;
	firstName?: string | null;
	lastName?: string | null;
	institutionName: string;
}) {
	const { siteUrl, portalUrl, faqUrl, faqUrlEn } = getBaseUrls();
	const templatePath =
		params.decision === "approved"
			? "custom/submission_approved.html"
			: "custom/submission_rejected.html";
	const subject =
		params.decision === "approved"
			? `Ihr Kulturort ${params.institutionName} wurde Ihrem Kulturkatasterportal hinzugefügt`
			: `Ihre Anfrage zur Pflege des Kulturorts ${params.institutionName}`;

	try {
		await sendTemplatedEmail({
			to: params.email,
			subject,
			templatePath,
			variables: {
				SiteURL: siteUrl,
				Email: params.email,
				Data: {
					first_name: params.firstName ?? "",
					last_name: params.lastName ?? "",
					institution_name: params.institutionName,
					portal_url: portalUrl,
					faq_url: faqUrl,
					faq_url_en: faqUrlEn,
				},
			},
		});
	} catch (error) {
		logger.error("email.submission_decision.failed", error, {
			subsystem: "email",
			email_to: params.email,
			template: templatePath,
			decision: params.decision,
			institution_name: params.institutionName,
		});
	}
}

export async function sendRoleDecisionEmail(params: {
	target: RoleEmailTarget;
	decision: RoleEmailDecision;
	email: string;
	firstName?: string | null;
	lastName?: string | null;
	metaInfo?: unknown;
}) {
	const { siteUrl, portalUrl, faqUrl, faqUrlEn } = getBaseUrls();
	const districtFromMeta =
		params.metaInfo && typeof params.metaInfo === "object"
			? String(
					(params.metaInfo as Record<string, unknown>).districtName ??
						(params.metaInfo as Record<string, unknown>).district ??
						"",
				).trim()
			: "";
	const districtLabel = districtFromMeta || "Ihrem Bezirk";

	let templatePath: string;
	let subject: string;
	if (params.target === "district") {
		templatePath =
			params.decision === "approved"
				? "custom/role_district_approved.html"
				: "custom/role_district_rejected.html";
		subject =
			params.decision === "approved"
				? `Freigabe als Bezirksmitarbeitende*r für ${districtLabel} / Approval as a district administration staff member for ${districtLabel}`
				: `Ihre Registrierung als Bezirksmitarbeitende*r für ${districtLabel}`;
	} else if (params.target === "state") {
		templatePath =
			params.decision === "approved"
				? "custom/role_state_approved.html"
				: "custom/role_state_rejected.html";
		subject =
			params.decision === "approved"
				? "Freigabe als Landesmitarbeitende*r (Berlin) / Approval as a Berlin state administration staff member"
				: "Ihre Registrierung als Landesmitarbeitende*r (Berlin) / Your registration as a Berlin state administration staff member";
	} else {
		templatePath =
			params.decision === "approved"
				? "custom/role_network_approved.html"
				: "custom/role_network_rejected.html";
		subject =
			params.decision === "approved"
				? "Freigabe als Mitarbeitende*r eines Verbands/Netzwerks / Approval as an association/network staff member"
				: "Ihre Registrierung als Mitarbeitende*r eines Verbands/Netzwerks / Your registration as an association/network staff member";
	}

	try {
		await sendTemplatedEmail({
			to: params.email,
			subject,
			templatePath,
			variables: {
				SiteURL: siteUrl,
				Email: params.email,
				Data: {
					first_name: params.firstName ?? "",
					last_name: params.lastName ?? "",
					district: districtLabel,
					portal_url: portalUrl,
					faq_url: faqUrl,
					faq_url_en: faqUrlEn,
				},
			},
		});
	} catch (error) {
		logger.error("email.role_decision.failed", error, {
			subsystem: "email",
			email_to: params.email,
			template: templatePath,
			target: params.target,
			decision: params.decision,
		});
	}
}

export async function sendRoleDecisionEmailIfNeeded(params: {
	beforeStatus: UserStatus;
	afterStatus: UserStatus;
	accountType: string | null;
	email: string;
	firstName?: string | null;
	lastName?: string | null;
	metaInfo?: unknown;
}) {
	if (params.beforeStatus !== "approval_pending") return;
	if (params.afterStatus !== "active" && params.afterStatus !== "inactive")
		return;

	const normalizedAccountType = (params.accountType ?? "").trim().toLowerCase();
	const decision: RoleEmailDecision =
		params.afterStatus === "active" ? "approved" : "rejected";
	let target: RoleEmailTarget | null = null;
	if (normalizedAccountType === "district") {
		target = "district";
	} else if (normalizedAccountType === "administration") {
		target = "state";
	} else if (normalizedAccountType === "organization") {
		target = "network";
	}

	if (!target) return;
	await sendRoleDecisionEmail({
		target,
		decision,
		email: params.email,
		firstName: params.firstName,
		lastName: params.lastName,
		metaInfo: params.metaInfo,
	});
}

export async function sendInstitutionDownloadNotificationEmail(params: {
	to: string;
	requesterEmail: string;
	requesterFirstName?: string | null;
	requesterLastName?: string | null;
	filename: string;
	format: "csv" | "xlsx" | "xls";
	institutionCount: number;
	institutionIds: number[];
	usagePurpose?: string;
}) {
	const MAX_LISTED_INSTITUTION_IDS = 10;
	const requesterName =
		`${params.requesterFirstName ?? ""} ${params.requesterLastName ?? ""}`.trim() ||
		params.requesterEmail ||
		"Unknown";
	const shouldListInstitutionIds =
		params.institutionIds.length > 0 &&
		params.institutionIds.length <= MAX_LISTED_INSTITUTION_IDS;

	try {
		await sendTemplatedEmail({
			to: params.to,
			subject: `Kulturkataster: Datenexport ${params.filename}.${params.format}`,
			templatePath: "custom/institution_download_notification.html",
			variables: {
				Email: params.requesterEmail,
				Data: {
					requester_name: requesterName,
					requester_email: params.requesterEmail,
					filename: params.filename,
					format: params.format,
					institution_count: params.institutionCount,
					usage_purpose: params.usagePurpose ?? "—",
					institution_ids: shouldListInstitutionIds
						? params.institutionIds.join(", ")
						: `Nicht aufgeführt (${params.institutionIds.length} IDs)`,
				},
			},
		});
	} catch (error) {
		logger.error("email.institution_download_notification.failed", error, {
			subsystem: "email",
			email_to: params.to,
			requester_email: params.requesterEmail,
			template: "custom/institution_download_notification.html",
			export_filename: params.filename,
			export_format: params.format,
			institution_count: params.institutionCount,
		});
		throw error;
	}
}
