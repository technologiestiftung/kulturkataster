import { Prisma } from "@/generated/prisma";
import type { AccessContext } from "@/server/utils/rbac";

const activeCategoriesWhere = { status: "active" as const };

const relationDefaults = {
	address: {
		id: true,
		street: true,
		street_number: true,
		address_suffix: true,
		zipcode: true,
		city: true,
		district: true,
		neighbourhood: true,
		cultural_area: true,
		lat: true,
		lng: true,
	} satisfies Prisma.AddressSelect,
	categories: {
		id: true,
		key: true,
		icon: true,
		description: true,
		status: true,
		parent_category_id: true,
	} satisfies Prisma.CategorySelect,
	tags: {
		id: true,
		name: true,
	} satisfies Prisma.TagSelect,
	users: {
		id: true,
		email: true,
	} satisfies Prisma.UserSelect,
	contact_person: {
		id: true,
		first_name: true,
		last_name: true,
		email: true,
		phone: true,
	} satisfies Prisma.ContactPersonSelect,
	funding_sources: {
		id: true,
		source_name: true,
		description: true,
	} satisfies Prisma.FundingSourceSelect,
} as const;

const derivedRelationFields = {
	subcategories: "categories",
} as const;

const getDefaultRelationField = (field: string) => {
	const derivedRelation =
		derivedRelationFields[field as keyof typeof derivedRelationFields];
	const relationField = derivedRelation ?? field;
	return relationField in relationDefaults
		? (relationField as keyof typeof relationDefaults)
		: null;
};

type MutableInstitutionSelect = Record<string, unknown>;
type RelationSelect = {
	select: Record<string, boolean>;
	where?: typeof activeCategoriesWhere;
};

const isRelationSelect = (value: unknown): value is RelationSelect =>
	typeof value === "object" &&
	value !== null &&
	"select" in value &&
	typeof (value as RelationSelect).select === "object" &&
	(value as RelationSelect).select !== null;

const selectNestedRelationField = (
	select: MutableInstitutionSelect,
	relation: string,
	childField: string,
) => {
	const existing = select[relation];
	const relationSelect = isRelationSelect(existing)
		? existing
		: { select: { id: true } };
	relationSelect.select[childField] = true;
	if (relation === "address" && childField === "street") {
		relationSelect.select.street_number = true;
	}
	if (relation === "categories") {
		relationSelect.where = activeCategoriesWhere;
	}
	select[relation] = relationSelect;
};

const selectDefaultRelation = (
	select: MutableInstitutionSelect,
	relation: keyof typeof relationDefaults,
) => {
	const defaultRelation = relationDefaults[relation];
	select[relation] =
		relation === "categories"
			? { where: activeCategoriesWhere, select: defaultRelation }
			: { select: defaultRelation };
};

export const buildInstitutionSelect = (
	context: AccessContext,
): Prisma.InstitutionSelect | null => {
	const fieldPerms = context.field.institution ?? {};
	const allowedFields = Object.entries(fieldPerms)
		.filter(([, actions]) => actions.has("read"))
		.map(([field]) => field);

	if (allowedFields.length === 0) {
		return null;
	}
	const select = { id: true } as Prisma.InstitutionSelect;
	const mutableSelect: Record<string, unknown> = select as Record<
		string,
		unknown
	>;

	for (const field of allowedFields) {
		const [maybeRelation, ...rest] = field.split(".");
		if (!maybeRelation) continue;

		if (rest.length > 0) {
			selectNestedRelationField(mutableSelect, maybeRelation, rest.join("."));
			continue;
		}

		const relationField = getDefaultRelationField(maybeRelation);
		if (relationField) {
			selectDefaultRelation(mutableSelect, relationField);
			continue;
		}

		mutableSelect[maybeRelation] = true;
	}

	return select;
};
