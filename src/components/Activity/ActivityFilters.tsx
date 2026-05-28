"use client";

import { SearchInput } from "@/components/ui/search-input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import FilterIcon from "@/icons/filter.svg";
import { useTranslation } from "react-i18next";

type ActivityFiltersProps = {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	statusFilter: string;
	onStatusChange: (value: string) => void;
	typeFilter: string;
	onTypeChange: (value: string) => void;
	entityTypeFilter: string;
	onEntityTypeChange: (value: string) => void;
	actorFilter: string;
	onActorChange: (value: string) => void;
	dateFilter: string;
	onDateChange: (value: string) => void;
	statusOptions: (string | undefined)[];
	typeOptions: ("status_change" | "assign" | "create")[];
	entityTypeOptions: string[];
	actorOptions: string[];
	getStatusLabel: (status: string | undefined | null) => string;
	getEventTypeLabel: (
		eventType: "status_change" | "assign" | "create" | undefined,
	) => string;
	getEntityTypeLabel: (entityType: string) => string;
};

export function ActivityFilters({
	searchQuery,
	onSearchChange,
	statusFilter,
	onStatusChange,
	typeFilter,
	onTypeChange,
	entityTypeFilter,
	onEntityTypeChange,
	actorFilter,
	onActorChange,
	dateFilter,
	onDateChange,
	statusOptions,
	typeOptions,
	entityTypeOptions,
	actorOptions,
	getStatusLabel,
	getEventTypeLabel,
	getEntityTypeLabel,
}: ActivityFiltersProps) {
	const { t } = useTranslation();

	const activeFilterCount = [
		statusFilter !== "all",
		typeFilter !== "all",
		entityTypeFilter !== "all",
		actorFilter !== "all",
		dateFilter !== "all",
		searchQuery.trim().length > 0,
	].filter(Boolean).length;

	const controls = (
		<>
			<SearchInput
				value={searchQuery}
				onChange={(event) => onSearchChange(event.target.value)}
				placeholder={t("common.auth.account.activity.filters.search", {
					defaultValue: "Aktivität durchsuchen",
				})}
				containerClassName="w-full"
			/>

			<Select value={statusFilter} onValueChange={onStatusChange}>
				<SelectTrigger variant="pill">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">
						{t("common.auth.account.activity.filters.allStatuses", {
							defaultValue: "Alle Status",
						})}
					</SelectItem>
					{statusOptions.map((status) => (
						<SelectItem key={status} value={status ?? ""}>
							{getStatusLabel(status)}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Select value={typeFilter} onValueChange={onTypeChange}>
				<SelectTrigger variant="pill">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">
						{t("common.auth.account.activity.filters.allTypes", {
							defaultValue: "Alle Typen",
						})}
					</SelectItem>
					{typeOptions.map((eventType) => (
						<SelectItem key={eventType} value={eventType}>
							{getEventTypeLabel(eventType)}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Select value={entityTypeFilter} onValueChange={onEntityTypeChange}>
				<SelectTrigger variant="pill">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">
						{t("common.auth.account.activity.filters.allEntities", {
							defaultValue: "Alle Entitäten",
						})}
					</SelectItem>
					{entityTypeOptions.map((entityType) => (
						<SelectItem key={entityType} value={entityType}>
							{getEntityTypeLabel(entityType)}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Select value={actorFilter} onValueChange={onActorChange}>
				<SelectTrigger variant="pill">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">
						{t("common.auth.account.activity.filters.allUsers", {
							defaultValue: "Alle Nutzer*innen",
						})}
					</SelectItem>
					{actorOptions.map((actor) => (
						<SelectItem key={actor} value={actor}>
							{actor}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Select value={dateFilter} onValueChange={onDateChange}>
				<SelectTrigger variant="pill">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">
						{t("common.auth.account.activity.filters.allDates", {
							defaultValue: "Alle",
						})}
					</SelectItem>
					<SelectItem value="today">
						{t("common.auth.account.activity.filters.dateValue.today", {
							defaultValue: "Heute",
						})}
					</SelectItem>
					<SelectItem value="last_7_days">
						{t("common.auth.account.activity.filters.dateValue.last7Days", {
							defaultValue: "Letzte 7 Tage",
						})}
					</SelectItem>
					<SelectItem value="last_30_days">
						{t("common.auth.account.activity.filters.dateValue.last30Days", {
							defaultValue: "Letzte 30 Tage",
						})}
					</SelectItem>
					<SelectItem value="this_month">
						{t("common.auth.account.activity.filters.dateValue.thisMonth", {
							defaultValue: "Dieser Monat",
						})}
					</SelectItem>
					<SelectItem value="last_month">
						{t("common.auth.account.activity.filters.dateValue.lastMonth", {
							defaultValue: "Letzter Monat",
						})}
					</SelectItem>
				</SelectContent>
			</Select>
		</>
	);

	return (
		<div className="sticky top-2 z-20 space-y-3 py-2">
			<div className="md:hidden flex items-center gap-2 mr-16">
				<div className="flex-1">
					<SearchInput
						value={searchQuery}
						onChange={(event) => onSearchChange(event.target.value)}
						placeholder={t("common.auth.account.activity.filters.search", {
							defaultValue: "Aktivität durchsuchen",
						})}
						containerClassName="w-full"
					/>
				</div>
				<Sheet>
					<SheetTrigger asChild>
						<Button
							type="button"
							variant="surface"
							radius="full"
							iconSize="lg"
							className="relative shrink-0"
							aria-label={t("common.auth.account.activity.filters.open", {
								defaultValue: "Filter öffnen",
							})}
						>
							<FilterIcon className="size-5!" />
							{activeFilterCount > 0 && (
								<span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-medium leading-none">
									{activeFilterCount}
								</span>
							)}
						</Button>
					</SheetTrigger>
					<SheetContent side="bottom" className="pb-safe">
						<SheetHeader>
							<SheetTitle>
								{t("common.auth.account.activity.filters.title", {
									defaultValue: "Filter",
								})}
							</SheetTitle>
						</SheetHeader>
						<div className="flex flex-col gap-3 px-4 pb-6">{controls}</div>
					</SheetContent>
				</Sheet>
			</div>

			{/* Desktop: inline filter grid */}
			<div className="gap-3 md:grid-cols-2 xl:grid-cols-6 md:grid hidden">
				{controls}
			</div>
		</div>
	);
}
