"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Institution } from "@/types";
import { AddressItem } from "@/components/InfoWrapper/AddressItem";
import { InfoItem } from "@/components/InfoWrapper/InfoItem";
import {
	FundingSourceItem,
	formatFundingSourcesValue,
} from "@/components/InfoWrapper/FundingSourceItem";
import {
	formatDateByType,
	getNestedValue,
	hasDisplayValue,
	normalizeDateByType,
} from "@/lib/utils/formUtils";
import {
	getCoordinatesFromAddress,
	getParentCategories,
} from "@/lib/utils/institutionUtils";
import { normalizeAddressForDiff } from "@/lib/utils/institutionRelationFields";
import { type InfoWrapperConfig, type InfoWrapperFieldConfig } from "./types";
import { StatusItem } from "./StatusItem";
import { StatusCultureIndexGroup } from "./StatusCultureIndexGroup";
import { CultureIndexProtectedInfo } from "./CultureIndexProtectedInfo";
import { CategoryItem } from "./CategoryItem";
import { getGridClass } from "../shared/sectionLayout";
import { getEditAction } from "./getEditAction";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { getFieldOptionLabel } from "@/lib/i18n/fieldLabels";
import { PrivateBadge } from "@/components/shared/PrivateBadge";
import {
	getCultureIndexRangeBgClass,
	getCultureIndexRangeForValue,
} from "@/lib/constants/cultureIndexRanges";
import type { TFunction } from "i18next";

const resolveFieldValue = (
	field: InfoWrapperFieldConfig,
	data: Partial<Institution>,
) => {
	if (typeof field.value === "function") {
		return field.value(data as Institution);
	}

	if (typeof field.value === "string") {
		return getNestedValue(
			data as unknown as Record<string, unknown>,
			field.value,
		);
	}

	if (field.value) {
		return getNestedValue(
			data as unknown as Record<string, unknown>,
			field.value,
		);
	}

	return undefined;
};

const resolveHref = (
	fieldConfig: InfoWrapperFieldConfig,
	value: unknown,
	data: Partial<Institution>,
) => {
	if (typeof fieldConfig.href === "function") {
		return fieldConfig.href(data as Institution);
	}

	if (typeof fieldConfig.href === "string") {
		return fieldConfig.href;
	}

	return typeof value === "string" ? value : undefined;
};

const formatAddressValue = (data: Partial<Institution>) => {
	const lines = buildAddressLines(data);
	return lines.length ? lines.join(", ") : "";
};

const formatCategoryValue = (
	data: Partial<Institution>,
	t: (key: string) => string,
) => {
	const categories = getParentCategories(data);
	if (!categories?.length) return "";
	return categories
		.map((category) => t(`enumMap.category.${category.key}`))
		.join(", ");
};

const resolveEnumDisplay = (
	field: InfoWrapperFieldConfig,
	value: unknown,
	sourceData: Partial<Institution>,
	t: (key: string) => string,
) => {
	const baseLabel = getFieldOptionLabel(
		t,
		String(field.enumKey),
		String(value),
	);
	if (
		!field.freeTextKey ||
		field.freeTextValue === undefined ||
		String(value) !== String(field.freeTextValue)
	) {
		return baseLabel;
	}

	const freeTextValue = getNestedValue(
		sourceData as unknown as Record<string, unknown>,
		field.freeTextKey,
	);
	if (typeof freeTextValue !== "string" || freeTextValue.trim() === "") {
		return baseLabel;
	}

	return `${baseLabel}: ${freeTextValue}`;
};

const renderLink = (
	value: unknown,
	href: string | undefined,
	type?: string,
) => {
	if (!value && !href) return null;
	const text = typeof value === "string" ? value : (href ?? "—");
	if (!href) return text;

	return (
		<Link
			href={
				(type === "email" && `mailto:${href}`) ||
				(type === "phone" && `tel:${href}`) ||
				href
			}
			target="_blank"
			rel="noreferrer"
			className="text-primary-dark"
		>
			{text}
		</Link>
	);
};

