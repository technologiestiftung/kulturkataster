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
import { type InfoWrapperConfig, type InfoWrapperFieldConfig } from "./types";
import { StatusItem } from "./StatusItem";
import { CategoryItem } from "./CategoryItem";
import { useTranslation } from "react-i18next";
import { getGridClass } from "../shared/sectionLayout";
import { getEditAction } from "./getEditAction";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { getFieldOptionLabel } from "@/lib/i18n/fieldLabels";

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
	tEnum: (key: string) => string,
) => {
	const categories = getParentCategories(data);
	if (!categories?.length) return "";
	return categories
		.map((category) => tEnum(`enumMap.category.${category.key}`))
		.join(", ");
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
};

const hasRenderableDisplayValue = (value: unknown) =>
	typeof value === "boolean" || (value !== 0 && hasDisplayValue(value));

const normalizeDateForDiff = (value: unknown) =>
	normalizeDateByType(value, "date");

const getContent = (
	field: InfoWrapperFieldConfig,
	label: string | undefined,
	value: unknown,
	resolvedHref: string | undefined,
	tEnum: (key: string) => string,
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
					<h1 id="institution-title" className="font-extrabold wrap-anywhere">
						{String(value)}
					</h1>
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
					{getFieldOptionLabel(tEnum, String(field.enumKey), String(value))}
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
					{tEnum(`enumMap.boolean.${String(value)}`)}
				</InfoItem>
			);

		case "date":
		case "year":
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
	{ field, data, newData, alwaysShow, isPrivate }: RenderFieldContentArgs,
	includeLayout = true,
) => {
	const { t: tEnum } = useTranslation();
	const { t: tCommon } = useTranslation();
	const { t: tContent } = useTranslation();
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
	const newValue = effectiveNewData
		? resolveFieldValue(field, effectiveNewData)
		: undefined;
	const resolvedNewHref = effectiveNewData
		? resolveHref(field, newValue, effectiveNewData)
		: undefined;

	const gridClass = getGridClass(field);
	const translateLabel = (labelKey?: string) => {
		if (!labelKey) return undefined;
		const fromEnum = tEnum("enumMap." + labelKey);
		if (fromEnum && fromEnum !== labelKey) return fromEnum;
		const fromCommon = tCommon("common." + labelKey);
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
			case "year":
			case "title":
				return (
					hasRenderableDisplayValue(value) ||
					hasRenderableDisplayValue(newValue)
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
			case "year":
			case "title":
				return hasRenderableDisplayValue(value);
			default:
				return hasRenderableDisplayValue(value);
		}
	})();

	const hasNew =
		newData !== undefined &&
		(() => {
			switch (field.type) {
				case "address":
					return Boolean(newData.address) && formatAddressValue(newData) !== "";
				case "category":
					return Boolean(getParentCategories(newData)?.length);
				case "fundingSources":
					return hasRenderableDisplayValue(resolveFieldValue(field, newData));
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
		if (field.type === "category")
			return formatCategoryValue(sourceData, tEnum);
		if (field.type === "fundingSources")
			return formatFundingSourcesValue(sourceData, tEnum);
		if (field.type === "status") {
			const labelKey = `${field.enumKey ?? "utilization_status"}.${String(
				displayValue,
			)}`;
			return tEnum("enumMap." + labelKey);
		}
		if (field.type === "enum") {
			return getFieldOptionLabel(
				tEnum,
				String(field.enumKey),
				String(displayValue),
			);
		}
		if (field.type === "boolean") {
			return tEnum(`enumMap.boolean.${String(displayValue)}`);
		}
		if (field.type === "date" || field.type === "year") {
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
	const newDisplay = newData
		? renderValueDisplay(newValue, resolvedNewHref, newData)
		: null;
	const hasDiff =
		newData !== undefined &&
		(() => {
			if (field.type === "address" || field.type === "category") {
				return String(originalDisplay) !== String(newDisplay ?? "");
			}
			if (field.type === "fundingSources") {
				return String(originalDisplay) !== String(newDisplay ?? "");
			}
			if (field.type === "date" || field.type === "year") {
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
				tEnum,
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
								? tContent("content.infoWrapper.diffLabel.edited")
								: tContent("content.infoWrapper.diffLabel.addition")}
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
								? tContent("content.infoWrapper.diffLabel.edited")
								: tContent("content.infoWrapper.diffLabel.addition")}
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
						{tContent("content.infoWrapper.diffLabel.removed")}
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
							{tContent("content.infoWrapper.diffLabel.removed")}
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
		tEnum,
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
};

export const buildRenderField = ({
	data,
	newData,
	config,
	showPrivateBadge,
	isPrivateField,
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
		});
		if (!content) return null;
		return (
			<ScrollReveal key={fieldKey} className={cn(field.className)}>
				{content}
			</ScrollReveal>
		);
	};
};
