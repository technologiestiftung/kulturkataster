import {
	splitStreetLine,
	toOptionalNumber,
	toOptionalText,
} from "@/lib/utils/formUtils";

export const CONTACT_PERSON_FLAT_FIELD_MAP = {
	contact_person_first_name: "first_name",
	contact_person_last_name: "last_name",
	contact_person_email: "email",
	contact_person_phone: "phone",
} as const;

export const CONTACT_PERSON_PERMISSION_FIELD_MAP = {
	contact_person_first_name: "contact_person.first_name",
	contact_person_last_name: "contact_person.last_name",
	contact_person_email: "contact_person.email",
	contact_person_phone: "contact_person.phone",
} as const;

export const CONTACT_PERSON_FLAT_FIELDS = Object.keys(
	CONTACT_PERSON_FLAT_FIELD_MAP,
) as Array<keyof typeof CONTACT_PERSON_FLAT_FIELD_MAP>;

export const ADDRESS_PERMISSION_FIELD_MAP = {
	street: "address.street",
	street_number: "address.street",
	streetLine: "address.street",
	"address.streetLine": "address.street",
	"address.street_number": "address.street",
	address_suffix: "address.address_suffix",
	zip: "address.zipcode",
	"address.zip": "address.zipcode",
	zipcode: "address.zipcode",
	city: "address.city",
	district: "address.district",
	neighbourhood: "address.neighbourhood",
	cultural_area: "address.cultural_area",
	lat: "address.lat",
	lng: "address.lng",
} as const;

export const ADDRESS_PERMISSION_FIELDS = [
	"address.address_suffix",
	"address.zipcode",
	"address.city",
	"address.district",
	"address.neighbourhood",
	"address.cultural_area",
	"address.lat",
	"address.lng",
] as const;

export const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

export const withNestedContactPerson = (input: Record<string, unknown>) => {
	const contactPerson = isRecord(input.contact_person)
		? { ...input.contact_person }
		: {};
	let hasContactPerson = Object.keys(contactPerson).length > 0;

	for (const [flatKey, nestedKey] of Object.entries(
		CONTACT_PERSON_FLAT_FIELD_MAP,
	)) {
		if (!Object.prototype.hasOwnProperty.call(input, flatKey)) continue;
		if (typeof input[flatKey] === "undefined") continue;
		contactPerson[nestedKey] = input[flatKey];
		hasContactPerson = true;
	}

	return hasContactPerson ? { ...input, contact_person: contactPerson } : input;
};

export const withNestedAddress = (input: Record<string, unknown>) => {
	const addressFromFlatFields: Record<string, unknown> = {};
	const applyText = (inputKey: string, addressKey: string) => {
		if (!Object.prototype.hasOwnProperty.call(input, inputKey)) return;
		addressFromFlatFields[addressKey] = toOptionalText(input[inputKey]);
	};
	if (Object.prototype.hasOwnProperty.call(input, "address.streetLine")) {
		const streetLine = toOptionalText(input["address.streetLine"]);
		const { street, streetNumber } = splitStreetLine(streetLine ?? "");
		addressFromFlatFields.street = street || null;
		addressFromFlatFields.street_number = streetNumber || null;
	}
	applyText("address.zip", "zipcode");
	applyText("address.city", "city");
	applyText("address.district", "district");
	applyText("address.address_suffix", "address_suffix");
	applyText("address.neighbourhood", "neighbourhood");
	applyText("address.cultural_area", "cultural_area");
	if (Object.prototype.hasOwnProperty.call(input, "address.lat")) {
		addressFromFlatFields.lat = toOptionalNumber(input["address.lat"]) ?? null;
	}
	if (Object.prototype.hasOwnProperty.call(input, "address.lng")) {
		addressFromFlatFields.lng = toOptionalNumber(input["address.lng"]) ?? null;
	}
	if (Object.keys(addressFromFlatFields).length === 0) return input;
	const address = isRecord(input.address) ? { ...input.address } : {};

	for (const [key, value] of Object.entries(addressFromFlatFields)) {
		if (typeof value === "undefined") continue;
		address[key] = value;
	}

	return { ...input, address };
};

export const normalizeInstitutionRelationFields = (
	input: Record<string, unknown>,
) => withNestedContactPerson(withNestedAddress(input));

export const inheritInstitutionRelationFields = (
	input: Record<string, unknown>,
	baseline: Record<string, unknown>,
) => {
	const merged = { ...input };
	if (isRecord(input.address) && isRecord(baseline.address)) {
		merged.address = { ...baseline.address, ...input.address };
	}
	if (isRecord(input.contact_person) && isRecord(baseline.contact_person)) {
		merged.contact_person = {
			...baseline.contact_person,
			...input.contact_person,
		};
	}
	return merged;
};

export const normalizeAddressForDiff = (input: Record<string, unknown>) => {
	const address = isRecord(input.address) ? input.address : null;
	if (!address) return "";
	return [
		address.address_suffix,
		address.street,
		address.street_number,
		address.zipcode,
		address.city,
		address.district,
		address.neighbourhood,
		address.cultural_area,
		address.lat,
		address.lng,
	]
		.map((value) =>
			value === null || value === undefined ? "" : String(value),
		)
		.map((value) => value.trim())
		.join("|");
};

export const withProfileContactFallback = (
	values: Record<string, unknown>,
	profile?: {
		first_name?: string | null;
		last_name?: string | null;
		email?: string | null;
		phone?: string | null;
	} | null,
) => {
	if (!profile) return values;
	const nextValues = { ...values };
	const applyFallback = (field: string, value: unknown) => {
		const currentValue = nextValues[field];
		if (
			currentValue !== undefined &&
			currentValue !== null &&
			(typeof currentValue !== "string" || currentValue.trim().length > 0)
		) {
			return;
		}
		nextValues[field] = value ?? undefined;
	};
	applyFallback("contact_person_first_name", profile.first_name);
	applyFallback("contact_person_last_name", profile.last_name);
	applyFallback("contact_person_email", profile.email);
	applyFallback("contact_person_phone", profile.phone);
	return nextValues;
};
