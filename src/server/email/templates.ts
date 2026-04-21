import fs from "node:fs/promises";
import path from "node:path";
import { emailTemplateRepo } from "@/server/data/emailTemplateRepo";
import { logger } from "@/server/logging/logger";

const EMAIL_TEMPLATE_ROOT = path.join(process.cwd(), "public", "api", "emails");
const TEMPLATE_PATH_PATTERN = /^[a-zA-Z0-9/_-]+\.html$/;

export function normalizeEmailTemplatePath(templatePath: string | string[]) {
	const normalized = Array.isArray(templatePath)
		? templatePath.join("/")
		: templatePath;

	if (!TEMPLATE_PATH_PATTERN.test(normalized)) {
		throw new Error(`Invalid template path: ${normalized}`);
	}

	return normalized;
}

const getTemplateAbsolutePath = (templatePath: string) => {
	const normalized = normalizeEmailTemplatePath(templatePath);
	const absolutePath = path.resolve(EMAIL_TEMPLATE_ROOT, normalized);
	if (!absolutePath.startsWith(EMAIL_TEMPLATE_ROOT)) {
		throw new Error("Template path traversal is not allowed.");
	}
	return absolutePath;
};

export async function loadEmailTemplateHtml(templatePath: string | string[]) {
	const normalized = normalizeEmailTemplatePath(templatePath);

	try {
		const html = await emailTemplateRepo.getHtmlByPath(normalized);
		if (html !== null) return html;
	} catch (error) {
		logger.warn("email.template.db_lookup.failed", {
			subsystem: "email",
			template: normalized,
			error: error instanceof Error ? error.message : String(error),
		});
	}

	return fs.readFile(getTemplateAbsolutePath(normalized), "utf8");
}
