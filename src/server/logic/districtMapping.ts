import type { District } from "@/types";

type DistrictRow = { district: string | null };

export const mapDistrictRows = (rows: DistrictRow[]): District[] => {
	return rows
		.filter((row): row is { district: string } => !!row.district)
		.map((row) => ({
			key: row.district,
			name: row.district,
		})) as District[];
};
