import { NextRequest, NextResponse } from "next/server";
import { allowedLocales, serverSideTranslation } from "@/i18n";
import { parseCsv } from "@/lib/utils/csvUtils";
import { getCurrentUserId } from "@/server/actions/auth";
import { institutionRepo } from "@/server/data/institutionRepo";
import { logger } from "@/server/logging/logger";
import {
	runWithNextRequestContext,
	setRequestContext,
} from "@/server/logging/requestContext";
import { canImportInstitutions } from "@/server/logic/institutionAccess";
import { buildInstitutionCreateData } from "@/server/logic/institutionCreateData";
import {
	planInstitutionImport,
	resolveImportColumns,
	type ImportPlan,
	type ImportTranslateFn,
} from "@/server/logic/institutionImport";
import { buildInstitutionUpdateData } from "@/server/logic/institutionUpdateData";
import { prisma } from "@/server/prisma";
import { revalidateAccount } from "@/server/utils/actionsUtils";
import {
	authorizeFields,
	getAccessContextForUser,
	type AccessContext,
} from "@/server/utils/rbac";
import {
	INSTITUTION_IMPORT_MAX_FILE_BYTES,
	type InstitutionImportResponse,
} from "@/types/institutionImport";

const MAX_REPORTED_ISSUES = 20;
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

const respond = (body: InstitutionImportResponse, status = 200) =>
	NextResponse.json(body, { status });

const isCsvFile = (file: File) =>
	file.name.toLowerCase().endsWith(".csv") ||
	["text/csv", "application/vnd.ms-excel"].includes(file.type);

const loadTranslators = async () => {
	const entries = await Promise.all(
		allowedLocales.map(async (locale) => {
			const { t } = await serverSideTranslation(locale);
			return [locale, t as unknown as ImportTranslateFn] as const;
		}),
	);
	return Object.fromEntries(entries);
};

const loadLookups = async () => {
	const [categories, tags, groups] = await Promise.all([
		prisma.category.findMany({
			where: { status: "active" },
			select: { id: true, key: true, parent_category_id: true },
		}),
		prisma.tag.findMany({ select: { id: true, name: true } }),
		prisma.group.findMany({ select: { id: true, name: true } }),
	]);
	return { categories, tags, groups };
};

const collectRowIds = (rows: string[][], idColumnIndex: number) =>
	rows
		.map((row) => Number((row[idColumnIndex] ?? "").trim()))
		.filter((id) => Number.isInteger(id) && id > 0);

const authorizePlanFields = (ctx: AccessContext, plan: ImportPlan) => {
	plan.creates.forEach(({ permissionFields }) =>
		authorizeFields(ctx, "institution", permissionFields, "create"),
	);
	plan.updates.forEach(({ permissionFields }) =>
		authorizeFields(ctx, "institution", permissionFields, "update"),
	);
};

// Rows are validated up front, so writes only fail on database errors.
const writePlan = async (plan: ImportPlan, currentUserId: string) => {
	const counts = { created: 0, updated: 0 };
	try {
		for (const { form } of plan.updates) {
			await institutionRepo.update(
				form.id,
				buildInstitutionUpdateData(form, currentUserId),
			);
			counts.updated++;
		}
		for (const { form } of plan.creates) {
			await institutionRepo.create(
				buildInstitutionCreateData(form, currentUserId),
			);
			counts.created++;
		}
		return { ok: true as const, ...counts };
	} catch (error) {
		logger.error("institution.import.write_failed", error, {
			subsystem: "institution",
			db_subsystem: "db",
			actor_user_id: currentUserId,
			created_count: counts.created,
			updated_count: counts.updated,
		});
		return { ok: false as const, ...counts };
	}
};

