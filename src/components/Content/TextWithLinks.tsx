import React, { FC } from "react";

interface TextWithLinkProps {
	text: string;
	textVariant?: string;
}

const TextWithLinks: FC<TextWithLinkProps> = ({
	text,
	textVariant = "body2",
}) => {
	const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
	const urlRegex = /\[([^\]]+?)\s+((?:https:\/\/|\/)[^\]]+)\]/gi;

	// First replace the URL pattern
	const processedText = text.replace(urlRegex, (match, linkText, url) => {
		return `__URL__${url}__LINKTEXT__${linkText}__URL__`;
	});

	// Split by both email and URL markers
	const parts = processedText.split(
		/(__URL__[^_]+__LINKTEXT__[^_]+__URL__|[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi,
	);

	return (
		<span className={`TextWithLink-root whitespace-pre-line ${textVariant}`}>
			{parts.map((part, index) => {
				if (emailRegex.test(part)) {
					return (
						<a
							key={index}
							href={`mailto:${part}`}
							className="text-primary-dark hover:text-primary underline"
						>
							{part}
						</a>
					);
				}
				if (part.startsWith("__URL__") && part.endsWith("__URL__")) {
					const urlMatch = part.match(/__URL__(.+?)__LINKTEXT__(.+?)__URL__/);
					if (urlMatch) {
						const [, url, linkText] = urlMatch;
						const isInternal = url.startsWith("/");
						return (
							<a
								key={index}
								href={url}
								tabIndex={0}
								{...(!isInternal && {
									target: "_blank",
									rel: "noopener noreferrer",
								})}
								className="text-primary-dark hover:text-primary underline"
							>
								{linkText}
							</a>
						);
					}
				}
				return <React.Fragment key={index}>{part}</React.Fragment>;
			})}
		</span>
	);
};

export default TextWithLinks;