const buildAddressLines = (data: Partial<Institution>) => {
	const address = data.address;
	if (!address) return [];
	const lines: string[] = [];
	if (data.name) {
		lines.push(data.name);
	}
	if (address.address_suffix) {
		lines.push(address.address_suffix);
	}
	const streetLine = [address.street, address.street_number]
		.map((part) => (typeof part === "string" ? part.trim() : ""))
		.filter(Boolean)
		.join(" ");
	if (streetLine) {
		lines.push(streetLine);
	}
	const cityLineParts: string[] = [];
	if (address.zipcode) cityLineParts.push(address.zipcode);
	if (address.city) cityLineParts.push(address.city);
	if (address.district) cityLineParts.push(address.district);
	if (cityLineParts.length) {
		lines.push(cityLineParts.join(" "));
	}
	return lines;
};

const buildMapHref = (data: Partial<Institution>) => {
	const coords = getCoordinatesFromAddress(data.address);
	if (coords) {
		return `https://www.google.com/maps/search/?api=1&query=${coords[1]},${coords[0]}`;
	}
	const addressLines = buildAddressLines(data);
	if (!addressLines.length) return undefined;
	const query = encodeURIComponent(addressLines.join(", "));
	return `https://www.google.com/maps/search/?api=1&query=${query}`;
};

function AddressField({
	data,
	options,
	label,
	description,
	isPrivate,
	action,
}: {
	data: Partial<Institution>;
	options?: InfoWrapperFieldConfig["addressOptions"];
	label?: string;
	description?: string;
	isPrivate?: boolean;
	action?: React.ReactNode;
}) {
	const [copied, setCopied] = useState(false);
	const address = data.address;
	const showMapLink = options?.showMapLink ?? false;
	const showCopy = options?.showCopy ?? false;
	const mapLabel = options?.mapLabel ?? "Open in Maps";
	const copyLabel = options?.copyLabel ?? "Copy address";
	const copiedLabel = options?.copiedLabel ?? "Copied";
	const mapHref =
		typeof options?.mapHref === "function"
			? options.mapHref(data as Institution)
			: (options?.mapHref ?? buildMapHref(data));

	if (!address) return null;

	const handleCopy = async () => {
		const lines = buildAddressLines(data);
		if (!lines.length || !navigator?.clipboard?.writeText) return;
		try {
			await navigator.clipboard.writeText(lines.join("\n"));
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1500);
		} catch {
			setCopied(false);
		}
	};

	return (
		<div className="space-y-2">
			<AddressItem
				institution={data}
				label={label}
				description={description}
				isPrivate={isPrivate}
				action={action}
			/>

			{(showMapLink || showCopy) && (
				<div className="flex flex-wrap gap-3">
					{showMapLink && mapHref && (
						<a
							href={mapHref}
							target="_blank"
							rel="noreferrer"
							className="body2 text-primary-dark underline"
						>
							{mapLabel}
						</a>
					)}
					{showCopy && (
						<button
							type="button"
							className="body2 text-primary-dark underline"
							onClick={handleCopy}
						>
							{copied ? copiedLabel : copyLabel}
						</button>
					)}
				</div>
			)}
		</div>
	);
}

type RenderFieldContentArgs = {
	field: InfoWrapperFieldConfig;
	data: Partial<Institution>;
	newData?: Partial<Institution>;
	alwaysShow?: boolean;
	layoutColumns?: 1 | 2;
	isPrivate: boolean;
	t: TFunction;
};

const hasRenderableDisplayValue = (value: unknown) =>
	typeof value === "boolean" || (value !== 0 && hasDisplayValue(value));

const isRenderableCultureIndexValue = (value: unknown): boolean =>
	typeof value === "number" && Number.isFinite(value);

const normalizeDateForDiff = (value: unknown) =>
	normalizeDateByType(value, "date");

