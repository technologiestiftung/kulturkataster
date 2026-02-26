import { NextRequest, NextResponse } from "next/server";

type EmailTemplateType =
	| "confirmation"
	| "recovery"
	| "invite"
	| "email_change"
	| "magic_link"
	| "reauthentication";

type EmailTemplatePayload = {
	email?: string;
	token_hash?: string;
	token?: string;
	type?: string;
	redirect_to?: string;
	action_link?: string;
	confirmation_url?: string;
	recovery_url?: string;
	invite_url?: string;
	email_change_url?: string;
	site_url?: string;
};

const BASE_URL = process.env.SITE_URL ?? "http://127.0.0.1:3000";

const getTemplateFromPath = (
	request: NextRequest,
): EmailTemplateType | null => {
	const segment = request.nextUrl.pathname.split("/").filter(Boolean).pop();
	if (
		segment === "confirmation" ||
		segment === "recovery" ||
		segment === "invite" ||
		segment === "email_change" ||
		segment === "magic_link" ||
		segment === "reauthentication"
	) {
		return segment;
	}
	// Backward-compatible aliases.
	if (segment === "confirm-signup") return "confirmation";
	if (segment === "recover-password") return "recovery";
	if (segment === "invite-user") return "invite";
	if (segment === "change-email") return "email_change";
	if (segment === "magic-link") return "magic_link";
	return null;
};

const getPayloadFromQuery = (request: NextRequest): EmailTemplatePayload => {
	const qp = request.nextUrl.searchParams;
	return {
		email: qp.get("email") ?? undefined,
		token_hash: qp.get("token_hash") ?? undefined,
		token: qp.get("token") ?? undefined,
		type: qp.get("type") ?? undefined,
		redirect_to: qp.get("redirect_to") ?? undefined,
		action_link: qp.get("action_link") ?? undefined,
		confirmation_url: qp.get("confirmation_url") ?? undefined,
		recovery_url: qp.get("recovery_url") ?? undefined,
		invite_url: qp.get("invite_url") ?? undefined,
		email_change_url: qp.get("email_change_url") ?? undefined,
		site_url: qp.get("site_url") ?? undefined,
	};
};

const getPayloadFromBody = async (
	request: NextRequest,
): Promise<EmailTemplatePayload> => {
	try {
		const json = (await request.json()) as EmailTemplatePayload;
		return json ?? {};
	} catch {
		return {};
	}
};

const escapeHtml = (value: string) =>
	value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");

const buildVerificationLink = (
	payload: EmailTemplatePayload,
	template: EmailTemplateType,
) => {
	const explicitActionLink =
		payload.action_link ??
		payload.confirmation_url ??
		payload.recovery_url ??
		payload.invite_url ??
		payload.email_change_url;
	if (explicitActionLink) return explicitActionLink;

	const tokenHash = payload.token_hash ?? payload.token;
	if (!tokenHash) return null;

	const typeByTemplate: Record<EmailTemplateType, string> = {
		confirmation: "signup",
		recovery: "recovery",
		invite: "invite",
		email_change: "email_change",
		magic_link: "magiclink",
		reauthentication: "email",
	};
	const verifyType = payload.type ?? typeByTemplate[template];
	const baseUrl = payload.site_url ?? BASE_URL;
	const next = payload.redirect_to ?? "/login";
	const nextUrl = `${baseUrl}/auth/confirm?token_hash=${encodeURIComponent(
		tokenHash,
	)}&type=${encodeURIComponent(verifyType)}&next=${encodeURIComponent(next)}`;
	return nextUrl;
};

const getTemplateCopy = (template: EmailTemplateType) => {
	switch (template) {
		case "confirmation":
			return {
				title: "Konto bestaetigen",
				intro:
					"Bitte bestaetigen Sie Ihr Konto, um den Registrierungsprozess abzuschliessen.",
				cta: "Konto bestaetigen",
			};
		case "recovery":
			return {
				title: "Passwort zuruecksetzen",
				intro: "Sie haben eine Passwort-Zuruecksetzung angefordert.",
				cta: "Passwort zuruecksetzen",
			};
		case "invite":
			return {
				title: "Einladung annehmen",
				intro:
					"Sie wurden eingeladen. Nutzen Sie den folgenden Link, um Ihr Konto zu aktivieren.",
				cta: "Einladung annehmen",
			};
		case "email_change":
			return {
				title: "E-Mail-Adresse bestaetigen",
				intro: "Bitte bestaetigen Sie die Aenderung Ihrer E-Mail-Adresse.",
				cta: "E-Mail bestaetigen",
			};
		case "magic_link":
			return {
				title: "Anmeldung mit Magic Link",
				intro: "Nutzen Sie den folgenden Link, um sich einmalig anzumelden.",
				cta: "Jetzt anmelden",
			};
		case "reauthentication":
			return {
				title: "Reauthentifizierung bestaetigen",
				intro:
					"Bestaetigen Sie den Vorgang mit dem folgenden Einmalcode oder Link.",
				cta: "Bestaetigen",
			};
		default:
			return {
				title: "Benachrichtigung",
				intro: "Sie haben eine Benachrichtigung erhalten.",
				cta: "Weiter",
			};
	}
};

const renderHtml = (
	template: EmailTemplateType,
	payload: EmailTemplatePayload,
) => {
	const link = buildVerificationLink(payload, template);
	const copy = getTemplateCopy(template);
	const safeEmail = payload.email ? escapeHtml(payload.email) : "";
	const otpBlock =
		template === "reauthentication" && payload.token
			? `<p style="margin:0 0 18px 0;font-size:18px;line-height:1.4;">Code: <strong>${escapeHtml(
					payload.token,
			  )}</strong></p>`
			: "";

	return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${copy.title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:24px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;">
            <tr>
              <td style="padding:28px 24px 8px 24px;font-size:24px;line-height:1.3;font-weight:700;">${copy.title}</td>
            </tr>
            <tr>
              <td style="padding:0 24px 20px 24px;font-size:16px;line-height:1.6;">
                ${copy.intro}
                ${safeEmail ? `<br/><br/>Empfaenger: <strong>${safeEmail}</strong>` : ""}
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 28px 24px;">
                ${otpBlock}
                ${
									link
										? `<a href="${escapeHtml(
												link,
											)}" style="display:inline-block;background:#1f2937;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">${copy.cta}</a>`
										: `<p style="margin:0;color:#b91c1c;">Kein gueltiger Aktionslink verfuegbar.</p>`
								}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

const respond = (template: EmailTemplateType, payload: EmailTemplatePayload) =>
	new NextResponse(renderHtml(template, payload), {
		headers: { "Content-Type": "text/html; charset=utf-8" },
	});

export async function GET(request: NextRequest) {
	const template = getTemplateFromPath(request);
	if (!template) {
		return NextResponse.json(
			{ error: "Unsupported email template type." },
			{ status: 404 },
		);
	}
	return respond(template, getPayloadFromQuery(request));
}

export async function POST(request: NextRequest) {
	const template = getTemplateFromPath(request);
	if (!template) {
		return NextResponse.json(
			{ error: "Unsupported email template type." },
			{ status: 404 },
		);
	}
	const body = await getPayloadFromBody(request);
	const query = getPayloadFromQuery(request);
	return respond(template, { ...body, ...query });
}
