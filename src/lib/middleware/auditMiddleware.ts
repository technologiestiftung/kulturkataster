import { Prisma, type PrismaClient } from "../../generated/prisma";
import { ContextManager } from "./contextMiddleware";

// Models to track
const AUDITED_MODELS = [
	"Institution",
	"Address",
	"ContactPerson",
	"Category",
	"Tag",
] as const;

type AuditedModel = (typeof AUDITED_MODELS)[number];

// Map Prisma model names to audit entity types
const MODEL_TO_ENTITY_TYPE: Record<AuditedModel, string> = {
	Institution: "institution",
	Address: "address",
	ContactPerson: "contact_person",
	Category: "category",
	Tag: "tag",
};

// A factory function that creates and returns Prisma middleware
export function createAuditMiddleware(client: PrismaClient) {
	// Check if model should be audited
	const shouldAudit = (model: string): model is AuditedModel => {
		return AUDITED_MODELS.includes(model as AuditedModel);
	};

	// Fetch current state before update/delete
	const fetchCurrent = async (model: AuditedModel, id: string | number) => {
		const modelClient = (
			client as unknown as Record<
				string,
				{
					findUnique: (args: {
						where: { id: string | number };
					}) => Promise<unknown>;
				}
			>
		)[model.toLowerCase()];
		return modelClient.findUnique({ where: { id } });
	};

	// Create audit log entry
	const createAuditLog = async (
		action: "create" | "update" | "delete",
		model: AuditedModel,
		entityId: string | number,
		oldData: unknown = null,
		newData: unknown = null,
	) => {
		const userId = ContextManager.getUserId();

		await (
			client as unknown as {
				entityAudit: {
					create: (args: {
						data: {
							action: string;
							entity_type: string;
							entity_id: string;
							old_data: unknown;
							new_data: unknown;
							changed_by: string | null;
						};
					}) => Promise<unknown>;
				};
			}
		).entityAudit.create({
			data: {
				action,
				entity_type: MODEL_TO_ENTITY_TYPE[model],
				entity_id: String(entityId),
				old_data: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
				new_data: newData ? JSON.parse(JSON.stringify(newData)) : null,
				changed_by: userId || null,
			},
		});
	};

	return Prisma.defineExtension({
		query: {
			$allModels: {
				// CREATE operation
				async create({ args, query, model }) {
					if (!shouldAudit(model)) {
						return query(args);
					}

					const result = await query(args);

					await createAuditLog(
						"create",
						model,
						(result as { id: string | number }).id,
						null,
						result,
					);

					return result;
				},

				// UPDATE operation
				async update({ args, query, model }) {
					if (!shouldAudit(model)) {
						return query(args);
					}

					const id = (args as { where?: { id?: string | number } }).where?.id;
					const oldData = await fetchCurrent(model, id!);
					const result = await query(args);

					await createAuditLog("update", model, id!, oldData, result);

					return result;
				},

				// DELETE operation
				async delete({ args, query, model }) {
					if (!shouldAudit(model)) {
						return query(args);
					}

					const id = (args as { where?: { id?: string | number } }).where?.id;
					const oldData = await fetchCurrent(model, id!);
					const result = await query(args);

					await createAuditLog("delete", model, id!, oldData, null);

					return result;
				},
			},
		},
	});
}
