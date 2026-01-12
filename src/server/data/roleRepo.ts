import { prisma } from "@/server/prisma";
import { RoleUpdateInput, RoleCreateInput } from "@/types/role";

const include = {
	field_permissions: true,
	users: true,
} as const;

export const roleRepo = {
	list: () => prisma.role.findMany({ include }),
	create: (data: RoleCreateInput) =>
		prisma.role.create({
			data: {
				name: data.name,
				description: data.description ?? null,
				permissions: data.permissions ?? null,
				fieldPermissions: data.fieldPermissions
					? {
							create: data.fieldPermissions.map((permission) => ({
								field_name: permission.field_name,
								action: permission.action,
							})),
						}
					: undefined,
			},
			include,
		}),
	update: (id: number, data: RoleUpdateInput) =>
		prisma.role.update({
			where: { id },
			data: {
				name: data.name,
				description: data.description ?? undefined,
				permissions: data.permissions ?? undefined,
				fieldPermissions: data.fieldPermissions
					? {
							deleteMany: {},
							create: data.fieldPermissions.map((permission) => ({
								field_name: permission.field_name,
								action: permission.action,
							})),
						}
					: undefined,
			},
			include,
		}),
	remove: (id: number) => prisma.role.delete({ where: { id } }),
};
