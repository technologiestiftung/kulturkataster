import { cn } from "@/lib/utils"; // or wherever your cn utility is
import { FC } from "react";

interface ContentContainerProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
}

const ContentContainer: FC<ContentContainerProps> = ({
	children,
	className,
	...props
}) => {
	return (
		<div
			className={cn(
				"ContentContainer-root w-full h-full bg-backgroundÍ p-2 rounded",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
};

export default ContentContainer;
