import type { Prisma } from "@/generated/prisma";
import type { InstitutionForm, InstitutionUpdateForm } from "@/types";
import {
	CONTACT_PERSON_FLAT_FIELD_MAP,
	CONTACT_PERSON_FLAT_FIELDS,
} from "@/lib/utils/institutionRelationFields";

type ContactPersonInput = Pick<
	InstitutionForm,
	| "contact_person_id"
	| "contact_person_first_name"
	| "contact_person_last_name"
	| "contact_person_email"
	| "contact_person_phone"
>;

type InlineContactPersonField = keyof typeof CONTACT_PERSON_FLAT_FIELD_MAP &
	keyof ContactPersonInput;

const INLINE_CONTACT_PERSON_FIELDS =
	CONTACT_PERSON_FLAT_FIELDS as readonly InlineContactPersonField[];

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

const CONTACT_PERSON_FIELD_MAP = CONTACT_PERSON_FLAT_FIELD_MAP as Record<
	InlineContactPersonField,
	keyof Prisma.ContactPersonCreateWithoutInstitutions_as_contactInput
>;

const buildSparseContactPersonPayload = (
	input: ContactPersonInput,
): Prisma.ContactPersonCreateWithoutInstitutions_as_contactInput => {
	const payload: Record<string, string | null> = {};
	for (const field of INLINE_CONTACT_PERSON_FIELDS) {
		if (!hasOwn(input, field)) continue;
		payload[CONTACT_PERSON_FIELD_MAP[field]] = input[field] ?? null;
	}
	return payload as Prisma.ContactPersonCreateWithoutInstitutions_as_contactInput;
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
