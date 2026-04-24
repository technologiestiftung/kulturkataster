import nodemailer from "nodemailer";
import { logger } from "@/server/logging/logger";
import { loadEmailTemplateBody } from "@/server/email/templates";
import {
	isMarkdownTemplate,
	mdToEmailHtml,
} from "@/server/email/mdToEmailHtml";

type TemplateData = Record<string, unknown>;

export type EmailTemplateVariables = {
	ConfirmationURL?: string;
	Token?: string;
	TokenHash?: string;
	SiteURL?: string;
	RedirectTo?: string;
	Data?: TemplateData;
	Email?: string;
	NewEmail?: string;
	OldEmail?: string;
	Phone?: string;
	OldPhone?: string;
	Provider?: string;
	FactorType?: string;
};

type SendTemplatedEmailArgs = {
	to: string;
	subject: string;
	templatePath: string;
	variables?: EmailTemplateVariables;
};

type EmailRuntimeConfig =
	| { provider: "noop" }
	| {
			provider: "smtp";
			host: string;
			port: number;
			secure: boolean;
			user?: string;
			pass?: string;
			from: string;
			replyTo?: string;
	  };

const resolvePath = (value: unknown, keyPath: string): unknown => {
	const keys = keyPath.split(".");
	let current: unknown = value;
	for (const key of keys) {
		if (!current || typeof current !== "object") {
			return undefined;
		}
		current = (current as Record<string, unknown>)[key];
	}
	return current;
};

const renderTemplate = (
	template: string,
	variables: EmailTemplateVariables,
): string => {
	return template.replace(/{{\s*\.([A-Za-z0-9_.]+)\s*}}/g, (_, keyPath) => {
		const resolved = resolvePath(variables, keyPath);
		if (resolved === null || typeof resolved === "undefined") return "";
		return String(resolved);
	});
};

const getEmailRuntimeConfig = (): EmailRuntimeConfig => {
	const provider = (process.env.EMAIL_PROVIDER ?? "noop").toLowerCase();
	if (provider === "noop") {
		return { provider: "noop" };
	}
	if (provider !== "smtp") {
		throw new Error(
			`Unsupported EMAIL_PROVIDER: ${provider}. Supported values: "smtp", "noop".`,
		);
	}

	const host = process.env.SMTP_HOST;
	const portRaw = process.env.SMTP_PORT;
	const user = process.env.SMTP_USER?.trim();
	const pass = (process.env.SMTP_PASSWORD ?? process.env.SMTP_PASS)?.trim();
	const from = process.env.SMTP_SENDER_NAME;
	const replyTo = process.env.SMTP_REPLY_TO;

	if (!host || !portRaw) {
		throw new Error("Missing SMTP config. Required: SMTP_HOST, SMTP_PORT");
	}

	const port = Number(portRaw);
	if (!Number.isFinite(port) || port <= 0) {
		throw new Error(`Invalid SMTP_PORT: ${portRaw}`);
	}

	const secure = (process.env.SMTP_SECURE ?? "false").toLowerCase() === "true";

	return {
		provider: "smtp",
		host,
		port,
		secure,
		user: user || undefined,
		pass: pass || undefined,
		from: from || "",
		replyTo: replyTo || undefined,
	};
};

// Fail fast during module initialization when SMTP is enabled but misconfigured.
const emailRuntimeConfig = getEmailRuntimeConfig();

export async function sendTemplatedEmail({
	to,
	subject,
	templatePath,
	variables = {},
}: SendTemplatedEmailArgs) {
	return logger.time(
		{
			level: "info",
			event: "email.send.completed",
			successData: {
				subsystem: "email",
				email_to: to,
				template: templatePath,
				subject,
				provider: emailRuntimeConfig.provider,
			},
			errorEvent: "email.send.failed",
			errorData: {
				subsystem: "email",
				email_to: to,
				template: templatePath,
				subject,
				provider: emailRuntimeConfig.provider,
			},
			slowThresholdMs: 2000,
			slowEvent: "email.send.slow",
			slowData: {
				subsystem: "email",
				email_to: to,
				template: templatePath,
				provider: emailRuntimeConfig.provider,
			},
		},
		async () => {
			const raw = await loadEmailTemplateBody(templatePath);
			const rendered = renderTemplate(raw, variables);
			const html = isMarkdownTemplate(rendered)
				? await mdToEmailHtml(rendered, subject)
				: rendered;

			if (emailRuntimeConfig.provider === "noop") {
				logger.info("email.send.noop", {
					subsystem: "email",
					email_to: to,
					template: templatePath,
					subject,
				});
				return { id: "noop" };
			}

			const transporter = nodemailer.createTransport({
				host: emailRuntimeConfig.host,
				port: emailRuntimeConfig.port,
				secure: emailRuntimeConfig.secure,
				auth:
					emailRuntimeConfig.user && emailRuntimeConfig.pass
						? {
								user: emailRuntimeConfig.user,
								pass: emailRuntimeConfig.pass,
							}
						: undefined,
			});

			const result = await transporter.sendMail({
				from: emailRuntimeConfig.from,
				to,
				subject,
				html,
				replyTo: emailRuntimeConfig.replyTo,
			});
			return { id: result.messageId ?? null };
		},
	);
}