const getContent = (
	field: InfoWrapperFieldConfig,
	label: string | undefined,
	value: unknown,
	resolvedHref: string | undefined,
	t: (key: string) => string,
	data: Partial<Institution>,
	isPrivate: boolean,
	action: React.ReactNode,
) => {
	switch (field.type) {
		case "address":
			return (
				<AddressField
					data={data}
					options={field.addressOptions}
					label={label}
					description={field.description}
					isPrivate={isPrivate}
					action={action}
				/>
			);

		case "status": {
			return (
				<StatusItem
					value={String(value)}
					label={label}
					enumKey={field.enumKey}
					variant={field.statusVariant}
					isPrivate={isPrivate}
					action={action}
				/>
			);
		}

		case "culture_index": {
			const cultureIndexValue =
				typeof value === "number" && Number.isFinite(value) ? value : null;
			const cultureIndexRange = getCultureIndexRangeForValue(cultureIndexValue);
			const displayValue =
				cultureIndexValue !== null && cultureIndexRange
					? `${cultureIndexValue} - ${t(`content.filter.cultureIndex.ranges.${cultureIndexRange}`)}`
					: "—";
			const isPlain = field.cultureIndexVariant === "plain";
			return (
				<div
					className={cn(
						"flex items-center w-full gap-2 p-4 flex-wrap",
						isPlain || !cultureIndexRange
							? "bg-secondary"
							: getCultureIndexRangeBgClass(cultureIndexRange),
					)}
				>
					{isPlain && (
						<div
							className={cn(
								"w-4 h-4 rounded-full",
								cultureIndexRange
									? getCultureIndexRangeBgClass(cultureIndexRange)
									: "bg-alert",
							)}
						/>
					)}
					{label && <strong className="body2">{label}:</strong>}
					<span className="body2 font-medium">{displayValue}</span>
					{isPrivate ? <PrivateBadge /> : null}
					<div className="ml-auto flex items-center gap-2">{action}</div>
				</div>
			);
		}

		case "statusCultureIndexGroup":
			return <StatusCultureIndexGroup data={data} t={t} />;

		case "cultureIndexProtectedInfo":
			return <CultureIndexProtectedInfo data={data} t={t} />;

		case "link":
		case "url":
		case "email":
		case "phone":
			return (
				<InfoItem
					label={label}
					description={field.description}
					isPrivate={isPrivate}
					action={action}
				>
					{renderLink(value, resolvedHref, field.type)}
				</InfoItem>
			);

		case "category":
			return (
				<CategoryItem
					data={data}
					variant={field.categoryVariant}
					description={field.description}
					isPrivate={isPrivate}
					action={action}
				/>
			);

		case "fundingSources":
			return (
				<FundingSourceItem
					data={data}
					label={label}
					description={field.description}
					isPrivate={isPrivate}
					action={action}
				/>
			);

		case "title":
			return (
				<div className="overflow-hidden">
					<h2 id="institution-title" className="font-extrabold wrap-anywhere">
						{String(value)}
					</h2>
				</div>
			);

		case "text":
			return (
				<InfoItem
					label={label}
					description={field.description}
					isPrivate={isPrivate}
					action={action}
				>
					{String(value)}
				</InfoItem>
			);

		case "enum":
			return (
				<InfoItem
					label={label}
					description={field.description}
					isPrivate={isPrivate}
					action={action}
				>
					{resolveEnumDisplay(field, value, data, t)}
				</InfoItem>
			);

		case "boolean":
			return (
				<InfoItem
					label={label}
					description={field.description}
					isPrivate={isPrivate}
					action={action}
				>
					{t(`enumMap.boolean.${String(value)}`)}
				</InfoItem>
			);

		case "date":
		case "partialDate":
			return (
				<InfoItem
					label={label}
					description={field.description}
					isPrivate={isPrivate}
					action={action}
				>
					{formatDateByType(value, field.type)}
				</InfoItem>
			);

		default:
			return null;
	}
};

