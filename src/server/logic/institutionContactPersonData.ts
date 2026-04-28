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

const hasInlineContactPersonFields = (input: ContactPersonInput) =>
	INLINE_CONTACT_PERSON_FIELDS.some((field) => hasOwn(input, field));

const hasInlineContactPersonValue = (input: ContactPersonInput) => {
	const payload = buildContactPersonPayload(input);
	return Object.values(payload).some((value) => value !== null);
};

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
	if (!hasInlineContactPersonValue(input)) {
		return { disconnect: true } as const;
	}
	const payload = buildContactPersonPayload(input);
	return {
		upsert: {
			create: payload,
			update: payload,
		},
	} as const;
};
