import type { Prisma } from "@/generated/prisma";

export type PrismaRoleWithRelations = Prisma.RoleGetPayload<{
	include: {
		field_permissions: true;
		users: true;
	};
}>;

export type Role = PrismaRoleWithRelations;

export type RolePermissionInput = {
	field_name: string;
	action: "read" | "create" | "update" | "delete";
};

export type RoleCreatePayload = {
	name: string;
	description?: string | null;
	permissions?: string | null;
	fieldPermissions?: RolePermissionInput[];
};

export type RoleUpdatePayload = {
	name?: string;
	description?: string | null;
	permissions?: string | null;
	fieldPermissions?: RolePermissionInput[];
};

export type RoleInput = RoleCreatePayload;

export type RoleCreateInput = RoleCreatePayload;

export type RoleUpdateInput = RoleUpdatePayload & { id: number };

export type RoleWhereInput = Prisma.RoleWhereInput;
