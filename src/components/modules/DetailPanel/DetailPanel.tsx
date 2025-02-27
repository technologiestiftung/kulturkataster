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
						<SheetTitle>{venueProperties?.name}</SheetTitle>
						<SheetDescription>{venueProperties?.description}</SheetDescription>
						<SheetDescription>{venueProperties?.address}</SheetDescription>
					</SheetHeader>
					<SheetDescription>{venueProperties?.category}</SheetDescription>
				</SheetContent>
			</Sheet>
		</div>
	);
};

export default DetailPanel;
