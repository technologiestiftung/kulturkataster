import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { FieldPermissionsMap, InstitutionField } from "./types";
import { INSTITUTION_FIELDS } from "./types";

interface FieldPermissionsTableProps {
	permissions: FieldPermissionsMap;
	onToggleField: (
		field: InstitutionField,
		type: "view" | "requestChange" | "approveChange",
	) => void;
	onSetAllFields: (
		type: "view" | "requestChange" | "approveChange",
		value: boolean,
	) => void;
	readOnly?: boolean;
}

export function FieldPermissionsTable({
	permissions,
	onToggleField,
	onSetAllFields,
	readOnly = false,
}: FieldPermissionsTableProps) {
	const allView = Object.values(permissions).every((f) => f.view);
	const allRequestChange = Object.values(permissions).every(
		(f) => f.requestChange,
	);
	const allApproveChange = Object.values(permissions).every(
		(f) => f.approveChange,
	);

	return (
		<div className="space-y-3 rounded-xs p-4 bg-muted/50">
			<Label className="text-base font-semibold">Feldberechtigungen</Label>
			<div className="flex gap-4 mb-3">
				<div className="flex items-center space-x-2">
					<Checkbox
						id="selectAllView"
						checked={allView}
						disabled={readOnly}
						onCheckedChange={(checked) =>
							!readOnly && onSetAllFields("view", checked === true)
						}
					/>
					<label htmlFor="selectAllView" className="text-sm font-medium">
						Alle ansehen & exportieren
					</label>
				</div>
				<div className="flex items-center space-x-2">
					<Checkbox
						id="selectAllRequestChange"
						checked={allRequestChange}
						disabled={readOnly}
						onCheckedChange={(checked) =>
							!readOnly && onSetAllFields("requestChange", checked === true)
						}
					/>
					<label
						htmlFor="selectAllRequestChange"
						className="text-sm font-medium"
					>
						Alle Änderung vorschlagen
					</label>
				</div>
				<div className="flex items-center space-x-2">
					<Checkbox
						id="selectAllApproveChange"
						checked={allApproveChange}
						disabled={readOnly}
						onCheckedChange={(checked) =>
							!readOnly && onSetAllFields("approveChange", checked === true)
						}
					/>
					<label
						htmlFor="selectAllApproveChange"
						className="text-sm font-medium"
					>
						Alle Ändern & Freigeben
					</label>
				</div>
			</div>
			<div className="max-h-64 overflow-y-auto border rounded-md">
				<Table>
					<TableHeader className="sticky top-0 bg-background">
						<TableRow>
							<TableHead className="w-[180px]">Feld</TableHead>
							<TableHead className="w-[100px] text-center">
								Ansehen & Exportieren
							</TableHead>
							<TableHead className="w-[150px] text-center">
								Änderung vorschlagen
							</TableHead>
							<TableHead className="w-[150px] text-center">
								Ändern & Freigeben
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{INSTITUTION_FIELDS.map((field) => (
							<TableRow key={field}>
								<TableCell className="font-mono text-xs">{field}</TableCell>
								<TableCell className="text-center">
									<Checkbox
										checked={permissions[field].view}
										disabled={readOnly}
										onCheckedChange={() =>
											!readOnly && onToggleField(field, "view")
										}
									/>
								</TableCell>
								<TableCell className="text-center">
									<Checkbox
										checked={permissions[field].requestChange}
										disabled={readOnly}
										onCheckedChange={() =>
											!readOnly &&
											onToggleField(field, "requestChange")
										}
									/>
								</TableCell>
								<TableCell className="text-center">
									<Checkbox
										checked={permissions[field].approveChange}
										disabled={readOnly}
										onCheckedChange={() =>
											!readOnly &&
											onToggleField(field, "approveChange")
										}
									/>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
