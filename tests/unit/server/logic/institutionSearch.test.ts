import { describe, expect, it } from "vitest";
import { buildInstitutionSearchWhere } from "@/server/logic/institutionSearch";
import { Prisma } from "@/generated/prisma";

describe("buildInstitutionSearchWhere", () => {
	it("returns undefined for empty input", () => {
		expect(buildInstitutionSearchWhere("")).toBeUndefined();
		expect(buildInstitutionSearchWhere("   ")).toBeUndefined();
	});

	it("builds AND of terms with OR fields", () => {
		const where = buildInstitutionSearchWhere("foo bar");
		expect(where).toBeDefined();
		expect(where).toHaveProperty("AND");

		const and = (where as { AND: unknown[] }).AND;
		expect(and).toHaveLength(2);

		const first = and[0] as { OR: Array<Record<string, unknown>> };
		expect(first.OR.length).toBeGreaterThan(1);

		const nameClause = first.OR.find((clause) => "name" in clause);
		expect(nameClause).toEqual({
			name: { contains: "foo", mode: Prisma.QueryMode.insensitive },
		});
	});
});
