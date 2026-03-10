import { Prisma } from "@/generated/prisma";

export const buildInstitutionSearchWhere = (
	query: string,
): Prisma.InstitutionWhereInput | undefined => {
	const terms = query
		.split(" ")
		.map((term) => term.trim())
		.filter((term) => term.length > 0);

	if (terms.length === 0) return undefined;

	return {
		AND: terms.map((term) => ({
			OR: [
				{
					name: { contains: term, mode: Prisma.QueryMode.insensitive },
				},
				{
					address: {
						street: { contains: term, mode: Prisma.QueryMode.insensitive },
					},
				},
				{
					address: {
						street_number: {
							contains: term,
							mode: Prisma.QueryMode.insensitive,
						},
					},
				},
				{
					address: {
						address_suffix: {
							contains: term,
							mode: Prisma.QueryMode.insensitive,
						},
					},
				},
				{
					address: {
						zipcode: { contains: term, mode: Prisma.QueryMode.insensitive },
					},
				},
			],
		})),
	};
};
