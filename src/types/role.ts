import type { Action, PermissionScope, Prisma } from "@/generated/prisma";

export type PrismaRoleWithRelations = Prisma.RoleGetPayload<{
	include: {
		table_permissions: true;
		field_permissions: true;
		users: true;
	};
}>;

export type Role = PrismaRoleWithRelations;

export type RoleTablePermissionInput = {
	table: string;
	action: Action;
	scope?: PermissionScope;
};

export type RoleFieldPermissionInput = {
	table: string;
	field: string;
	action: Action;
};

export type RoleCreatePayload = {
	name: string;
	description?: string | null;
	is_guest?: boolean;
	tablePermissions?: RoleTablePermissionInput[];
	fieldPermissions?: RoleFieldPermissionInput[];
};

export type RoleUpdatePayload = {
	name?: string;
	description?: string | null;
	is_guest?: boolean;
	tablePermissions?: RoleTablePermissionInput[];
	fieldPermissions?: RoleFieldPermissionInput[];
};

export type RoleInput = RoleCreatePayload;

export type RoleCreateInput = RoleCreatePayload;

export type RoleUpdateInput = RoleUpdatePayload & { id: number };

export type RoleWhereInput = Prisma.RoleWhereInput;
