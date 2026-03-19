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
		faqUrl: `${siteUrl}/account/faq`,
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
			subject: "Ihr Kulturkataster-Account wurde gelöscht",
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
	const { siteUrl, portalUrl, faqUrl } = getBaseUrls();
	const templatePath =
		params.decision === "approved"
			? "custom/claim_approved.html"
			: "custom/claim_rejected.html";
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
	const { siteUrl, portalUrl, faqUrl } = getBaseUrls();
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
	const { siteUrl, portalUrl, faqUrl } = getBaseUrls();
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
				? `Freigabe als Bezirksmitarbeitende*r für ${districtLabel}`
				: `Ihre Registrierung als Bezirksmitarbeitende*r für ${districtLabel}`;
	} else if (params.target === "state") {
		templatePath =
			params.decision === "approved"
				? "custom/role_state_approved.html"
				: "custom/role_state_rejected.html";
		subject =
			params.decision === "approved"
				? "Freigabe als Landesmitarbeitende*r (Berlin)"
				: "Ihre Registrierung als Landesmitarbeitende*r (Berlin)";
	} else {
		templatePath =
			params.decision === "approved"
				? "custom/role_network_approved.html"
				: "custom/role_network_rejected.html";
		subject =
			params.decision === "approved"
				? "Freigabe als Mitarbeitende*r eines Verbands/Netzwerks"
				: "Ihre Registrierung als Mitarbeitende*r eines Verbands/Netzwerks";
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
