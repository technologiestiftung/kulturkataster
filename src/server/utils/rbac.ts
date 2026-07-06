import { prisma } from "@/server/prisma";
import {
	Action as PrismaAction,
	Role,
	RoleFieldPermission,
	RoleTablePermission,
} from "@/generated/prisma";
import { normalizeInstitutionPermissionField } from "@/lib/utils/institutionPermissionField";
import { INSTITUTION_PERMISSION_FIELDS } from "@/types";
import { logger } from "../logging/logger";

export type Action = PrismaAction;

type TablePermissionMap = Record<string, Set<Action>>;
type TableScopeMap = Record<string, Partial<Record<Action, "own" | "all">>>;
type FieldPermissionMap = Record<string, Record<string, Set<Action>>>;
type FieldPermissionOrderMap = Record<string, Record<string, number>>;

export interface AccessContext {
	role: string | null;
	table: TablePermissionMap;
	tableScope: TableScopeMap;
	field: FieldPermissionMap;
	fieldOrder: FieldPermissionOrderMap;
}

export type FieldPermissionLists = {
	read: string[];
	create: string[];
	update: string[];
	delete: string[];
	download: string[];
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

const getDefaultRoleWithPermissions = () =>
	prisma.role.findFirst({
		where: { is_guest: true },
		include: {
			table_permissions: true,
			field_permissions: true,
		},
	});

const getPermissionFieldOrderMap =
	async (): Promise<FieldPermissionOrderMap> => {
		const orders = await prisma.permissionFieldOrder.findMany({
			orderBy: [{ table: "asc" }, { sort_order: "asc" }, { field: "asc" }],
		});

		return orders.reduce<FieldPermissionOrderMap>((acc, order) => {
			if (!acc[order.table]) acc[order.table] = {};
			acc[order.table][order.field] = order.sort_order;
			return acc;
		}, {});
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

const relationPermissionFieldsByLegacyField: Map<string, readonly string[]> = (
	INSTITUTION_PERMISSION_FIELDS as readonly string[]
).reduce((fieldsByRelation, field) => {
	const separatorIndex = field.indexOf(".");
	if (separatorIndex <= 0) return fieldsByRelation;
	const relation = field.slice(0, separatorIndex);
	fieldsByRelation.set(relation, [
		...(fieldsByRelation.get(relation) ?? []),
		field,
	]);
	return fieldsByRelation;
}, new Map<string, readonly string[]>());

const getPermissionFields = (field: string): readonly string[] => {
	const relationFields = relationPermissionFieldsByLegacyField.get(field);
	if (relationFields) return relationFields;
	const normalized = normalizeInstitutionPermissionField(field);
	return normalized ? [normalized] : [];
};

const buildFieldPerms = (
	permissions: RoleFieldPermission[] = [],
): FieldPermissionMap => {
	return permissions.reduce<FieldPermissionMap>((acc, permission) => {
		if (!acc[permission.table]) acc[permission.table] = {};
		for (const field of getPermissionFields(permission.field)) {
			if (!acc[permission.table][field]) {
				acc[permission.table][field] = new Set();
			}
			acc[permission.table][field].add(permission.action);
		}
		return acc;
	}, {});
};

const buildFieldOrders = (
	orders: FieldPermissionOrderMap = {},
): FieldPermissionOrderMap => {
	return orders;
};

export const buildAccessContext = (
	role: RoleWithPermissions | null,
	fieldOrder: FieldPermissionOrderMap = {},
): AccessContext => {
	if (!role) {
		return { role: null, table: {}, tableScope: {}, field: {}, fieldOrder };
	}

	return {
		role: role.name,
		table: buildTablePerms(role.table_permissions ?? []),
		tableScope: buildTableScopes(role.table_permissions ?? []),
		field: buildFieldPerms(role.field_permissions ?? []),
		fieldOrder: buildFieldOrders(fieldOrder),
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
		const [defaultRole, fieldOrder] = await Promise.all([
			getDefaultRoleWithPermissions(),
			getPermissionFieldOrderMap(),
		]);
		return buildAccessContext(defaultRole ?? null, fieldOrder);
	}

	const [user, fieldOrder] = await Promise.all([
		prisma.user.findUnique({
			where: { id: userId },
			include: {
				role: {
					include: {
						table_permissions: true,
						field_permissions: true,
					},
				},
			},
		}),
		getPermissionFieldOrderMap(),
	]);

	return buildAccessContext(user?.role ?? null, fieldOrder);
};

export const getSystemRoleReadableFieldsForTable = async (
	roleName: string,
	table: string,
): Promise<string[]> => {
	const [role, fieldOrder] = await Promise.all([
		prisma.role.findFirst({
			where: {
				name: roleName,
				is_system: true,
			},
			include: {
				table_permissions: true,
				field_permissions: true,
			},
		}),
		getPermissionFieldOrderMap(),
	]);
	if (!role) return [];
	return getFieldPermissionListsForTable(
		buildAccessContext(role, fieldOrder),
		table,
	).read;
};

export const getGuestReadableFieldsForTable = async (
	table: string,
): Promise<string[]> => {
	const [role, fieldOrder] = await Promise.all([
		prisma.role.findFirst({
			where: { is_guest: true },
			include: {
				table_permissions: true,
				field_permissions: true,
			},
		}),
		getPermissionFieldOrderMap(),
	]);
	if (!role) return [];
	return getFieldPermissionListsForTable(
		buildAccessContext(role, fieldOrder),
		table,
	).read;
};

export const getGuestDownloadableFieldsForTable = async (
	table: string,
): Promise<string[]> => {
	const [role, fieldOrder] = await Promise.all([
		prisma.role.findFirst({
			where: { is_guest: true },
			include: {
				table_permissions: true,
				field_permissions: true,
			},
		}),
		getPermissionFieldOrderMap(),
	]);
	if (!role) return [];
	return getFieldPermissionListsForTable(
		buildAccessContext(role, fieldOrder),
		table,
	).download;
};

export const getFieldPermissionListsForTable = (
	context: AccessContext,
	table: string,
): FieldPermissionLists => {
	const tableFields = context.field[table] ?? {};
	const tableFieldOrder = context.fieldOrder[table] ?? {};
	const read = new Set<string>();
	const create = new Set<string>();
	const update = new Set<string>();
	const del = new Set<string>();
	const download = new Set<string>();

	for (const [field, actions] of Object.entries(tableFields)) {
		if (actions.has("read")) read.add(field);
		if (actions.has("create")) create.add(field);
		if (actions.has("update")) update.add(field);
		if (actions.has("delete")) del.add(field);
		if (actions.has("download")) download.add(field);
	}

	const bySortOrder = (left: string, right: string) =>
		(tableFieldOrder[left] ?? Number.MAX_SAFE_INTEGER) -
			(tableFieldOrder[right] ?? Number.MAX_SAFE_INTEGER) ||
		left.localeCompare(right);

	return {
		read: Array.from(read).sort(bySortOrder),
		create: Array.from(create).sort(bySortOrder),
		update: Array.from(update).sort(bySortOrder),
		delete: Array.from(del).sort(bySortOrder),
		download: Array.from(download).sort(bySortOrder),
	};
};
