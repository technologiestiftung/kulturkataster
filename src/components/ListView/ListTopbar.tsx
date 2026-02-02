"use client";

import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ButtonWithTooltip } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Label } from "@/components/ui/label";
import SearchIcon from "@/icons/search.svg";
import FilterIcon from "@/icons/filter.svg";
import Close from "@/icons/close.svg";

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
	const { t } = useTranslation("content");
	const inputRef = useRef<HTMLInputElement | null>(null);
	const [isSearchOpen, setIsSearchOpen] = useState(false);

	const handleSearchClick = () => {
		inputRef.current?.focus();
		onSearchClick?.();
	};

	return (
		<div className="w-full flex flex-col gap-3 md:flex-row md:items-center justify-end sticky">
			<div className="relative flex flex-1 justify-end">
				<div
					className={[
						"relative flex-1 w-auto transition-all duration-200 ease-out origin-right",
						isSearchOpen
							? "w-full max-w-full opacity-100 scale-x-100"
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
						placeholder={t("listView.searchPlaceholder")}
						aria-label={t("listView.searchLabel")}
						className="w-full pr-12"
						rightSlot={
							<button
								type="button"
								onClick={() => {
									onQueryChange("");
									setIsSearchOpen(false);
								}}
								className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground hover:text-foreground transition-colors"
								aria-label={t("listView.searchClose")}
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
							variant="rounded"
							size="icon-only"
							tooltip={t("listView.searchButton")}
							onClick={() => {
								setIsSearchOpen(true);
								requestAnimationFrame(handleSearchClick);
							}}
						>
							<SearchIcon className="size-4" />
						</ButtonWithTooltip>
						<Label className="font-normal">{t("listView.searchLabel")}</Label>
					</div>
				)}
			</div>
			<div className="flex items-center gap-2">
				<ButtonWithTooltip
					type="button"
					variant="rounded"
					size="icon-only"
					tooltip={t("listView.filterButton")}
					onClick={onOpenFilter}
				>
					<div className="flex items-center gap-2">
						<FilterIcon className="size-4! stroke-foreground" />
					</div>
				</ButtonWithTooltip>
				<Label className="font-normal">{t("listView.filterButton")}</Label>
			</div>
		</div>
	);
}
