import { loadEmailTemplateBody } from "@/server/email/templates";
import { isMarkdownTemplate, mdToEmailHtml } from "@/server/email/mdToEmailHtml";
import { NextResponse } from "next/server";

type EmailTemplateRouteContext = {
	params: Promise<{ templatePath: string[] }>;
};

export async function GET(
	_request: Request,
	{ params }: EmailTemplateRouteContext,
) {
	try {
		const { templatePath } = await params;
		const raw = await loadEmailTemplateBody(templatePath);
		const html = isMarkdownTemplate(raw)
			? await mdToEmailHtml(raw, "[Preview]")
			: raw;
		return new NextResponse(html, {
			headers: {
				"content-type": "text/html; charset=utf-8",
			},
		});
	} catch {
		return new NextResponse("Not found", { status: 404 });
	}
}
