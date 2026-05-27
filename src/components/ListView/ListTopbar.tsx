"use client";

import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ButtonWithTooltip } from "@/components/ui/button-with-tooltip";
import { SearchInput } from "@/components/ui/search-input";
import { Label } from "@/components/ui/label";
import SearchIcon from "@/icons/search.svg";
import Close from "@/icons/close.svg";
import { FilterButtonWithCount } from "@/components/Filter/FilterButtonWithCount";

type ListTopbarProps = {
	query: string;
	onQueryChange: (value: string) => void;
	onOpenFilter: () => void;
	onSearchClick?: () => void;
};

export function ListTopbar({
	query,
	onQueryChange,
	onOpenFilter,
	onSearchClick,
}: ListTopbarProps) {
	const { t } = useTranslation();
	const inputRef = useRef<HTMLInputElement | null>(null);
	const [isSearchOpen, setIsSearchOpen] = useState(false);

	const handleSearchClick = () => {
		inputRef.current?.focus();
		onSearchClick?.();
	};

	return (
		<div className="w-full flex gap-3 flex-row md:items-center justify-end sticky flex-wrap">
			<div className="relative flex flex-1 justify-end">
				<div
					className={[
						"relative flex-1 w-full transition-all duration-200 ease-out origin-left",
						isSearchOpen
							? "max-w-full opacity-100 scale-x-100"
							: "max-w-0 opacity-0 scale-x-0 pointer-events-none",
					]
						.filter(Boolean)
						.join(" ")}
				>
					<SearchInput
						ref={inputRef}
						type="search"
						value={query}
						onChange={(event) => onQueryChange(event.target.value)}
						placeholder={t("content.listView.searchPlaceholder")}
						aria-label={t("content.listView.searchLabel")}
						className="w-full pr-12"
						rightSlot={
							<button
								type="button"
								onClick={() => {
									onQueryChange("");
									setIsSearchOpen(false);
								}}
								className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground hover:text-foreground transition-colors"
								aria-label={t("content.listView.searchClose")}
							>
								<Close className="size-4" />
							</button>
						}
					/>
				</div>
				{isSearchOpen ? null : (
					<div className="gap-2 flex items-center">
						<ButtonWithTooltip
							type="button"
							radius="full"
							variant="surface"
							iconSize="lg"
							tooltip={t("content.listView.searchButton")}
							onClick={() => {
								setIsSearchOpen(true);
								requestAnimationFrame(handleSearchClick);
							}}
						>
							<SearchIcon className="size-4" />
						</ButtonWithTooltip>
						<Label emphasize={false}>{t("content.listView.searchLabel")}</Label>
					</div>
				)}
			</div>
			{isSearchOpen ? null : (
				<div className="flex items-center gap-2">
					<FilterButtonWithCount
						tooltip={t("content.listView.filterButton")}
						className="cursor-pointer"
						onClick={onOpenFilter}
					/>

					<Label emphasize={false}>{t("content.listView.filterButton")}</Label>
				</div>
			)}
		</div>
	);
}
