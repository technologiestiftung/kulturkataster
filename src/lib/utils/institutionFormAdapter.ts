import type { Category } from "@/types";
import type { Institution } from "@/types/institution";
import { CategoryStatus } from "@/generated/prisma";
import {
	buildStreetLine,
	splitStreetLine,
	toDate,
	toNumberArray,
	toOptionalNumber,
	toOptionalText,
} from "@/lib/utils/formUtils";

export function buildInstitutionForFormFromDraft(
	draft: Record<string, unknown>,
	categoryGroups: Category[] = [],
): Institution {
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

	const categoryIds = toNumberArray(draft.categoryIds);
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
		id: toOptionalNumber(draft.id) ?? 0,
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
		funding_sources: Array.isArray(draft.funding_sources)
			? (draft.funding_sources as Institution["funding_sources"])
			: [],
		utilization_status: (typeof draft.utilization_status === "string"
			? draft.utilization_status
			: null) as Institution["utilization_status"] | null,
		utilization_status_info: toOptionalText(draft.utilization_status_info),
		protection_status: (typeof draft.protection_status === "string"
			? draft.protection_status
			: null) as Institution["protection_status"] | null,
		protection_status_info: toOptionalText(draft.protection_status_info),
		shared_use_allowed:
			typeof draft.shared_use_allowed === "boolean"
				? draft.shared_use_allowed
				: false,
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
				toOptionalText(contactPersonNested?.first_name),
			last_name:
				toOptionalText(draft.contact_person_last_name) ??
				toOptionalText(contactPersonNested?.last_name),
			email:
				toOptionalText(draft.contact_person_email) ??
				toOptionalText(contactPersonNested?.email),
			phone:
				toOptionalText(draft.contact_person_phone) ??
				toOptionalText(contactPersonNested?.phone),
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
			district: toOptionalText(nestedAddress?.district),
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
