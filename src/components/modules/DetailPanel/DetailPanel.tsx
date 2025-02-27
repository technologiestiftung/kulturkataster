import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useMapStore } from "@/lib/store/mapStore";
import { FC, useEffect, useState } from "react";

const DetailPanel: FC = ({}) => {
	const [open, setOpen] = useState(true);
	const { venueProperties } = useMapStore();

	useEffect(() => {
		if (!venueProperties) {
			setOpen(false);
		}
		setOpen(true);
	}, [venueProperties]);

	return (
		<div className="DetailPanel-root">
			<Sheet key={"right"} open={open} onOpenChange={setOpen}>
				<SheetContent>
					<SheetHeader>
						<SheetTitle>{venueProperties?.venue_name}</SheetTitle>
						<SheetDescription>{venueProperties?.district}</SheetDescription>
					</SheetHeader>
					<SheetDescription>{venueProperties?.cultural_area}</SheetDescription>
				</SheetContent>
			</Sheet>
		</div>
	);
};

export default DetailPanel;
