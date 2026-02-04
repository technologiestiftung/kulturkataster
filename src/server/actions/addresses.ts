"use server";

import {
	authorizeTable,
	getAccessContextForUser,
	getTableScope,
} from "@/server/utils/rbac";
import { getCurrentUserId } from "@/server/actions/auth";
import { addressRepo } from "@/server/data/addressRepo";
import { buildInstitutionScopedWhere } from "@/server/logic/institutionAccess";

export async function getDistricts(): Promise<string[]> {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "address", "read");

	const scope = getTableScope(ctx, "address", "read");
	const institutionWhere = buildInstitutionScopedWhere(scope, currentUserId);
	const where = institutionWhere
		? { institutions: { some: institutionWhere } }
		: undefined;
	const districts = await addressRepo.listDistinct(where);
	return districts
		.map((row) => row.district)
		.filter((district): district is string => !!district);
}
