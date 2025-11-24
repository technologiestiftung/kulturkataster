import { useTranslation } from "react-i18next";
import { isGeoFeature } from "./LocationSearch";
import { Institution, SearchResult } from "@/types/institution";

interface SearchResultsProps {
	results: SearchResult[];
	query: string;
	activeIndex: number;
	listRef: React.RefObject<HTMLUListElement | null>;
	getItemProps: (index: number) => React.HTMLAttributes<HTMLLIElement>;
	onResultClick: (result: SearchResult) => void;
	highlightMatch: (text: string, query: string) => React.ReactNode;
	formatAddress: (institution: Institution) => string;
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
}: SearchResultsProps) {
	const { t } = useTranslation("common");

	if (results.length === 0) return null;

	return (
		<div className="flex-1 flex flex-col min-h-0">
			<span className="body1 font-bold text-neutral-60 mb-2 flex-shrink-0">
				{t("search.suggestions")}
			</span>
			<ul
				ref={listRef}
				className="flex-1 overflow-y-auto space-y-1"
				aria-label={t("search.searchAriaLabel", { count: results.length })}
			>
				{results.map((result, index) => (
					// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
					<li
						key={
							isGeoFeature(result)
								? `address-${result.id}`
								: `institution-${result.id}`
						}
						{...getItemProps(index)}
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
						// eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
						tabIndex={0}
						className={`py-3 px-2 cursor-pointer rounded text-sm border-b
							${index === activeIndex ? "bg-gray-100" : ""}
							hover:bg-gray-100 contrast:hover:text-background
						`}
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
					</li>
				))}
			</ul>
		</div>
	);
}
