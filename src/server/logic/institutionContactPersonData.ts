import type { Prisma } from "@/generated/prisma";
import type { InstitutionForm, InstitutionUpdateForm } from "@/types";

type ContactPersonInput = Pick<
	InstitutionForm,
	| "contact_person_id"
	| "contact_person_first_name"
	| "contact_person_last_name"
	| "contact_person_email"
	| "contact_person_phone"
>;

const INLINE_CONTACT_PERSON_FIELDS = [
	"contact_person_first_name",
	"contact_person_last_name",
	"contact_person_email",
	"contact_person_phone",
] as const satisfies readonly (keyof ContactPersonInput)[];

const hasOwn = (input: object, key: string) =>
	Object.prototype.hasOwnProperty.call(input, key);

const buildContactPersonPayload = (
	input: ContactPersonInput,
): Prisma.ContactPersonCreateWithoutInstitutions_as_contactInput => ({
	first_name: input.contact_person_first_name ?? null,
	last_name: input.contact_person_last_name ?? null,
	email: input.contact_person_email ?? null,
	phone: input.contact_person_phone ?? null,
});

const CONTACT_PERSON_FIELD_MAP = {
	contact_person_first_name: "first_name",
	contact_person_last_name: "last_name",
	contact_person_email: "email",
	contact_person_phone: "phone",
} as const satisfies Record<
	(typeof INLINE_CONTACT_PERSON_FIELDS)[number],
	keyof Prisma.ContactPersonCreateWithoutInstitutions_as_contactInput
>;

const buildSparseContactPersonPayload = (
	input: ContactPersonInput,
): Prisma.ContactPersonCreateWithoutInstitutions_as_contactInput => {
	const payload: Prisma.ContactPersonCreateWithoutInstitutions_as_contactInput =
		{};
	for (const field of INLINE_CONTACT_PERSON_FIELDS) {
		if (!hasOwn(input, field)) continue;
		payload[CONTACT_PERSON_FIELD_MAP[field]] = input[field] ?? null;
	}
	return payload;
};

const hasInlineContactPersonFields = (input: ContactPersonInput) =>
	INLINE_CONTACT_PERSON_FIELDS.some((field) => hasOwn(input, field));

const hasInlineContactPersonValue = (input: ContactPersonInput) => {
	const payload = buildSparseContactPersonPayload(input);
	return Object.values(payload).some((value) => value !== null);
};

const hasAllInlineContactPersonFields = (input: ContactPersonInput) =>
	INLINE_CONTACT_PERSON_FIELDS.every((field) => hasOwn(input, field));

const buildContactPersonConnect = (contactPersonId?: number | null) => {
	if (typeof contactPersonId === "undefined") return undefined;
	if (contactPersonId === null) {
		return { disconnect: true } as const;
	}
	return { connect: { id: contactPersonId } } as const;
};

export const buildCreateContactPersonRelation = (input: InstitutionForm) => {
	const connected = buildContactPersonConnect(input.contact_person_id);
	if (connected !== undefined) return connected;
	if (!hasInlineContactPersonFields(input)) return undefined;
	if (!hasInlineContactPersonValue(input)) return undefined;
	return {
		create: buildContactPersonPayload(input),
	} as const;
};

export const buildUpdateContactPersonRelation = (
	input: InstitutionUpdateForm,
) => {
	if (hasOwn(input, "contact_person_id")) {
		return buildContactPersonConnect(input.contact_person_id);
	}
	if (!hasInlineContactPersonFields(input)) return undefined;
	if (
		hasAllInlineContactPersonFields(input) &&
		!hasInlineContactPersonValue(input)
	) {
		return { disconnect: true } as const;
	}
	const payload = buildSparseContactPersonPayload(input);
	return {
		upsert: {
			create: payload,
			update: payload,
		},
	} as const;
};
