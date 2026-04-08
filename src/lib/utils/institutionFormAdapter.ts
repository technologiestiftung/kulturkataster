import type { Category } from "@/types";
import type { Institution } from "@/types/institution";
import { CategoryStatus } from "@/generated/prisma";
import type { FilterState } from "@/types";
import {
	buildStreetLine,
	normalizeFundingSources,
	splitStreetLine,
	toFormBoolean,
	toDate,
	toOptionalNumber,
	toOptionalText,
} from "@/lib/utils/formUtils";
import { resolveCategoryIdsFromDraft } from "@/lib/utils/institutionCategoryUtils";

const dateToInputValue = (value: unknown): string => {
	const parsed = toDate(value);
	if (!parsed) return "";
	const year = parsed.getFullYear();
	const month = String(parsed.getMonth() + 1).padStart(2, "0");
	const day = String(parsed.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

export const buildInstitutionCategoryFilterState = (
	categories: Category[] | undefined,
): FilterState => {
	const category_keys = new Set<string>();
	const child_category_keys = new Set<string>();
	const categoryMap = new Map<number, Category>();

	(categories ?? []).forEach((category) => {
		categoryMap.set(category.id, category);
	});

	(categories ?? []).forEach((category) => {
		if (category.parent_category_id) {
			child_category_keys.add(category.key);
			const parent = categoryMap.get(category.parent_category_id);
			if (parent) {
				category_keys.add(parent.key);
			}
		} else {
			category_keys.add(category.key);
		}
	});

	return {
		district_keys: [],
		category_keys: Array.from(category_keys),
		child_category_keys: Array.from(child_category_keys),
		include_closed: false,
		status: undefined,
	};
};

export const buildInstitutionFormInitialValues = (
	resolvedInstitution?: Institution,
): Record<string, unknown> => {
	const address = resolvedInstitution?.address;
	return {
		name: resolvedInstitution?.name ?? undefined,
		parent_organization: resolvedInstitution?.parent_organization ?? undefined,
		source: resolvedInstitution?.source ?? undefined,
		internal_notes: resolvedInstitution?.internal_notes ?? undefined,
		"address.streetLine": buildStreetLine(
			address?.street,
			address?.street_number,
		),
		"address.city": address?.city ?? undefined,
		"address.district": address?.district ?? undefined,
		"address.zip": address?.zipcode ?? undefined,
		"address.address_suffix": address?.address_suffix ?? undefined,
		"address.neighbourhood": address?.neighbourhood ?? undefined,
		"address.cultural_area": address?.cultural_area ?? undefined,
		"address.lat": address?.lat ?? undefined,
		"address.lng": address?.lng ?? undefined,
		categoryIds:
			resolvedInstitution?.categories?.map((category) => String(category.id)) ??
			[],
		categoryFilters: buildInstitutionCategoryFilterState(
			resolvedInstitution?.categories,
		),
		utilization_status: resolvedInstitution?.utilization_status ?? undefined,
		utilization_status_info:
			resolvedInstitution?.utilization_status_info ?? undefined,
		utilization_status_internal_notes:
			resolvedInstitution?.utilization_status_internal_notes ?? undefined,
		protection_status: resolvedInstitution?.protection_status ?? undefined,
		protection_status_info:
			resolvedInstitution?.protection_status_info ?? undefined,
		protection_status_internal_notes:
			resolvedInstitution?.protection_status_internal_notes ?? undefined,
		website: resolvedInstitution?.website ?? undefined,
		email: resolvedInstitution?.email ?? undefined,
		phone: resolvedInstitution?.phone ?? undefined,
		contact_person_first_name:
			resolvedInstitution?.contact_person?.first_name ?? undefined,
		contact_person_last_name:
			resolvedInstitution?.contact_person?.last_name ?? undefined,
		contact_person_email:
			resolvedInstitution?.contact_person?.email ?? undefined,
		contact_person_phone:
			resolvedInstitution?.contact_person?.phone ?? undefined,
		legal_form: resolvedInstitution?.legal_form ?? undefined,
		funding_type: resolvedInstitution?.funding_type ?? undefined,
		funding_sources:
			resolvedInstitution?.funding_sources?.map((source) => ({
				source_name: source.source_name ?? undefined,
				description: source.description ?? undefined,
			})) ?? [],
		owner_type: resolvedInstitution?.owner_type ?? undefined,
		owner_name: resolvedInstitution?.owner_name ?? undefined,
		rental_contract_type:
			resolvedInstitution?.rental_contract_type ?? undefined,
		rental_contract_end: dateToInputValue(
			resolvedInstitution?.rental_contract_end,
		),
		established_since: dateToInputValue(resolvedInstitution?.established_since),
		established_until: dateToInputValue(resolvedInstitution?.established_until),
		closing_reason: resolvedInstitution?.closing_reason ?? undefined,
		area: resolvedInstitution?.area ?? undefined,
		capacity: resolvedInstitution?.capacity ?? undefined,
		number_of_rooms: resolvedInstitution?.number_of_rooms ?? undefined,
		accessibility: resolvedInstitution?.accessibility ?? undefined,
		cost: resolvedInstitution?.cost ?? undefined,
		shared_use_allowed: resolvedInstitution?.shared_use_allowed ?? false,
		shared_use_info: resolvedInstitution?.shared_use_info ?? undefined,
		shared_use_equipment:
			resolvedInstitution?.shared_use_equipment ?? undefined,
		shared_use_audience: resolvedInstitution?.shared_use_audience ?? undefined,
		shared_use_availability:
			resolvedInstitution?.shared_use_availability ?? undefined,
		shared_use_contact_person:
			resolvedInstitution?.shared_use_contact_person ?? undefined,
		notes: resolvedInstitution?.notes ?? undefined,
	};
};

export function buildInstitutionForFormFromDraft(
	draft: Record<string, unknown>,
	categoryGroups: Category[] = [],
): Institution {
	const originalInstitution =
		typeof draft.originalInstitution === "object" &&
		draft.originalInstitution !== null
			? (draft.originalInstitution as Record<string, unknown>)
			: null;

	const institutionId =
		toOptionalNumber(draft.entityId) ??
		toOptionalNumber(originalInstitution?.id) ??
		0;
	const nestedAddress =
		typeof draft.address === "object" && draft.address !== null
			? (draft.address as Record<string, unknown>)
			: null;
	const streetLine =
		toOptionalText(draft["address.streetLine"]) ??
		buildStreetLine(
			toOptionalText(nestedAddress?.street),
			toOptionalText(nestedAddress?.street_number),
		);
	const { street, streetNumber } = splitStreetLine(streetLine ?? "");

	const categoryIds = resolveCategoryIdsFromDraft(draft, categoryGroups);
	const categoryMap = new Map<number, Category>();
	categoryGroups.forEach((category) => {
		categoryMap.set(category.id, category);
		(category.child_categories ?? []).forEach((child) => {
			categoryMap.set(child.id, child);
		});
	});

	const contactPersonNested =
		typeof draft.contact_person === "object" && draft.contact_person !== null
			? (draft.contact_person as Record<string, unknown>)
			: null;
	const originalContactPerson =
		typeof originalInstitution?.contact_person === "object" &&
		originalInstitution.contact_person !== null
			? (originalInstitution.contact_person as Record<string, unknown>)
			: null;

	const now = new Date();
	const normalizedCategories: Institution["categories"] = categoryIds
		.map((id) => categoryMap.get(id))
		.filter((category): category is Category => Boolean(category))
		.map((category) => ({
			id: category.id,
			key: category.key,
			description: category.description ?? null,
			icon: category.icon ?? null,
			status: (typeof category.status === "string"
				? category.status
				: CategoryStatus.active) as Institution["categories"][number]["status"],
			parent_category_id: category.parent_category_id ?? null,
			created_at: category.created_at ?? now,
			updated_at: category.updated_at ?? now,
		}));

	return {
		id: institutionId,
		name: toOptionalText(draft.name) ?? "",
		status: "public",
		website: toOptionalText(draft.website),
		phone: toOptionalText(draft.phone),
		email: toOptionalText(draft.email),
		area: toOptionalNumber(draft.area) ?? null,
		number_of_rooms: toOptionalNumber(draft.number_of_rooms) ?? null,
		parent_organization: toOptionalText(draft.parent_organization),
		legal_form: toOptionalText(draft.legal_form),
		capacity: toOptionalNumber(draft.capacity) ?? null,
		owner_name: toOptionalText(draft.owner_name),
		owner_type: (typeof draft.owner_type === "string"
			? draft.owner_type
			: null) as Institution["owner_type"] | null,
		rental_contract_type: (typeof draft.rental_contract_type === "string"
			? draft.rental_contract_type
			: null) as Institution["rental_contract_type"] | null,
		rental_contract_end: (toDate(draft.rental_contract_end) ??
			null) as Institution["rental_contract_end"],
		funding_type: (typeof draft.funding_type === "string"
			? draft.funding_type
			: null) as Institution["funding_type"] | null,
		funding_sources: normalizeFundingSources(
			draft.funding_sources,
		) as Institution["funding_sources"],
		utilization_status: (typeof draft.utilization_status === "string"
			? draft.utilization_status
			: null) as Institution["utilization_status"] | null,
		utilization_status_info: toOptionalText(draft.utilization_status_info),
		utilization_status_internal_notes: toOptionalText(
			draft.utilization_status_internal_notes,
		),
		protection_status: (typeof draft.protection_status === "string"
			? draft.protection_status
			: null) as Institution["protection_status"] | null,
		protection_status_info: toOptionalText(draft.protection_status_info),
		protection_status_internal_notes: toOptionalText(
			draft.protection_status_internal_notes,
		),
		shared_use_allowed: toFormBoolean(draft.shared_use_allowed),
		shared_use_info: toOptionalText(draft.shared_use_info),
		shared_use_equipment: toOptionalText(draft.shared_use_equipment),
		shared_use_audience: toOptionalText(draft.shared_use_audience),
		shared_use_availability: toOptionalText(draft.shared_use_availability),
		shared_use_contact_person: toOptionalText(draft.shared_use_contact_person),
		accessibility: toOptionalText(draft.accessibility),
		cost: toOptionalText(draft.cost),
		established_since: toDate(draft.established_since),
		established_until: toDate(draft.established_until),
		closing_reason: toOptionalText(draft.closing_reason),
		notes: toOptionalText(draft.notes),
		internal_notes: toOptionalText(draft.internal_notes),
		import_identifier: null,
		source: toOptionalText(draft.source),
		contact_person_id: toOptionalNumber(draft.contact_person_id) ?? null,
		contact_person: {
			id: toOptionalNumber(contactPersonNested?.id) ?? 0,
			first_name:
				toOptionalText(draft.contact_person_first_name) ??
				toOptionalText(contactPersonNested?.first_name) ??
				toOptionalText(originalContactPerson?.first_name),
			last_name:
				toOptionalText(draft.contact_person_last_name) ??
				toOptionalText(contactPersonNested?.last_name) ??
				toOptionalText(originalContactPerson?.last_name),
			email:
				toOptionalText(draft.contact_person_email) ??
				toOptionalText(contactPersonNested?.email) ??
				toOptionalText(originalContactPerson?.email),
			phone:
				toOptionalText(draft.contact_person_phone) ??
				toOptionalText(contactPersonNested?.phone) ??
				toOptionalText(originalContactPerson?.phone),
			created_at: now,
			updated_at: now,
		},
		address: {
			id: toOptionalNumber(nestedAddress?.id) ?? 0,
			street: street ?? "",
			street_number: streetNumber ?? "",
			zipcode:
				toOptionalText(draft["address.zip"]) ??
				toOptionalText(nestedAddress?.zipcode) ??
				"",
			city:
				toOptionalText(draft["address.city"]) ??
				toOptionalText(nestedAddress?.city) ??
				"",
			district:
				toOptionalText(draft["address.district"]) ??
				toOptionalText(nestedAddress?.district),
			neighbourhood:
				toOptionalText(draft["address.neighbourhood"]) ??
				toOptionalText(nestedAddress?.neighbourhood),
			cultural_area:
				toOptionalText(draft["address.cultural_area"]) ??
				toOptionalText(nestedAddress?.cultural_area),
			address_suffix:
				toOptionalText(draft["address.address_suffix"]) ??
				toOptionalText(nestedAddress?.address_suffix),
			lat:
				toOptionalNumber(draft["address.lat"]) ??
				toOptionalNumber(nestedAddress?.lat) ??
				null,
			lng:
				toOptionalNumber(draft["address.lng"]) ??
				toOptionalNumber(nestedAddress?.lng) ??
				null,
			created_at: now,
			updated_at: now,
		},
		categories: normalizedCategories,
		tags: [],
		users: [],
		groups: [],
		created_by: null,
		updated_by: null,
		address_id: toOptionalNumber(nestedAddress?.id) ?? null,
		created_at: now,
		updated_at: now,
	};
}
