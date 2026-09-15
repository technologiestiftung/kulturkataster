import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	createTransport,
	sendMail,
	loadEmailTemplateBody,
	mdToEmailHtml,
	loggerInfo,
	loggerTime,
} = vi.hoisted(() => ({
	createTransport: vi.fn(),
	sendMail: vi.fn(),
	loadEmailTemplateBody: vi.fn(),
	mdToEmailHtml: vi.fn(),
	loggerInfo: vi.fn(),
	loggerTime: vi.fn(),
}));

vi.mock("nodemailer", () => ({
	default: {
		createTransport,
	},
}));

vi.mock("@/server/email/templates", () => ({
	loadEmailTemplateBody,
}));

vi.mock("@/server/email/mdToEmailHtml", () => ({
	isMarkdownTemplate: vi.fn(() => false),
	mdToEmailHtml,
}));

vi.mock("@/server/logging/logger", () => ({
	logger: {
		info: loggerInfo,
		time: loggerTime,
	},
}));

const ORIGINAL_ENV = process.env;

const importMailer = async () => {
	vi.resetModules();
	return import("@/server/email/sendTemplatedEmail");
};

describe("sendTemplatedEmail", () => {
	beforeEach(() => {
		process.env = { ...ORIGINAL_ENV };
		process.env.EMAIL_PROVIDER = "smtp";
		process.env.SMTP_HOST = "smtp.example.test";
		process.env.SMTP_PORT = "587";
		process.env.SMTP_SECURE = "false";
		delete process.env.SMTP_PASSWORD;
		delete process.env.SMTP_PASS;
		delete process.env.SMTP_SENDER_EMAIL;
		delete process.env.SMTP_SENDER_NAME;
		delete process.env.SMTP_USER;

		createTransport.mockReset();
		sendMail.mockReset();
		loadEmailTemplateBody.mockReset();
		mdToEmailHtml.mockReset();
		loggerInfo.mockReset();
		loggerTime.mockReset();

		createTransport.mockReturnValue({ sendMail });
		sendMail.mockResolvedValue({
			messageId: "message-1",
			accepted: ["person@example.test"],
			rejected: [],
			response: "250 queued",
		});
		loadEmailTemplateBody.mockResolvedValue("<p>Hello {{ .Email }}</p>");
		loggerTime.mockImplementation(async (_metadata, callback) => callback());
	});

	it("passes a structured sender name and address to Nodemailer", async () => {
		process.env.SMTP_SENDER_NAME = "Kulturkataster";
		process.env.SMTP_SENDER_EMAIL = "no-reply@example.test";

		const { sendTemplatedEmail } = await importMailer();

		const result = await sendTemplatedEmail({
			to: "person@example.test",
			subject: "Welcome",
			templatePath: "custom/welcome.html",
			variables: { Email: "person@example.test" },
		});

		expect(sendMail).toHaveBeenCalledWith(
			expect.objectContaining({
				from: {
					name: "Kulturkataster",
					address: "no-reply@example.test",
				},
			}),
		);
		expect(result).toEqual({
			id: "message-1",
			accepted: ["person@example.test"],
			rejected: [],
			response: "250 queued",
		});
	});

	it("keeps backward compatibility with a combined sender mailbox", async () => {
		process.env.SMTP_SENDER_NAME = "Kulturkataster <no-reply@example.test>";

		const { sendTemplatedEmail } = await importMailer();

		await sendTemplatedEmail({
			to: "person@example.test",
			subject: "Welcome",
			templatePath: "custom/welcome.html",
		});

		expect(sendMail).toHaveBeenCalledWith(
			expect.objectContaining({
				from: {
					name: "Kulturkataster",
					address: "no-reply@example.test",
				},
			}),
		);
	});
});
