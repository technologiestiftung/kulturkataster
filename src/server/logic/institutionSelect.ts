import { Prisma } from "@/generated/prisma";
import type { AccessContext } from "@/server/utils/rbac";

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
} as const;

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
			const existing = mutableSelect[maybeRelation];
			const relationSelect =
				typeof existing === "object" &&
				existing !== null &&
				"select" in existing
					? (existing as { select: Record<string, boolean> })
					: { select: { id: true } };
			relationSelect.select[rest.join(".")] = true;
			mutableSelect[maybeRelation] = relationSelect;
			continue;
		}

		const defaultRelation =
			maybeRelation in relationDefaults
				? relationDefaults[maybeRelation as keyof typeof relationDefaults]
				: undefined;
		if (defaultRelation) {
			mutableSelect[maybeRelation] = { select: defaultRelation };
			continue;
		}

		mutableSelect[maybeRelation] = true;
	}

	return select;
};
