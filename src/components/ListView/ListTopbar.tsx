"use client";

import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ButtonWithTooltip } from "@/components/ui/button-with-tooltip";
import { SearchInput } from "@/components/ui/search-input";
import { Label } from "@/components/ui/label";
import SearchIcon from "@/icons/search.svg";
import Close from "@/icons/close.svg";
import { FilterButtonWithCount } from "@/components/Filter/FilterButtonWithCount";
import { AlphabetFilter } from "./AlphabetFilter";

type ListTopbarProps = {
	countLabel: string;
	query: string;
	onQueryChange: (value: string) => void;
	onOpenFilter: () => void;
	onSearchClick?: () => void;
	activeLetter: string | null;
	onSelectLetter: (letter: string | null) => void;
	enabledLetters: Set<string>;
};

export function ListTopbar({
	countLabel,
	query,
	onQueryChange,
	onOpenFilter,
	onSearchClick,
	activeLetter,
	onSelectLetter,
	enabledLetters,
}: ListTopbarProps) {
	const { t } = useTranslation();
	const inputRef = useRef<HTMLInputElement | null>(null);
	const [isSearchOpen, setIsSearchOpen] = useState(false);

	const handleSearchClick = () => {
		inputRef.current?.focus();
		onSearchClick?.();
	};

	return (
		<div className="sticky top-0 z-2 -mx-4 w-[calc(100%+2rem)] bg-neutral-10 px-4 pt-2 after:pointer-events-none after:absolute after:left-0 after:right-0 after:top-full after:h-6 after:bg-linear-to-b after:from-neutral-10 after:to-transparent">
			<div className="flex w-full flex-col p-2 gap-3 md:flex-row md:items-center md:justify-between">
				<div className="flex gap-3 w-full pr-15 md:pr-0">
					<strong
						className={`${isSearchOpen && "hidden"} body2 self-end text-nowrap text-start md:text-start`}
						aria-hidden="true"
					>
						{countLabel}
					</strong>{" "}
					{/* Stays mounted while searching so count changes are announced. */}
					<p className="sr-only" role="status">
						{countLabel}
					</p>
					<div className="relative flex flex-1 justify-end ">
						<div
							className={[
								"relative flex-1 w-full transition-all duration-200 ease-out origin-left",
								isSearchOpen
									? "max-w-full opacity-100 scale-x-100"
									: "max-w-0 opacity-0 scale-x-0 pointer-events-none",
							]
								.filter(Boolean)
								.join(" ")}
							inert={!isSearchOpen}
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
										<Close aria-hidden="true" className="size-4" />
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
									aria-label={t("content.listView.searchButton")}
									aria-expanded={false}
									onClick={() => {
										setIsSearchOpen(true);
										requestAnimationFrame(handleSearchClick);
									}}
								>
									<SearchIcon aria-hidden="true" className="size-4" />
								</ButtonWithTooltip>
								<Label
									emphasize={false}
									className="hidden md:block"
									aria-hidden="true"
								>
									{t("content.listView.searchLabel")}
								</Label>
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

							<Label
								emphasize={false}
								className="hidden md:block"
								aria-hidden="true"
							>
								{t("content.listView.filterButton")}
							</Label>
						</div>
					)}
				</div>
			</div>
			<div className="mt-2">
				<AlphabetFilter
					activeLetter={activeLetter}
					onSelectLetter={onSelectLetter}
					enabledLetters={enabledLetters}
				/>
			</div>
		</div>
	);
}
