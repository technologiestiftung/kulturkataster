import { prisma } from "@/server/prisma";
import {
	Action as PrismaAction,
	Role,
	RoleFieldPermission,
	RoleTablePermission,
} from "@/generated/prisma";
import { logger } from "../logging/logger";

export type Action = PrismaAction;

type TablePermissionMap = Record<string, Set<Action>>;
type TableScopeMap = Record<string, Partial<Record<Action, "own" | "all">>>;
type FieldPermissionMap = Record<string, Record<string, Set<Action>>>;

export interface AccessContext {
	role: string | null;
	table: TablePermissionMap;
	tableScope: TableScopeMap;
	field: FieldPermissionMap;
}

export type FieldPermissionLists = {
	read: string[];
	create: string[];
	update: string[];
	delete: string[];
};

type RBACErrorMeta = {
	table?: string;
	action?: Action;
	requiredScope?: "own" | "all";
};

type RoleWithPermissions = Role & {
	table_permissions: RoleTablePermission[];
	field_permissions: RoleFieldPermission[];
};

const buildTablePerms = (
	permissions: RoleTablePermission[] = [],
): TablePermissionMap => {
	return permissions.reduce<TablePermissionMap>((acc, permission) => {
		if (!acc[permission.table]) acc[permission.table] = new Set();
		acc[permission.table].add(permission.action);
		return acc;
	}, {});
};

const buildTableScopes = (
	permissions: RoleTablePermission[] = [],
): TableScopeMap => {
	return permissions.reduce<TableScopeMap>((acc, permission) => {
		if (!acc[permission.table]) acc[permission.table] = {};
		acc[permission.table][permission.action] = permission.scope ?? "own";
		return acc;
	}, {});
};

const buildFieldPerms = (
	permissions: RoleFieldPermission[] = [],
): FieldPermissionMap => {
	return permissions.reduce<FieldPermissionMap>((acc, permission) => {
		if (!acc[permission.table]) acc[permission.table] = {};
		if (!acc[permission.table][permission.field]) {
			acc[permission.table][permission.field] = new Set();
		}
		acc[permission.table][permission.field].add(permission.action);
		return acc;
	}, {});
};

export const buildAccessContext = (
	role: RoleWithPermissions | null,
): AccessContext => {
	if (!role) {
		return { role: null, table: {}, tableScope: {}, field: {} };
	}

	return {
		role: role.name,
		table: buildTablePerms(role.table_permissions ?? []),
		tableScope: buildTableScopes(role.table_permissions ?? []),
		field: buildFieldPerms(role.field_permissions ?? []),
	};
};

export const canTable = (
	context: AccessContext,
	table: string,
	action: Action,
): boolean => {
	const tablePerms = context.table[table];
	if (!tablePerms) return false;
	return tablePerms.has(action);
};

export const getTableScope = (
	context: AccessContext,
	table: string,
	action: Action,
): "own" | "all" => {
	return context.tableScope[table]?.[action] ?? "own";
};

export const requireAllScope = (
	context: AccessContext,
	table: string,
	action: Action,
	message?: string,
): void => {
	if (getTableScope(context, table, action) !== "all") {
		logger.warn("rbac.scope.denied", {
			subsystem: "rbac",
			role: context.role ?? "guest",
			table,
			action,
			required_scope: "all",
			actual_scope: getTableScope(context, table, action),
		});
		const error = new Error(
			message ?? `Global ${action} access required for ${table}.`,
		) as Error & RBACErrorMeta;
		error.name = "RBACError";
		error.table = table;
		error.action = action;
		error.requiredScope = "all";
		throw error;
	}
};

export const requireScopeOrUser = (
	scope: "own" | "all",
	userId: string | null,
	message = "User must be authenticated to access this resource.",
): string | null => {
	if (scope === "all") return null;
	if (!userId) {
		throw new Error(message);
	}
	return userId;
};

export const getScopeUserId = (
	scope: "own" | "all",
	userId: string | null,
): string | null => {
	if (scope === "all") return null;
	return userId;
};

export const createNoAccessWhere = <T extends Record<string, unknown>>(
	baseWhere?: T,
): T => {
	const noAccessWhere = { id: { equals: -1 } } as unknown as T;
	if (!baseWhere) return noAccessWhere;
	return { AND: [baseWhere, noAccessWhere] } as unknown as T;
};

export const canFields = (
	context: AccessContext,
	table: string,
	fields: string[],
	action: Action,
): boolean => {
	if (fields.length === 0) return true;
	const tableFields = context.field[table] ?? {};
	return fields.every((field) => tableFields[field]?.has(action));
};

export const authorizeTable = (
	context: AccessContext,
	table: string,
	action: Action,
): void => {
	if (!canTable(context, table, action)) {
		logger.warn("rbac.table.denied", {
			subsystem: "rbac",
			role: context.role ?? "guest",
			table,
			action,
		});
		const error = new Error(
			`Role "${context.role ?? "guest"}" lacks ${action} on ${table}`,
		) as Error & RBACErrorMeta;
		error.name = "RBACError";
		error.table = table;
		error.action = action;
		throw error;
	}
};

export const authorizeFields = (
	context: AccessContext,
	table: string,
	fields: string[],
	action: Action,
): void => {
	if (fields.length === 0) return;
	if (!canFields(context, table, fields, action)) {
		logger.warn("rbac.fields.denied", {
			subsystem: "rbac",
			role: context.role ?? "guest",
			table,
			action,
			fields,
		});
		const error = new Error(
			`Role "${context.role ?? "guest"}" lacks ${action} on some fields of ${table}`,
		) as Error & RBACErrorMeta;
		error.name = "RBACError";
		error.table = table;
		error.action = action;
		throw error;
	}
};

export const getAccessContextForUser = async (
	userId: string | null,
): Promise<AccessContext> => {
	if (!userId) {
		const guestRole = await prisma.role.findFirst({
			where: { name: "guest", is_system: true },
			include: {
				table_permissions: true,
				field_permissions: true,
			},
		});
		return buildAccessContext(guestRole ?? null);
	}

	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: {
			role: {
				include: {
					table_permissions: true,
					field_permissions: true,
				},
			},
		},
	});

	return buildAccessContext(user?.role ?? null);
};

export const getSystemRoleReadableFieldsForTable = async (
	roleName: string,
	table: string,
): Promise<string[]> => {
	const role = await prisma.role.findFirst({
		where: {
			name: roleName,
			is_system: true,
		},
		include: {
			field_permissions: true,
		},
	});
	if (!role) return [];
	const readableFields = role.field_permissions
		.filter(
			(permission) =>
				permission.table === table && permission.action === "read",
		)
		.map((permission) => permission.field);
	return Array.from(new Set(readableFields));
};

export const getGuestReadableFieldsForTable = async (
	table: string,
): Promise<string[]> => {
	return getSystemRoleReadableFieldsForTable("guest", table);
};

export const getFieldPermissionListsForTable = (
	context: AccessContext,
	table: string,
): FieldPermissionLists => {
	const tableFields = context.field[table] ?? {};
	const read = new Set<string>();
	const create = new Set<string>();
	const update = new Set<string>();
	const del = new Set<string>();

	for (const [field, actions] of Object.entries(tableFields)) {
		if (actions.has("read")) read.add(field);
		if (actions.has("create")) create.add(field);
		if (actions.has("update")) update.add(field);
		if (actions.has("delete")) del.add(field);
	}

	return {
		read: Array.from(read),
		create: Array.from(create),
		update: Array.from(update),
		delete: Array.from(del),
	};
};