const renderFieldContent = (
	{ field, data, newData, alwaysShow, isPrivate, t }: RenderFieldContentArgs,
	includeLayout = true,
) => {
	const mergeAddressForDiff = (
		currentData: Partial<Institution>,
		nextData?: Partial<Institution>,
	) => {
		if (
			field.type !== "address" ||
			!nextData?.address ||
			!currentData.address
		) {
			return nextData;
		}
		return {
			...nextData,
			address: {
				...currentData.address,
				...nextData.address,
			},
		};
	};
	const value = resolveFieldValue(field, data);
	const resolvedHref = resolveHref(field, value, data);
	const action = getEditAction({
		edit: field.edit,
		data,
		defaultAriaLabel: `Edit ${field.id ?? "field"}`,
	});
	// Check whether the field's key is actually present in newData. If the key
	// is absent the field was never touched in the draft and should be treated
	// as unchanged — not as "removed".
	const isFieldPresentInNewData = (() => {
		if (!newData) return false;
		if (
			field.type === "address" ||
			field.type === "category" ||
			field.type === "fundingSources"
		)
			return true;
		const key =
			typeof field.value === "string" ? field.value.split(".")[0] : undefined;
		if (!key) return false;
		return Object.prototype.hasOwnProperty.call(newData, key);
	})();
	const effectiveNewData =
		newData && !isFieldPresentInNewData ? undefined : newData;
	const comparableNewData = mergeAddressForDiff(data, effectiveNewData);
	const newValue = comparableNewData
		? resolveFieldValue(field, comparableNewData)
		: undefined;
	const resolvedNewHref = comparableNewData
		? resolveHref(field, newValue, comparableNewData)
		: undefined;

	const gridClass = getGridClass(field);
	const translateLabel = (labelKey?: string) => {
		if (!labelKey) return undefined;
		const fromEnum = t("enumMap." + labelKey);
		if (fromEnum && fromEnum !== labelKey) return fromEnum;
		const fromCommon = t("common." + labelKey);
		if (fromCommon && fromCommon !== labelKey) return fromCommon;
		return labelKey;
	};
	const label = translateLabel(field.labelKey) ?? field.label;

	const shouldRender = (() => {
		switch (field.type) {
			case "address":
				return Boolean(data.address) || hasDisplayValue(newValue);
			case "category":
				return (
					Boolean(getParentCategories(data)?.length) ||
					hasRenderableDisplayValue(newValue)
				);

			case "link":
			case "email":
			case "phone":
				return (
					hasRenderableDisplayValue(value) ||
					hasRenderableDisplayValue(resolvedHref) ||
					hasRenderableDisplayValue(newValue) ||
					hasRenderableDisplayValue(resolvedNewHref)
				);

			case "status":
			case "text":
			case "enum":
			case "boolean":
			case "fundingSources":
			case "date":
			case "partialDate":
			case "title":
				return (
					hasRenderableDisplayValue(value) ||
					hasRenderableDisplayValue(newValue)
				);

			case "culture_index":
				return (
					isRenderableCultureIndexValue(value) ||
					isRenderableCultureIndexValue(newValue)
				);

			default:
				return true;
		}
	})();

	if (!shouldRender) {
		if (!alwaysShow) return null;
		if (field.type === "title") {
			return (
				<div
					className={cn(
						includeLayout && gridClass,
						includeLayout && field.className,
					)}
				>
					<div className="overflow-hidden">
						<h1 id="institution-title" className="font-bold wrap-anywhere">
							—
						</h1>
					</div>
				</div>
			);
		}
		return (
			<div
				className={cn(
					includeLayout && gridClass,
					includeLayout && field.className,
				)}
			>
				<InfoItem
					label={label}
					description={field.description}
					isPrivate={isPrivate}
					action={action}
				>
					—
				</InfoItem>
			</div>
		);
	}

	const hasOriginal = (() => {
		switch (field.type) {
			case "address":
				return Boolean(data.address) && formatAddressValue(data) !== "";
			case "category":
				return Boolean(getParentCategories(data)?.length);
			case "link":
			case "email":
			case "phone":
				return (
					hasRenderableDisplayValue(value) ||
					hasRenderableDisplayValue(resolvedHref)
				);

			case "status":
			case "text":
			case "enum":
			case "boolean":
			case "fundingSources":
			case "date":
			case "partialDate":
			case "title":
				return hasRenderableDisplayValue(value);
			case "culture_index":
				return isRenderableCultureIndexValue(value);
			default:
				return hasRenderableDisplayValue(value);
		}
	})();

	const hasNew =
		comparableNewData !== undefined &&
		(() => {
			switch (field.type) {
				case "address":
					return (
						Boolean(comparableNewData.address) &&
						formatAddressValue(comparableNewData) !== ""
					);
				case "category":
					return Boolean(getParentCategories(comparableNewData)?.length);
				case "fundingSources":
					return hasRenderableDisplayValue(
						resolveFieldValue(field, comparableNewData),
					);
				case "culture_index":
					return isRenderableCultureIndexValue(newValue);
				default:
					return (
						hasRenderableDisplayValue(newValue) ||
						hasRenderableDisplayValue(resolvedNewHref)
					);
			}
		})();

	const renderValueDisplay = (
		displayValue: unknown,
		displayHref: string | undefined,
		sourceData: Partial<Institution>,
	) => {
		if (field.type === "address") return formatAddressValue(sourceData);
		if (field.type === "category") return formatCategoryValue(sourceData, t);
		if (field.type === "fundingSources")
			return formatFundingSourcesValue(sourceData, t);
		if (field.type === "status") {
			const labelKey = `${field.enumKey ?? "utilization_status"}.${String(
				displayValue,
			)}`;
			return t("enumMap." + labelKey);
		}
		if (field.type === "enum") {
			return resolveEnumDisplay(field, displayValue, sourceData, t);
		}
		if (field.type === "boolean") {
			return t(`enumMap.boolean.${String(displayValue)}`);
		}
		if (field.type === "date" || field.type === "partialDate") {
			return formatDateByType(displayValue, field.type);
		}
		if (
			field.type === "link" ||
			field.type === "email" ||
			field.type === "phone"
		) {
			return renderLink(displayValue, displayHref, field.type);
		}
		return String(displayValue);
	};

	const normalizedValue = (valueToNormalize: unknown) => {
		if (typeof valueToNormalize === "string") return valueToNormalize.trim();
		if (typeof valueToNormalize === "number") return valueToNormalize;
		if (typeof valueToNormalize === "boolean") return valueToNormalize;
		return valueToNormalize ?? null;
	};

	const originalDisplay = renderValueDisplay(value, resolvedHref, data);
	const newDisplay = comparableNewData
		? renderValueDisplay(newValue, resolvedNewHref, comparableNewData)
		: null;
	const hasDiff =
		newData !== undefined &&
		(() => {
			if (field.type === "address" || field.type === "category") {
				if (field.type === "address") {
					return (
						normalizeAddressForDiff(data as Record<string, unknown>) !==
						normalizeAddressForDiff(
							comparableNewData as Record<string, unknown>,
						)
					);
				}
				return String(originalDisplay) !== String(newDisplay ?? "");
			}
			if (field.type === "fundingSources") {
				return String(originalDisplay) !== String(newDisplay ?? "");
			}
			if (field.type === "date" || field.type === "partialDate") {
				return normalizeDateForDiff(value) !== normalizeDateForDiff(newValue);
			}
			if (
				field.type === "link" ||
				field.type === "email" ||
				field.type === "phone"
			) {
				const oldLink = normalizedValue(resolvedHref ?? value);
				const newLink = normalizedValue(resolvedNewHref ?? newValue);
				return oldLink !== newLink;
			}
			return (
				normalizedValue(value) !== normalizedValue(newValue) ||
				String(originalDisplay) !== String(newDisplay ?? "")
			);
		})();

	if (hasNew) {
		if (!hasDiff) {
			const content = getContent(
				field,
				label,
				value,
				resolvedHref,
				t,
				data,
				isPrivate,
				action,
			);
			if (!content) {
				if (!alwaysShow) return null;
				return (
					<div
						className={cn(
							includeLayout && gridClass,
							includeLayout && field.className,
						)}
					>
						<InfoItem
							label={label}
							description={field.description}
							isPrivate={isPrivate}
							action={action}
						>
							—
						</InfoItem>
					</div>
				);
			}
			return (
				<div
					className={cn(
						includeLayout && gridClass,
						includeLayout && field.className,
					)}
				>
					{content}
				</div>
			);
		}

		const oldDisplay = hasOriginal ? originalDisplay : null;

		if (field.type === "title") {
			return (
				<div
					className={cn(
						includeLayout && gridClass,
						includeLayout && field.className,
					)}
				>
					{hasOriginal && (
						<h1
							id="institution-title"
							className="font-bold wrap-anywhere line-through"
						>
							{oldDisplay}
						</h1>
					)}
					<h1 id="institution-title" className="font-bold wrap-anywhere">
						<span className="bg-primary-light px-1">
							{hasOriginal
								? t("content.infoWrapper.diffLabel.edited")
								: t("content.infoWrapper.diffLabel.addition")}
						</span>
						<span className="bg-primary-light px-1">{newDisplay}</span>
					</h1>
				</div>
			);
		}

		return (
			<div
				className={cn(
					includeLayout && gridClass,
					includeLayout && field.className,
				)}
			>
				<InfoItem
					label={label}
					description={field.description}
					isPrivate={isPrivate}
					action={action}
				>
					{hasOriginal ? (
						<span className="line-through">{oldDisplay}</span>
					) : null}
					<span className={cn(hasOriginal ? "block mt-1" : "")}>
						<span className="bg-primary-light px-1">
							{hasOriginal
								? t("content.infoWrapper.diffLabel.edited")
								: t("content.infoWrapper.diffLabel.addition")}
						</span>
						<span className="bg-primary-light px-1">{newDisplay}</span>
					</span>
				</InfoItem>
			</div>
		);
	}

	if (newData !== undefined && hasOriginal && !hasNew) {
		if (field.type === "title") {
			return (
				<div
					className={cn(
						includeLayout && gridClass,
						includeLayout && field.className,
					)}
				>
					<h1
						id="institution-title"
						className="font-bold wrap-anywhere line-through"
					>
						{originalDisplay}
					</h1>
					<span className="bg-primary-light px-1">
						{t("content.infoWrapper.diffLabel.removed")}
					</span>
				</div>
			);
		}
		return (
			<div
				className={cn(
					includeLayout && gridClass,
					includeLayout && field.className,
				)}
			>
				<InfoItem
					label={label}
					description={field.description}
					isPrivate={isPrivate}
					action={action}
				>
					<span className="line-through">{originalDisplay}</span>
					<span className="block mt-1">
						<span className="bg-primary-light px-1">
							{t("content.infoWrapper.diffLabel.removed")}
						</span>
					</span>
				</InfoItem>
			</div>
		);
	}

	const content = getContent(
		field,
		label,
		value,
		resolvedHref,
		t,
		data,
		isPrivate,
		action,
	);
	if (!content) {
		if (!alwaysShow) return null;
		return (
			<div
				className={cn(
					includeLayout && gridClass,
					includeLayout && field.className,
				)}
			>
				<InfoItem
					label={label}
					description={field.description}
					isPrivate={isPrivate}
					action={action}
				>
					—
				</InfoItem>
			</div>
		);
	}

	return (
		<div
			className={cn(
				includeLayout && gridClass,
				includeLayout && field.className,
			)}
		>
			{content}
		</div>
	);
};

