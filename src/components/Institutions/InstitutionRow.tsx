import { StickyTableCell, StickyTableRow } from "@/components/ui/sticky-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Edit } from "lucide-react";
import type { Institution } from "./types";

interface InstitutionRowProps {
	institution: Institution;
	onEdit: (institution: Institution) => void;
}

const typeLabels: Record<Institution["type"], string> = {
	museum: "Museum",
	gallery: "Gallery",
	theater: "Theater",
	library: "Library",
	archive: "Archive",
	monument: "Monument",
	other: "Other",
};

const statusVariants: Record<
	Institution["status"],
	"default" | "secondary" | "destructive" | "outline"
> = {
	active: "default",
	inactive: "secondary",
	pending: "outline",
};

export function InstitutionRow({ institution, onEdit }: InstitutionRowProps) {
	const formatDate = (date: Date) => {
		return date.toLocaleDateString("de-DE", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	return (
		<StickyTableRow>
			<StickyTableCell>
				<div className="font-medium">{institution.name}</div>
				<div className="text-xs text-muted-foreground">{institution.slug}</div>
			</StickyTableCell>
			<StickyTableCell>
				<Badge variant="outline">{typeLabels[institution.type]}</Badge>
			</StickyTableCell>
			<StickyTableCell>
				<Badge variant={statusVariants[institution.status]}>
					{institution.status}
				</Badge>
			</StickyTableCell>
			<StickyTableCell>
				<div>{institution.address.city}</div>
				<div className="text-xs text-muted-foreground">
					{institution.address.district}
				</div>
			</StickyTableCell>
			<StickyTableCell>
				{institution.ownerName ? (
					<div>
						<div className="font-medium">{institution.ownerName}</div>
						<div className="text-xs text-muted-foreground">
							{institution.contact.email}
						</div>
					</div>
				) : (
					<span className="text-muted-foreground">No owner</span>
				)}
			</StickyTableCell>
			<StickyTableCell>
				<div className="flex items-center gap-2">
					{institution.verified ? (
						<>
							<CheckCircle2 className="h-4 w-4 text-green-600" />
							<span className="text-sm">Verified</span>
						</>
					) : (
						<>
							<XCircle className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm text-muted-foreground">Unverified</span>
						</>
					)}
				</div>
			</StickyTableCell>
			<StickyTableCell>
				<div className="text-sm">{formatDate(institution.createdAt)}</div>
			</StickyTableCell>
			<StickyTableCell>
				<div className="text-sm">{formatDate(institution.updatedAt)}</div>
			</StickyTableCell>
			<StickyTableCell>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => onEdit(institution)}
					className="h-8 w-8 p-0"
				>
					<Edit className="h-4 w-4" />
					<span className="sr-only">Edit institution</span>
				</Button>
			</StickyTableCell>
		</StickyTableRow>
	);
}
