import Download from "@/icons/download.svg";
import { FC } from "react";
import { Button } from "../ui/button";

interface DownloadPDFButtonProps extends React.HTMLAttributes<HTMLDivElement> {
	title: string;
}

const DownloadPDFButton: FC<DownloadPDFButtonProps> = ({ title, ...props }) => {
	return (
		<div className="DownloadPDFButton-root" {...props}>
			<Button variant={"outline"}>
				<Download size={6} viewBox="0 0 24 24" />
				<span>{title}</span>
			</Button>
		</div>
	);
};

export default DownloadPDFButton;
