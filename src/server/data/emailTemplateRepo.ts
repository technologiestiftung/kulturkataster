import { prisma } from "@/server/prisma";

export type EmailTemplateOption = {
	key: string;
	path: string;
	name: string | null;
	subject: string | null;
};

const optionSelect = {
	key: true,
	path: true,
	name: true,
	subject: true,
} as const;

export const emailTemplateRepo = {
	getHtmlByPath: async (templatePath: string): Promise<string | null> => {
		const row = await prisma.emailTemplate.findFirst({
			where: { path: templatePath, is_active: true },
			select: { html: true },
		});
		return row?.html ?? null;
	},

	listActiveCustom: (): Promise<EmailTemplateOption[]> =>
		prisma.emailTemplate.findMany({
			where: { kind: "custom", is_active: true },
			select: optionSelect,
			orderBy: [{ name: "asc" }, { path: "asc" }],
		}),

	findActiveByPath: async (
		templatePath: string,
	): Promise<EmailTemplateOption | null> => {
		const row = await prisma.emailTemplate.findFirst({
			where: { path: templatePath, is_active: true },
			select: optionSelect,
		});
		return row ?? null;
	},
};
