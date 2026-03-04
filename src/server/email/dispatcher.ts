import type { UserStatus } from "@/generated/prisma";
import { sendTemplatedEmail } from "@/server/email/sendTemplatedEmail";

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
		console.error("[email] account deleted notification failed:", error);
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
		console.error("[email] claim decision notification failed:", error);
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
	const isApproved = params.afterStatus === "active";

	let templatePath: string | null = null;
	let subject: string | null = null;
	if (normalizedAccountType === "district") {
		templatePath = isApproved
			? "custom/role_district_approved.html"
			: "custom/role_district_rejected.html";
		subject = isApproved
			? `Freigabe als Bezirksmitarbeitende*r für ${districtLabel}`
			: `Ihre Registrierung als Bezirksmitarbeitende*r für ${districtLabel}`;
	} else if (normalizedAccountType === "administration") {
		templatePath = isApproved
			? "custom/role_state_approved.html"
			: "custom/role_state_rejected.html";
		subject = isApproved
			? "Freigabe als Landesmitarbeitende*r (Berlin)"
			: "Ihre Registrierung als Landesmitarbeitende*r (Berlin)";
	} else if (normalizedAccountType === "organization") {
		templatePath = isApproved
			? "custom/role_network_approved.html"
			: "custom/role_network_rejected.html";
		subject = isApproved
			? "Freigabe als Mitarbeitende*r eines Verbands/Netzwerks"
			: "Ihre Registrierung als Mitarbeitende*r eines Verbands/Netzwerks";
	}

	if (!templatePath || !subject) return;

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
		console.error("[email] role decision notification failed:", error);
	}
}
