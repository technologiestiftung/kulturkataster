import {
	FundingType,
	InstitutionStatus,
	OwnerType,
	ProtectionStatus,
	RentalContractType,
	UtilizationStatus,
} from "@/generated/prisma";
import type { InstitutionForm, InstitutionUpdateForm } from "@/types";
import {
	optionalDateLikeSchema,
	optionalEmailSchema,
	optionalNumberSchema,
	optionalTelSchema,
	optionalTextSchema,
	optionalUrlSchema,
	parseWithSchema,
	positiveIntegerArraySchema,
	positiveIntegerSchema,
	requiredTextSchema,
	stringIdArraySchema,
	z,
} from "./common";

const addressSchema = z
	.object({
		id: positiveIntegerSchema("Address id must be positive.").optional(),
		street: optionalTextSchema().transform((value) => value ?? ""),
		street_number: optionalTextSchema().transform((value) => value ?? ""),
		address_suffix: optionalTextSchema().transform((value) => value ?? null),
		zipcode: optionalTextSchema().transform((value) => value ?? ""),
		city: optionalTextSchema().transform((value) => value ?? ""),
		district: optionalTextSchema().transform((value) => value ?? null),
		neighbourhood: optionalTextSchema().transform((value) => value ?? null),
		cultural_area: optionalTextSchema().transform((value) => value ?? null),
		lat: optionalNumberSchema("Latitude must be a valid number.").transform(
			(value) => value ?? null,
		),
		lng: optionalNumberSchema("Longitude must be a valid number.").transform(
			(value) => value ?? null,
		),
	})
	.nullable();

const fundingSourceSchema = z.object({
	id: positiveIntegerSchema("Funding source id must be positive.").optional(),
	source_name: requiredTextSchema("Funding source name is required."),
	description: optionalTextSchema().transform((value) => value ?? null),
});

const institutionBaseSchema = z.object({
	name: requiredTextSchema("Institution name is required."),
	website: optionalUrlSchema("Website must be a valid URL."),
	phone: optionalTelSchema("Phone must be a valid phone number."),
	email: optionalEmailSchema("Email must be a valid email address."),
	area: optionalNumberSchema("Area must be a valid number."),
	number_of_rooms: optionalNumberSchema(
		"Number of rooms must be a valid number.",
	),
	parent_organization: optionalTextSchema(),
	legal_form: optionalTextSchema(),
	capacity: optionalNumberSchema("Capacity must be a valid number."),
	culture_index: optionalNumberSchema(
		"Culture index must be a valid number.",
	).refine(
		(value) => value === null || value === undefined || (value >= 0 && value <= 100),
		{ message: "Culture index must be between 0 and 100." },
	),
	owner_name: optionalTextSchema(),
	owner_type: z.nativeEnum(OwnerType).nullable().optional(),
	rental_contract_type: z.nativeEnum(RentalContractType).nullable().optional(),
	rental_contract_end: optionalDateLikeSchema(
		"Rental contract end must be a valid date.",
	),
	funding_type: z.nativeEnum(FundingType).nullable().optional(),
	funding_source: z
		.unknown()
		.optional()
		.transform((value) => value as InstitutionForm["funding_source"]),
	funding_sources: z.array(fundingSourceSchema).nullable().optional(),
	utilization_status: z.nativeEnum(UtilizationStatus).nullable().optional(),
	utilization_status_info: optionalTextSchema(),
	utilization_status_internal_notes: optionalTextSchema(),
	protection_status: z.nativeEnum(ProtectionStatus).nullable().optional(),
	protection_status_info: optionalTextSchema(),
	protection_status_internal_notes: optionalTextSchema(),
	shared_use_allowed: z.boolean().nullable().optional(),
	shared_use_info: optionalTextSchema(),
	shared_use_equipment: optionalTextSchema(),
	shared_use_audience: optionalTextSchema(),
	shared_use_availability: optionalTextSchema(),
	accessibility: optionalTextSchema(),
	cost: optionalTextSchema(),
	established_since: optionalDateLikeSchema(
		"Established since must be a valid date.",
	),
	established_until: optionalDateLikeSchema(
		"Established until must be a valid date.",
	),
	closing_reason: optionalTextSchema(),
	notes: optionalTextSchema(),
	internal_notes: optionalTextSchema(),
	status: z.nativeEnum(InstitutionStatus).nullable().optional(),
	import_identifier: optionalTextSchema(),
	source: optionalTextSchema(),
	shared_use_contact_person: optionalTextSchema(),
	contact_person_first_name: optionalTextSchema(),
	contact_person_last_name: optionalTextSchema(),
	contact_person_email: optionalEmailSchema(
		"Contact person email must be a valid email address.",
	),
	contact_person_phone: optionalTelSchema(
		"Contact person phone must be a valid phone number.",
	),
	contact_person_id: positiveIntegerSchema(
		"Contact person id must be positive.",
	)
		.nullable()
		.optional(),
	address: addressSchema,
	categoryIds: positiveIntegerArraySchema(
		"Category ids must be positive integers.",
	),
	tagIds: positiveIntegerArraySchema("Tag ids must be positive integers."),
	userIds: stringIdArraySchema("User ids must be non-empty strings."),
	groupIds: positiveIntegerArraySchema("Group ids must be positive integers."),
});

const institutionCreateSchema = institutionBaseSchema.transform(
	(value): InstitutionForm => value,
);

const institutionUpdateSchema = institutionBaseSchema
	.extend({
		id: positiveIntegerSchema("Institution id must be positive."),
	})
	.transform((value): InstitutionUpdateForm => value);

export const validateInstitutionCreateInput = (input: InstitutionForm) =>
	parseWithSchema(institutionCreateSchema, input);

export const validateInstitutionUpdateInput = (input: InstitutionUpdateForm) =>
	parseWithSchema(institutionUpdateSchema, input);