type BuildRenderFieldArgs = {
	data: Partial<Institution>;
	newData?: Partial<Institution>;
	config: InfoWrapperConfig;
	showPrivateBadge: boolean;
	isPrivateField?: (field: InfoWrapperFieldConfig) => boolean;
	t: TFunction;
};

export const buildRenderField = ({
	data,
	newData,
	config,
	showPrivateBadge,
	isPrivateField,
	t,
}: BuildRenderFieldArgs) => {
	return (
		field: InfoWrapperFieldConfig,
		fieldIndex: number,
		layoutColumns?: 1 | 2,
	) => {
		if (field.condition && !field.condition(data as Institution)) {
			return null;
		}
		const fieldKey =
			field.id ??
			field.labelKey ??
			field.label ??
			(typeof field.value === "string" ? field.value : undefined) ??
			`${config.infoId ?? "info"}-field-${fieldIndex}`;
		const isPrivate =
			showPrivateBadge && (field.isPrivate ?? isPrivateField?.(field) ?? false);
		const content = renderFieldContent({
			field,
			data,
			newData,
			alwaysShow: field.alwaysShow ?? config.alwaysShow,
			layoutColumns,
			isPrivate,
			t,
		});
		if (!content) return null;
		return (
			<ScrollReveal key={fieldKey} className={cn(field.className)}>
				{content}
			</ScrollReveal>
		);
	};
};
