import { useTranslation } from "react-i18next";
import { isGeoFeature } from "./LocationSearch";
import { Institution, SearchResult } from "@/types/institution";
import { cn } from "@/lib/utils";

interface SearchResultsProps {
	results: SearchResult[];
	query: string;
	activeIndex: number;
	listRef: React.RefObject<HTMLElement | null>;
	getItemProps: (index: number) => React.HTMLAttributes<HTMLDivElement>;
	onResultClick: (result: SearchResult) => void;
	highlightMatch: (text: string, query: string) => React.ReactNode;
	formatAddress: (institution: Institution) => string;
	listId: string;
}

export function SearchResults({
	results,
	query,
	activeIndex,
	listRef,
	getItemProps,
	onResultClick,
	highlightMatch,
	formatAddress,
	listId,
}: SearchResultsProps) {
	const { t } = useTranslation("common");

	if (results.length === 0) return null;

	const headingId = `${listId}-label`;

	return (
		<div className="flex-1 flex flex-col min-h-0">
			<span
				className="body1 font-bold text-neutral-80 mb-2 flex-shrink-0"
				id={headingId}
			>
				{t("search.suggestions")}
			</span>
			<div
				ref={listRef as React.RefObject<HTMLDivElement>}
				id={listId}
				className="flex-1 overflow-visible space-y-1"
				role="listbox"
				aria-labelledby={headingId}
			>
				{results.map((result, index) => {
					const itemProps = getItemProps(index);
					return (
						<div
							key={
								isGeoFeature(result)
									? `address-${result.id}`
									: `institution-${result.id}`
							}
							role="option"
							aria-selected={index === activeIndex}
							{...itemProps}
							onClick={(e) => {
								e.stopPropagation();
								onResultClick(result);
							}}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									e.stopPropagation();
									onResultClick(result);
								}
							}}
							tabIndex={-1}
							className={cn(
								"py-3 px-2 cursor-pointer rounded text-sm border-b",
								index === activeIndex && "bg-black/10 contrast:bg-neutral-10",
								"hover:bg-black/10 contrast:hover:bg-neutral-10",
								"outline-interaction-dark",
							)}
						>
							{isGeoFeature(result) ? (
								<div className="font-medium">
									{highlightMatch(result.place_name, query)}
								</div>
							) : (
								<>
									<div className="font-medium">
										{highlightMatch(result.name, query)}
									</div>
									<div className="">
										{highlightMatch(formatAddress(result), query)}
									</div>
								</>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
