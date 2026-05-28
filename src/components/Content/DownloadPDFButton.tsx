import Download from "@/icons/download.svg";
import { FC } from "react";
import { Button } from "../ui/button";

interface DownloadPDFButtonProps extends React.HTMLAttributes<HTMLDivElement> {
	fullWidth?: boolean;
	title: string;
}

const DownloadPDFButton: FC<DownloadPDFButtonProps> = ({
	title,
	fullWidth,
	...props
}) => {
	return (
		<div className="DownloadPDFButton-root" {...props}>
			<a
				href="https://kulturraum.berlin/kulturkataster-methodik/"
				target="_blank"
				rel="noopener noreferrer"
			>
				<Button variant={"outline"} className=" w-full" fullWidth={fullWidth}>
					<Download size={6} viewBox="0 0 24 24" />
					<span>{title}</span>
				</Button>
			</a>
		</div>
	);
};

export default DownloadPDFButton;
