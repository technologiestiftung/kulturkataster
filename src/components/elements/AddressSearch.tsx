import { Input } from "@/components/ui/input";
import { FC } from "react";

interface AddressSearchProps {
	helperText?: string;
}

const AddressSearch: FC<AddressSearchProps> = ({
	helperText = "enter an address",
}) => {
	return (
		<div className="AddressSearch-root">
			<Input placeholder={helperText} />
		</div>
	);
};

export default AddressSearch;
