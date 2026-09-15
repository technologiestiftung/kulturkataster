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

export type SendTemplatedEmailArgs = {
	to: string;
	subject: string;
	templatePath: string;
	variables?: EmailTemplateVariables;
};

export type SendTemplatedEmailResult = {
	id: string | null;
	accepted?: string[];
	rejected?: string[];
	pending?: string[];
	response?: string;
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
			from: EmailSender;
			replyTo?: string;
	  };

type SmtpEmailRuntimeConfig = Extract<EmailRuntimeConfig, { provider: "smtp" }>;

type EmailSender = string | { name: string; address: string };

const DEFAULT_SENDER_NAME = "Kulturkataster";

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

const stringArrayOrUndefined = (value: unknown) =>
	Array.isArray(value) && value.every((item) => typeof item === "string")
		? value
		: undefined;

const getSmtpResultDetails = (result: unknown): SendTemplatedEmailResult => {
	if (!result || typeof result !== "object") {
		return { id: null };
	}

	const info = result as Record<string, unknown>;
	return {
		id: typeof info.messageId === "string" ? info.messageId : null,
		accepted: stringArrayOrUndefined(info.accepted),
		rejected: stringArrayOrUndefined(info.rejected),
		pending: stringArrayOrUndefined(info.pending),
		response: typeof info.response === "string" ? info.response : undefined,
	};
};

const trimQuotes = (value: string) => value.trim().replace(/^"|"$/g, "");

const parseSenderMailbox = (value: string): EmailSender | null => {
	const match = value.match(/^\s*(.*?)\s*<([^<>\s@]+@[^<>\s@]+)>\s*$/);
	if (!match) return null;

	return {
		name: trimQuotes(match[1]) || DEFAULT_SENDER_NAME,
		address: match[2].trim(),
	};
};

const resolveSender = ({
	senderName,
	senderEmail,
	user,
}: {
	senderName?: string;
	senderEmail?: string;
	user?: string;
}): EmailSender => {
	const name = senderName?.trim();
	const email = senderEmail?.trim();

	if (email) {
		return { name: name || DEFAULT_SENDER_NAME, address: email };
	}

	if (name) {
		const mailbox = parseSenderMailbox(name);
		if (mailbox) return mailbox;

		if (name.includes("@")) {
			return { name: DEFAULT_SENDER_NAME, address: name };
		}
	}

	if (user) {
		return { name: name || DEFAULT_SENDER_NAME, address: user };
	}

	throw new Error(
		'Missing SMTP sender config. Required: SMTP_SENDER_EMAIL or SMTP_SENDER_NAME as "Name <email>".',
	);
};

const getEmailProvider = () =>
	(process.env.EMAIL_PROVIDER ?? "noop").toLowerCase();

const parseSmtpPort = (portRaw: string) => {
	const port = Number(portRaw);
	if (!Number.isFinite(port) || port <= 0) {
		throw new Error(`Invalid SMTP_PORT: ${portRaw}`);
	}
	return port;
};

const optionalTrimmed = (value: string | undefined) => {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
};

const getSmtpEndpoint = () => {
	const host = process.env.SMTP_HOST;
	const portRaw = process.env.SMTP_PORT;

	if (!host || !portRaw) {
		throw new Error("Missing SMTP config. Required: SMTP_HOST, SMTP_PORT");
	}

	return { host, portRaw };
};

const getSmtpRuntimeConfig = (): SmtpEmailRuntimeConfig => {
	const { host, portRaw } = getSmtpEndpoint();
	const user = optionalTrimmed(process.env.SMTP_USER);
	const pass = optionalTrimmed(
		process.env.SMTP_PASSWORD ?? process.env.SMTP_PASS,
	);
	const secure = (process.env.SMTP_SECURE ?? "false").toLowerCase() === "true";

	return {
		provider: "smtp",
		host,
		port: parseSmtpPort(portRaw),
		secure,
		user,
		pass,
		from: resolveSender({
			senderName: process.env.SMTP_SENDER_NAME,
			senderEmail: process.env.SMTP_SENDER_EMAIL,
			user,
		}),
		replyTo: optionalTrimmed(process.env.SMTP_REPLY_TO),
	};
};

const getEmailRuntimeConfig = (): EmailRuntimeConfig => {
	const provider = getEmailProvider();
	if (provider === "noop") {
		return { provider: "noop" };
	}
	if (provider !== "smtp") {
		throw new Error(
			`Unsupported EMAIL_PROVIDER: ${provider}. Supported values: "smtp", "noop".`,
		);
	}

	return getSmtpRuntimeConfig();
};

// Fail fast during module initialization when SMTP is enabled but misconfigured.
const emailRuntimeConfig = getEmailRuntimeConfig();

export async function sendTemplatedEmail({
	to,
	subject,
	templatePath,
	variables = {},
}: SendTemplatedEmailArgs): Promise<SendTemplatedEmailResult> {
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
			return getSmtpResultDetails(result);
		},
	);
}
