import { prisma } from "@/server/prisma";
import {
	RoleUpdateInput,
	RoleCreateInput,
	type RoleFieldOrderState,
} from "@/types/role";

const include = {
	table_permissions: true,
	field_permissions: true,
	users: true,
} as const;

const dedupeTablePermissions = (
	permissions?: RoleCreateInput["tablePermissions"],
) => {
	if (!permissions) return undefined;

	const uniquePermissions = new Map<
		string,
		Required<NonNullable<RoleCreateInput["tablePermissions"]>[number]>
	>();

	permissions.forEach((permission) => {
		uniquePermissions.set(`${permission.table}:${permission.action}`, {
			...permission,
			scope: permission.scope ?? "own",
		});
	});

	return [...uniquePermissions.values()];
};

const dedupeFieldPermissions = (
	permissions?: RoleCreateInput["fieldPermissions"],
) => {
	if (!permissions) return undefined;

	const uniquePermissions = new Map<
		string,
		NonNullable<RoleCreateInput["fieldPermissions"]>[number]
	>();

	permissions.forEach((permission) => {
		uniquePermissions.set(
			`${permission.table}:${permission.field}:${permission.action}`,
			permission,
		);
	});

	return [...uniquePermissions.values()];
};

const normalizeFieldOrder = (fieldOrder?: RoleCreateInput["fieldOrder"]) => {
	if (!fieldOrder) return undefined;
	const seen = new Set<string>();
	return {
		table: fieldOrder.table,
		fields: fieldOrder.fields.filter((field) => {
			if (seen.has(field)) return false;
			seen.add(field);
			return true;
		}),
	};
};

const upsertFieldOrder = async (
	tx: Pick<typeof prisma, "permissionFieldOrder">,
	fieldOrder?: ReturnType<typeof normalizeFieldOrder>,
) => {
	if (!fieldOrder) return;

	const existingOrders = await tx.permissionFieldOrder.findMany({
		where: { table: fieldOrder.table },
		orderBy: [{ sort_order: "asc" }, { field: "asc" }],
	});
	const pinnedFields = new Set(
		existingOrders
			.filter((order) => order.is_pinned)
			.map((order) => order.field),
	);
	const pinnedOrder = existingOrders
		.filter((order) => order.is_pinned)
		.map((order) => order.field);
	const mutableFields = fieldOrder.fields.filter(
		(field) => !pinnedFields.has(field),
	);
	const orderedFields = Array.from(new Set([...pinnedOrder, ...mutableFields]));

	await Promise.all(
		orderedFields.map((field, sortOrder) =>
			tx.permissionFieldOrder.upsert({
				where: {
					table_field: {
						table: fieldOrder.table,
						field,
					},
				},
				create: {
					table: fieldOrder.table,
					field,
					sort_order: sortOrder,
					is_pinned: pinnedFields.has(field),
				},
				update: {
					sort_order: sortOrder,
				},
			}),
		),
	);
};

export const roleRepo = {
	list: () => prisma.role.findMany({ include }),
	findById: (id: number) =>
		prisma.role.findUnique({
			where: { id },
			include,
		}),
	getFieldOrder: async (table: string): Promise<RoleFieldOrderState> => {
		const fieldOrder = await prisma.permissionFieldOrder.findMany({
			where: { table },
			orderBy: [{ sort_order: "asc" }, { field: "asc" }],
		});
		return {
			fields: fieldOrder.map((item) => item.field),
			pinnedFields: fieldOrder
				.filter((item) => item.is_pinned)
				.map((item) => item.field),
		};
	},
	create: (data: RoleCreateInput) => {
		const tablePermissions = dedupeTablePermissions(data.tablePermissions);
		const fieldPermissions = dedupeFieldPermissions(data.fieldPermissions);
		const fieldOrder = normalizeFieldOrder(data.fieldOrder);

		return prisma.$transaction(async (tx) => {
			await upsertFieldOrder(tx, fieldOrder);
			return tx.role.create({
				data: {
					name: data.name,
					description: data.description ?? null,
					is_guest: data.is_guest ?? false,
					table_permissions: tablePermissions
						? {
								create: tablePermissions.map((permission) => ({
									table: permission.table,
									action: permission.action,
									scope: permission.scope,
								})),
							}
						: undefined,
					field_permissions: fieldPermissions
						? {
								create: fieldPermissions.map((permission) => ({
									table: permission.table,
									field: permission.field,
									action: permission.action,
								})),
							}
						: undefined,
				},
				include,
			});
		});
	},
	update: (id: number, data: RoleUpdateInput) => {
		const tablePermissions = dedupeTablePermissions(data.tablePermissions);
		const fieldPermissions = dedupeFieldPermissions(data.fieldPermissions);
		const fieldOrder = normalizeFieldOrder(data.fieldOrder);
		return prisma.$transaction(async (tx) => {
			await upsertFieldOrder(tx, fieldOrder);

			await tx.role.update({
				where: { id },
				data: {
					name: data.name,
					description: data.description ?? undefined,
					is_guest: data.is_guest,
				},
			});

			if (tablePermissions) {
				await tx.roleTablePermission.deleteMany({
					where: { role_id: id },
				});

				if (tablePermissions.length > 0) {
					await tx.roleTablePermission.createMany({
						data: tablePermissions.map((permission) => ({
							role_id: id,
							table: permission.table,
							action: permission.action,
							scope: permission.scope,
						})),
					});
				}
			}

			if (fieldPermissions) {
				await tx.roleFieldPermission.deleteMany({
					where: { role_id: id },
				});

				if (fieldPermissions.length > 0) {
					await tx.roleFieldPermission.createMany({
						data: fieldPermissions.map((permission) => ({
							role_id: id,
							table: permission.table,
							field: permission.field,
							action: permission.action,
						})),
					});
				}
			}

			return tx.role.findUniqueOrThrow({
				where: { id },
				include,
			});
		});
	},
	remove: (id: number) => prisma.role.delete({ where: { id } }),
};
