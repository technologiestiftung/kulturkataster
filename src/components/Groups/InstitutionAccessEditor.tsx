import { Label } from "@/components/ui/label";
import type { GroupInstitutionAccess } from "./types";
import { DistrictSelector } from "./DistrictSelector";
import { CategorySelector } from "./CategorySelector";
import { InstitutionSelector } from "../Users/InstitutionSelector";

interface InstitutionAccessEditorProps {
	access: GroupInstitutionAccess;
	institutionCount: number;
	onChange: (access: GroupInstitutionAccess) => void;
}

export function InstitutionAccessEditor({
	access,
	institutionCount,
	onChange,
}: InstitutionAccessEditorProps) {
	return (
		<div className="space-y-2">
			<Label htmlFor="accessType">Institution Access</Label>
			<select
				id="accessType"
				className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				value={access.type}
				onChange={(e) =>
					onChange({
						...access,
						type: e.target.value as GroupInstitutionAccess["type"],
					})
				}
			>
				<option value="all">Alle (All)</option>
				<option value="district">Distrikt (District)</option>
				<option value="category">Spartenverband (Category)</option>
				<option value="custom">Benutzerdefiniert (Custom)</option>
			</select>

			{access.type === "district" && (
				<div className="space-y-2">
					<Label className="text-sm text-muted-foreground">
						Select Districts
					</Label>
					<DistrictSelector
						selectedDistricts={access.districts || []}
						onChange={(districts) =>
							onChange({
								...access,
								districts,
							})
						}
					/>
				</div>
			)}

			{access.type === "category" && (
				<div className="space-y-2">
					<Label className="text-sm text-muted-foreground">
						Select Categories
					</Label>
					<CategorySelector
						selectedCategories={access.categories || []}
						onChange={(categories) =>
							onChange({
								...access,
								categories,
							})
						}
					/>
				</div>
			)}

			{access.type === "custom" && (
				<div className="space-y-2">
					<Label className="text-sm text-muted-foreground">
						Select Institutions
					</Label>
					<InstitutionSelector
						selectedInstitutions={access.institutions || []}
						onChange={(institutions) =>
							onChange({
								...access,
								institutions,
							})
						}
					/>
				</div>
			)}

			<div className="p-3 bg-muted rounded-md text-sm">
				<span className="text-muted-foreground">
					Currently: {institutionCount}{" "}
					{institutionCount === 1 ? "institution" : "institutions"}
				</span>
			</div>
		</div>
	);
}
