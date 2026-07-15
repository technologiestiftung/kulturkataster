import { addressRepo } from "@/server/data/addressRepo";
import { categoryRepo } from "@/server/data/categoryRepo";
import { institutionRepo } from "@/server/data/institutionRepo";
import { buildInstitutionScopedWhere } from "@/server/logic/institutionAccess";
import { buildInstitutionSelect } from "@/server/logic/institutionSelect";
import {
	authorizeTable,
	getTableScope,
	type AccessContext,
} from "@/server/utils/rbac";
import type { InstitutionStoreState } from "@/types";

export type PublicInstitutionDataPayload = {
	institutions: NonNullable<InstitutionStoreState["allInstitutions"]>;
	categories: NonNullable<InstitutionStoreState["categories"]>;
	districts: InstitutionStoreState["districts"];
};

type PublicInstitutionDataLoaderArgs = {
	ctx: AccessContext;
	currentUserId: string | null;
};

const loadInstitutions = async ({
	ctx,
	currentUserId,
}: PublicInstitutionDataLoaderArgs): Promise<
	PublicInstitutionDataPayload["institutions"]
> => {
	authorizeTable(ctx, "institution", "read");

	const select = buildInstitutionSelect(ctx);
	if (!select) return [];

	const scope = getTableScope(ctx, "institution", "read");
	const where = buildInstitutionScopedWhere(scope, currentUserId, {
		status: { in: ["public", "private", "archived"] },
	});
	if (!where) return [];

	return institutionRepo.listWithSelectWhere(where, select);
};

const loadCategories = async ({
	ctx,
}: PublicInstitutionDataLoaderArgs): Promise<
	PublicInstitutionDataPayload["categories"]
> => {
	authorizeTable(ctx, "category", "read");

	const categories = await categoryRepo.listWithChildren();
	return categories.filter((category) => !category.parent_category_id);
};

const loadDistricts = async ({
	ctx,
	currentUserId,
}: PublicInstitutionDataLoaderArgs): Promise<
	PublicInstitutionDataPayload["districts"]
> => {
	authorizeTable(ctx, "address", "read");

	const scope = getTableScope(ctx, "address", "read");
	const institutionWhere = buildInstitutionScopedWhere(scope, currentUserId);
	const where = institutionWhere
		? { institutions: { some: institutionWhere } }
		: undefined;
	const districts = await addressRepo.listDistinct(where);

	return districts
		.map((row) => row.district)
		.filter((district): district is string => Boolean(district));
};

const PUBLIC_INSTITUTION_DATA_LOADERS = {
	institutions: loadInstitutions,
	categories: loadCategories,
	districts: loadDistricts,
} satisfies {
	[K in keyof PublicInstitutionDataPayload]: (
		args: PublicInstitutionDataLoaderArgs,
	) => Promise<PublicInstitutionDataPayload[K]>;
};

export async function loadPublicInstitutionData(
	args: PublicInstitutionDataLoaderArgs,
): Promise<PublicInstitutionDataPayload> {
	const [institutions, categories, districts] = await Promise.all([
		PUBLIC_INSTITUTION_DATA_LOADERS.institutions(args),
		PUBLIC_INSTITUTION_DATA_LOADERS.categories(args),
		PUBLIC_INSTITUTION_DATA_LOADERS.districts(args),
	]);

	return {
		institutions,
		categories,
		districts,
	};
}

export async function loadPublicInstitutionDataBestEffort(
	args: PublicInstitutionDataLoaderArgs,
): Promise<Partial<PublicInstitutionDataPayload>> {
	const loaderEntries = Object.entries(
		PUBLIC_INSTITUTION_DATA_LOADERS,
	) as Array<
		[
			keyof PublicInstitutionDataPayload,
			(args: PublicInstitutionDataLoaderArgs) => Promise<unknown>,
		]
	>;

	const settledResults = await Promise.allSettled(
		loaderEntries.map(([, loader]) => loader(args)),
	);

	return settledResults.reduce<Partial<PublicInstitutionDataPayload>>(
		(accumulator, result, index) => {
			if (result.status === "fulfilled") {
				const [key] = loaderEntries[index];
				accumulator[key] = result.value as never;
			}
			return accumulator;
		},
		{},
	);
}
