import { ActivityStatus, Prisma } from "./generated/prisma";
import { getAuditContext } from "@/server/utils/auditContext";
import { createClient } from "@/server/supabase/server";
import { logger } from "@/server/logging/logger";

type AuditAction = "create" | "update" | "delete";
type AuditEntityType =
	| "institution"
	| "address"
	| "contact_person"
	| "category"
	| "tag"
	| "user"
	| "role"
	| "group"
	| "submission"
	| "role_table_permission"
	| "role_field_permission"
	| "funding_source";

type ModelAuditConfig = {
	delegate: string;
	entityType: AuditEntityType;
};

const MODEL_AUDIT_CONFIG: Record<string, ModelAuditConfig> = {
	Institution: { delegate: "institution", entityType: "institution" },
	Address: { delegate: "address", entityType: "address" },
	ContactPerson: { delegate: "contactPerson", entityType: "contact_person" },
	Category: { delegate: "category", entityType: "category" },
	Tag: { delegate: "tag", entityType: "tag" },
	User: { delegate: "user", entityType: "user" },
	Role: { delegate: "role", entityType: "role" },
	Group: { delegate: "group", entityType: "group" },
	Submission: { delegate: "submission", entityType: "submission" },
	RoleTablePermission: {
		delegate: "roleTablePermission",
		entityType: "role_table_permission",
	},
	RoleFieldPermission: {
		delegate: "roleFieldPermission",
		entityType: "role_field_permission",
	},
	FundingSource: { delegate: "fundingSource", entityType: "funding_source" },
};

type GenericDelegate = {
	findFirst?: (args: { where?: unknown }) => Promise<unknown>;
	findMany?: (args: { where?: unknown }) => Promise<unknown[]>;
};

type AuditClient = {
	entityAudit: {
		create: (args: {
			data: Prisma.EntityAuditUncheckedCreateInput;
		}) => Promise<unknown>;
	};
};

const safeClone = (value: unknown) => {
	if (value === null || typeof value === "undefined") return value;
	try {
		return JSON.parse(JSON.stringify(value));
	} catch {
		return value;
	}
};

const asAuditJson = (value: unknown) => {
	if (value === null || typeof value === "undefined") {
		return Prisma.JsonNull;
	}
	return safeClone(value) as Prisma.InputJsonValue;
};

const buildAuditMetaInfo = () => {
	const auditContext = getAuditContext();
	if (!auditContext) return Prisma.JsonNull;
	return {
		correlation_id: auditContext.correlationId,
		root_entity_type: auditContext.rootEntityType,
		root_entity_id: auditContext.rootEntityId,
		intent: auditContext.intent,
	} satisfies Prisma.InputJsonObject;
};

const resolveCurrentUserIdFromSupabase = async (): Promise<string | null> => {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		return user?.id ?? null;
	} catch {
		return null;
	}
};

