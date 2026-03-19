import { prisma } from "@/server/prisma";
import { RoleUpdateInput, RoleCreateInput } from "@/types/role";

const include = {
	table_permissions: true,
	field_permissions: true,
	users: true,
} as const;

export const roleRepo = {
	list: () => prisma.role.findMany({ include }),
	findById: (id: number) =>
		prisma.role.findUnique({
			where: { id },
			include,
		}),
	create: (data: RoleCreateInput) =>
		prisma.$transaction(async (tx) => {
			if (data.is_guest) {
				await tx.role.updateMany({
					where: { is_guest: true },
					data: { is_guest: false },
				});
			}

			return tx.role.create({
				data: {
					name: data.name,
					description: data.description ?? null,
					is_guest: data.is_guest ?? false,
					table_permissions: data.tablePermissions
						? {
								create: data.tablePermissions.map((permission) => ({
									table: permission.table,
									action: permission.action,
									scope: permission.scope ?? "own",
								})),
							}
						: undefined,
					field_permissions: data.fieldPermissions
						? {
								create: data.fieldPermissions.map((permission) => ({
									table: permission.table,
									field: permission.field,
									action: permission.action,
								})),
							}
						: undefined,
				},
				include,
			});
		}),
	update: (id: number, data: RoleUpdateInput) =>
		prisma.$transaction(async (tx) => {
			if (data.is_guest) {
				await tx.role.updateMany({
					where: {
						is_guest: true,
						NOT: { id },
					},
					data: { is_guest: false },
				});
			}

			return tx.role.update({
				where: { id },
				data: {
					name: data.name,
					description: data.description ?? undefined,
					is_guest: data.is_guest,
					table_permissions: data.tablePermissions
						? {
								deleteMany: {},
								create: data.tablePermissions.map((permission) => ({
									table: permission.table,
									action: permission.action,
									scope: permission.scope ?? "own",
								})),
							}
						: undefined,
					field_permissions: data.fieldPermissions
						? {
								deleteMany: {},
								create: data.fieldPermissions.map((permission) => ({
									table: permission.table,
									field: permission.field,
									action: permission.action,
								})),
							}
						: undefined,
				},
				include,
			});
		}),
	remove: (id: number) => prisma.role.delete({ where: { id } }),
};
