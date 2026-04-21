import { loadEmailTemplateHtml } from "@/server/email/templates";
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
		const html = await loadEmailTemplateHtml(templatePath);
		return new NextResponse(html, {
			headers: {
				"content-type": "text/html; charset=utf-8",
			},
		});
	} catch {
		return new NextResponse("Not found", { status: 404 });
	}
}
