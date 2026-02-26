import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

type EmailTemplateType =
	| "confirmation"
	| "recovery"
	| "invite"
	| "email_change"
	| "magic_link"
	| "reauthentication";

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
	if (segment === "confirm-signup") return "confirmation";
	if (segment === "recover-password") return "recovery";
	if (segment === "invite-user") return "invite";
	if (segment === "change-email") return "email_change";
	if (segment === "magic-link") return "magic_link";
	return null;
};

const templateFileMap: Record<EmailTemplateType, string> = {
	confirmation: "confirmation.html",
	recovery: "recovery.html",
	invite: "invite.html",
	email_change: "email_change.html",
	magic_link: "magic_link.html",
	reauthentication: "reauthentication.html",
};

const loadTemplateHtml = async (template: EmailTemplateType) => {
	const fullPath = path.join(
		process.cwd(),
		"src",
		"emailTemplates",
		"auth",
		templateFileMap[template],
	);
	return readFile(fullPath, "utf8");
};

const respond = async (template: EmailTemplateType) => {
	const html = await loadTemplateHtml(template);
	return new NextResponse(html, {
		headers: { "Content-Type": "text/html; charset=utf-8" },
	});
};

export async function GET(request: NextRequest) {
	const template = getTemplateFromPath(request);
	if (!template) {
		return NextResponse.json(
			{ error: "Unsupported email template type." },
			{ status: 404 },
		);
	}
	return respond(template);
}

export async function POST(request: NextRequest) {
	const template = getTemplateFromPath(request);
	if (!template) {
		return NextResponse.json(
			{ error: "Unsupported email template type." },
			{ status: 404 },
		);
	}
	return respond(template);
}
