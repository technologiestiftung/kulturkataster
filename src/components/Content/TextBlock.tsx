import { ElementType, FC, HTMLAttributes } from "react";

interface SubTextProps {
	subtitle: string;
	text: string;
}

interface LinkProps {
	text: string;
	href: string;
	target?: "_blank" | "_self";
}

interface TextBlockProps extends HTMLAttributes<HTMLDivElement> {
	title?: string;
	titleAs?: ElementType;
	titleClassName?: string;
	text?: string;
	link?: LinkProps;
	subText?: SubTextProps;
	className?: string;
}

const TextBlock: FC<TextBlockProps> = ({
	title,
	titleAs: TitleTag = "h2",
	titleClassName = "",
	text,
	link,
	subText,
	className = "",
	...props
}) => {
	return (
		<div className={`TextBlock-root ${className}`} {...props}>
			<div className="flex flex-col gap-2">
				{title && <TitleTag className={titleClassName}>{title}</TitleTag>}

				{text && <div className="body2">{text}</div>}

				{link && (
					<a
						href={link.href}
						target={link.target || "_self"}
						className="body2 text-primary hover:text-primary-dark underline"
					>
						{link.text}
					</a>
				)}
			</div>

			{subText && (
				<div className="flex flex-col gap-2 mt-4">
					{subText.subtitle && (
						<div className="body2 font-bold">{subText.subtitle}</div>
					)}
					<div className="body2">{subText.text}</div>
				</div>
			)}
		</div>
	);
};

export default TextBlock;
