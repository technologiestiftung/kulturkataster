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
	textVariant?: "body1" | "body2";
	link?: LinkProps;
	subText?: SubTextProps;
	className?: string;
}

const Title = ({
	as: Tag = "h2",
	className,
	children,
}: {
	as?: ElementType;
	className?: string;
	children?: React.ReactNode;
}) => {
	if (!children) return null;
	return <Tag className={className}>{children}</Tag>;
};

const Text = ({
	variant = "body2",
	children,
}: {
	variant?: "body1" | "body2";
	children?: React.ReactNode;
}) => {
	if (!children) return null;
	return <div className={variant}>{children}</div>;
};

const Link = ({ link }: { link?: LinkProps }) => {
	if (!link) return null;
	return (
		<a
			href={link.href}
			target={link.target || "_self"}
			className="body2 text-primary hover:text-primary-dark underline"
		>
			{link.text}
		</a>
	);
};

const SubText = ({ subText }: { subText?: SubTextProps }) => {
	if (!subText) return null;
	return (
		<div className="flex flex-col gap-2 mt-4">
			{subText.subtitle && (
				<strong className="body2 font-bold">{subText.subtitle}</strong>
			)}
			<div className="body2">{subText.text}</div>
		</div>
	);
};

const TextBlock: FC<TextBlockProps> = ({
	title,
	titleAs,
	titleClassName,
	text,
	textVariant,
	link,
	subText,
	className = "",
	...props
}) => {
	return (
		<div className={`TextBlock-root ${className}`} {...props}>
			<div className="flex flex-col wrap-anywhere gap-2">
				<Title as={titleAs} className={titleClassName}>
					{title}
				</Title>
				<Text variant={textVariant}>{text}</Text>
				<Link link={link} />
			</div>
			<SubText subText={subText} />
		</div>
	);
};

export default TextBlock;
