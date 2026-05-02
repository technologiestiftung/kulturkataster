import type { Element, RootContent } from "hast";

function hastToText(node: RootContent | Element): string {
	if (node.type === "text") return node.value;
	if ("children" in node) return node.children.map(hastToText).join("");
	return "";
}

interface OrderedListProps {
	node: Element;
}

export function OrderedList({ node }: OrderedListProps) {
	const items = node.children.filter(
		(child): child is Element =>
			child.type === "element" && child.tagName === "li",
	);

	return (
		<ol className="list-none p-0 space-y-4 my-3">
			{items.map((item, index) => {
				const text = hastToText(item).trim();
				const colonIdx = text.indexOf(": ");
				const title = colonIdx > -1 ? text.substring(0, colonIdx) : text;
				const description = colonIdx > -1 ? text.substring(colonIdx + 2) : "";

				return (
					<li key={index} className="flex items-start gap-4">
						<span className="body1 flex w-12 h-12 items-center justify-center shrink-0 rounded-full bg-brand-default font-bold text-foreground [letter-spacing:0.006rem]">
							{index + 1}
						</span>
						<div className="flex-1">
							<p className="body1 font-bold [letter-spacing:0.006rem]">
								{title}
							</p>
							{description && (
								<p className="body2 [letter-spacing:0.016rem]">{description}</p>
							)}
						</div>
					</li>
				);
			})}
		</ol>
	);
}
