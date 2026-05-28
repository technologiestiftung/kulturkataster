import { prisma } from "@/server/prisma";
import { RoleUpdateInput, RoleCreateInput } from "@/types/role";

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

export const roleRepo = {
	list: () => prisma.role.findMany({ include }),
	findById: (id: number) =>
		prisma.role.findUnique({
			where: { id },
			include,
		}),
	create: (data: RoleCreateInput) => {
		const tablePermissions = dedupeTablePermissions(data.tablePermissions);
		const fieldPermissions = dedupeFieldPermissions(data.fieldPermissions);

		return prisma.role.create({
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
	},
	update: (id: number, data: RoleUpdateInput) => {
		const tablePermissions = dedupeTablePermissions(data.tablePermissions);
		const fieldPermissions = dedupeFieldPermissions(data.fieldPermissions);
		return prisma.$transaction(async (tx) => {
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