const readCsvRows = async (
	request: NextRequest,
): Promise<{ rows: string[][] } | { error: NextResponse }> => {
	// Reject oversized uploads before the body is buffered; multipart adds some overhead.
	const contentLength = Number(request.headers.get("content-length") ?? 0);
	if (
		contentLength >
		INSTITUTION_IMPORT_MAX_FILE_BYTES + MULTIPART_OVERHEAD_BYTES
	) {
		return { error: respond({ ok: false, error: "fileTooLarge" }, 413) };
	}
	const formData = await request.formData().catch(() => null);
	const file = formData?.get("file");
	if (!(file instanceof File) || !isCsvFile(file)) {
		return { error: respond({ ok: false, error: "invalidFile" }, 400) };
	}
	if (file.size > INSTITUTION_IMPORT_MAX_FILE_BYTES) {
		return { error: respond({ ok: false, error: "fileTooLarge" }, 413) };
	}
	let rows: string[][];
	try {
		rows = parseCsv(await file.text());
	} catch {
		return { error: respond({ ok: false, error: "invalidFile" }, 400) };
	}
	if (rows.length < 2) {
		return { error: respond({ ok: false, error: "emptyFile" }, 400) };
	}
	return { rows };
};

const buildImportPlan = async (
	csvRows: string[][],
): Promise<{ plan: ImportPlan } | { error: NextResponse }> => {
	const [headers, ...rows] = csvRows;
	const translators = await loadTranslators();
	const columns = resolveImportColumns(headers, translators);
	if (!columns.ok) {
		return {
			error: respond(
				{ ok: false, error: columns.error, columns: columns.columns },
				400,
			),
		};
	}

	const rowIds = collectRowIds(rows, columns.keys.indexOf("id"));
	const [existingInstitutions, lookups] = await Promise.all([
		institutionRepo.listByIds(rowIds),
		loadLookups(),
	]);
	const plan = planInstitutionImport({
		headers,
		keys: columns.keys,
		rows,
		t: translators[columns.locale],
		lookups,
		existingById: new Map(
			existingInstitutions.map((institution) => [institution.id, institution]),
		),
	});
	if (plan.issues.length > 0) {
		return {
			error: respond(
				{
					ok: false,
					error: "validationFailed",
					issues: plan.issues.slice(0, MAX_REPORTED_ISSUES),
					issueCount: plan.issues.length,
				},
				422,
			),
		};
	}
	return { plan };
};

const importInstitutions = async (request: NextRequest) => {
	const currentUserId = await getCurrentUserId();
	if (!currentUserId) return respond({ ok: false, error: "unauthorized" }, 401);
	setRequestContext({ userId: currentUserId });

	const ctx = await getAccessContextForUser(currentUserId);
	if (!canImportInstitutions(ctx)) {
		return respond({ ok: false, error: "forbidden" }, 403);
	}

	const csv = await readCsvRows(request);
	if ("error" in csv) return csv.error;
	const planned = await buildImportPlan(csv.rows);
	if ("error" in planned) return planned.error;
	const { plan } = planned;

	try {
		authorizePlanFields(ctx, plan);
	} catch {
		return respond({ ok: false, error: "forbidden" }, 403);
	}

	const result = await writePlan(plan, currentUserId);
	if (result.created > 0 || result.updated > 0) revalidateAccount();
	if (!result.ok) {
		return respond(
			{
				ok: false,
				error: "writeFailed",
				created: result.created,
				updated: result.updated,
			},
			500,
		);
	}

	logger.info("institution.import.completed", {
		subsystem: "institution",
		actor_user_id: currentUserId,
		created_count: result.created,
		updated_count: result.updated,
		unchanged_count: plan.unchangedCount,
	});
	return respond({
		ok: true,
		created: result.created,
		updated: result.updated,
		unchanged: plan.unchangedCount,
	});
};

export async function POST(request: NextRequest) {
	return runWithNextRequestContext(
		request,
		async () => {
			try {
				return await importInstitutions(request);
			} catch (error) {
				logger.error("institution.import.failed", error, {
					subsystem: "institution",
				});
				return respond({ ok: false, error: "unexpected" }, 500);
			}
		},
		{ route: "/api/institutions/import" },
	);
}