export function createAuditMiddleware(client: AuditClient) {
	const shouldAudit = (model: string | undefined): model is string =>
		Boolean(model && MODEL_AUDIT_CONFIG[model]);

	const getDelegate = (model: string): GenericDelegate | null => {
		const config = MODEL_AUDIT_CONFIG[model];
		if (!config) return null;
		const delegate = (client as Record<string, unknown>)[config.delegate] as
			| GenericDelegate
			| undefined;
		return delegate ?? null;
	};

	const fetchCurrent = async (model: string, where?: unknown) => {
		if (!where) return null;
		const delegate = getDelegate(model);
		if (!delegate?.findFirst) return null;
		try {
			return await delegate.findFirst({ where });
		} catch {
			return null;
		}
	};

	const fetchMany = async (model: string, where?: unknown) => {
		const delegate = getDelegate(model);
		if (!delegate?.findMany) return [];
		try {
			return await delegate.findMany({ where });
		} catch {
			return [];
		}
	};

	const createAuditLog = async (
		action: AuditAction,
		model: string,
		entityId: string | number,
		oldData: unknown = null,
		newData: unknown = null,
	) => {
		const config = MODEL_AUDIT_CONFIG[model];
		if (!config) return;
		try {
			const auditContext = getAuditContext();
			const userId =
				typeof auditContext?.actorUserId !== "undefined"
					? auditContext.actorUserId
					: await resolveCurrentUserIdFromSupabase();
			const status: ActivityStatus =
				model === "Submission" ? "approval_pending" : "completed";
			await client.entityAudit.create({
				data: {
					action,
					entity_type: config.entityType,
					entity_id: String(entityId),
					old_data: asAuditJson(oldData),
					new_data: asAuditJson(newData),
					meta_info: buildAuditMetaInfo(),
					status,
					changed_by: userId,
				},
			});
		} catch (error) {
			logger.warn("audit.persist.failed", {
				action,
				model,
				entityId,
				subsystem: "db",
				error,
			});
		}
	};

	return Prisma.defineExtension({
		query: {
			$allModels: {
				async create({ args, query, model }) {
					if (!shouldAudit(model)) return query(args);
					const result = await query(args);
					const entityId =
						(result as { id?: string | number } | null)?.id ?? "unknown";
					await createAuditLog("create", model, entityId, null, result);
					return result;
				},
				async createMany({ args, query, model }) {
					if (!shouldAudit(model)) return query(args);
					const result = await query(args);
					await createAuditLog("create", model, "bulk", null, { args, result });
					return result;
				},
				async createManyAndReturn({ args, query, model }) {
					if (!shouldAudit(model)) return query(args);
					const result = await query(args);
					const rows = Array.isArray(result) ? result : [];
					if (rows.length === 0) {
						await createAuditLog("create", model, "bulk", null, {
							args,
							result,
						});
						return result;
					}
					await Promise.all(
						rows.map((row) =>
							createAuditLog(
								"create",
								model,
								(row as { id?: string | number } | null)?.id ?? "unknown",
								null,
								row,
							),
						),
					);
					return result;
				},
				async update({ args, query, model }) {
					if (!shouldAudit(model)) return query(args);
					const where = (args as { where?: unknown }).where;
					const oldData = await fetchCurrent(model, where);
					const result = await query(args);
					const entityId =
						(result as { id?: string | number } | null)?.id ??
						(oldData as { id?: string | number } | null)?.id ??
						"unknown";
					await createAuditLog("update", model, entityId, oldData, result);
					return result;
				},
				async updateMany({ args, query, model }) {
					if (!shouldAudit(model)) return query(args);
					const where = (args as { where?: unknown }).where;
					const oldRows = await fetchMany(model, where);
					const result = await query(args);
					await createAuditLog("update", model, "bulk", oldRows, {
						args,
						result,
					});
					return result;
				},
				async updateManyAndReturn({ args, query, model }) {
					if (!shouldAudit(model)) return query(args);
					const where = (args as { where?: unknown }).where;
					const oldRows = await fetchMany(model, where);
					const result = await query(args);
					const newRows = Array.isArray(result) ? result : [];
					await createAuditLog("update", model, "bulk", oldRows, newRows);
					return result;
				},
				async upsert({ args, query, model }) {
					if (!shouldAudit(model)) return query(args);
					const where = (args as { where?: unknown }).where;
					const oldData = await fetchCurrent(model, where);
					const result = await query(args);
					const action: AuditAction = oldData ? "update" : "create";
					const entityId =
						(result as { id?: string | number } | null)?.id ?? "unknown";
					await createAuditLog(action, model, entityId, oldData, result);
					return result;
				},
				async delete({ args, query, model }) {
					if (!shouldAudit(model)) return query(args);
					const where = (args as { where?: unknown }).where;
					const oldData = await fetchCurrent(model, where);
					const result = await query(args);
					const entityId =
						(result as { id?: string | number } | null)?.id ??
						(oldData as { id?: string | number } | null)?.id ??
						"unknown";
					await createAuditLog("delete", model, entityId, oldData, null);
					return result;
				},
				async deleteMany({ args, query, model }) {
					if (!shouldAudit(model)) return query(args);
					const where = (args as { where?: unknown }).where;
					const oldRows = await fetchMany(model, where);
					const result = await query(args);
					await createAuditLog("delete", model, "bulk", oldRows, {
						args,
						result,
					});
					return result;
				},
			},
		},
	});
}
