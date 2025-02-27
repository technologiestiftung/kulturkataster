import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useVenueStore } from "@/lib/store/venueStore";
import { FC, useEffect, useState } from "react";

const DetailPanel: FC = ({}) => {
	const [open, setOpen] = useState(true);
	const { selectedVenueProperties } = useVenueStore();

	useEffect(() => {
		if (!selectedVenueProperties) {
			setOpen(false);
		}
		setOpen(true);
	}, [selectedVenueProperties]);

	return (
		<div className="DetailPanel-root">
			<Sheet key={"right"} open={open} onOpenChange={setOpen}>
				<SheetContent>
					<SheetHeader>
						<SheetTitle>{selectedVenueProperties?.venue_name}</SheetTitle>
						<SheetDescription>
							{selectedVenueProperties?.district}
						</SheetDescription>
					</SheetHeader>
					<SheetDescription>
						{selectedVenueProperties?.cultural_area}
					</SheetDescription>
				</SheetContent>
			</Sheet>
		</div>
	);
};

export default DetailPanel;
