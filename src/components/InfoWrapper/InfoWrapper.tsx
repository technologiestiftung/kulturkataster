"use client";

import { cn } from "@/lib/utils";
import type { Institution } from "@/types";
import { Fragment, type ReactNode } from "react";
import type { InfoWrapperConfig, InfoWrapperFieldConfig } from "./types";
import { buildRenderField } from "./renderField";
import { SectionWrapper } from "@/components/shared/SectionWrapper";
import {
	getResponsiveGridClass,
	getSpanClass,
} from "@/components/shared/sectionLayout";
import { getEditAction } from "./getEditAction";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { useTranslation } from "react-i18next";

export function InfoWrapper({
	data,
	newData,
	config,
}: {
	data: Partial<Institution>;
	newData?: Partial<Institution>;
	config: InfoWrapperConfig;
}) {
	const { t } = useTranslation();
	const renderField = buildRenderField({
		data,
		newData,
		config,
		showPrivateBadge: config.showPrivateBadge ?? true,
		isPrivateField: config.isPrivateField,
		t,
	});
	const isCardField = (field: InfoWrapperFieldConfig) =>
		field.type === "section";

	const getLayoutClass = () => {
		if (!config.layout) return "";
		return `grid gap-2 ${getResponsiveGridClass(config.layout.columns)}`;
	};

	const renderFieldGroup = (
		fields: InfoWrapperFieldConfig[],
		layout: InfoWrapperFieldConfig["layout"],
		alwaysShow?: boolean,
	) => {
		const layoutColumns = layout?.columns ?? config.layout?.columns;
		const gridClass = getResponsiveGridClass(layoutColumns);
		if (fields.length === 0) {
			if (!alwaysShow) return null;
			return <div className={cn("grid gap-1.5", gridClass)} />;
		}
		const nodes: ReactNode[] = [];
		let fieldNodes: ReactNode[] = [];
		let hasSectionNodes = false;

		const flushFields = () => {
			if (fieldNodes.length === 0) return;
			const filtered = fieldNodes.filter(Boolean);
			fieldNodes = [];
			if (!alwaysShow && filtered.length === 0) return;
			nodes.push(
				<Fragment key={`fields-${nodes.length}`}>{filtered}</Fragment>,
			);
		};

		fields.forEach((field, fieldIndex) => {
			if (isCardField(field)) {
				if (field.condition && !field.condition(data as Institution)) return;
				hasSectionNodes = true;
				flushFields();
				const useAccordion = field.collapsible ?? config.useAccordion;
				const defaultOpen = field.defaultOpen ?? config.defaultOpen;
				const sectionCardVariant =
					field.cardVariant ?? config.cardVariant ?? "default";
				const accordionVariant =
					field.accordionVariant ?? config.accordionVariant ?? "default";
				const editButton = getEditAction({
					edit: field.edit,
					data,
					defaultAriaLabel: "Edit section",
					className: "absolute top-2 right-2",
				});
				const showEditButton = Boolean(editButton);
				const sectionContent = renderFieldGroup(
					field.fields ?? [],
					field.layout,
					field.alwaysShow ?? config.alwaysShow,
				);
				if (!sectionContent) return;
				const wrapperId = field.infoId;
				const wrapperKey = field.id ?? `section-${fieldIndex}`;

				const spanClass = getSpanClass(field.layout, layoutColumns);
				let layoutProps: { className?: string; spanClass?: string } | undefined;
				const wrapperClassName = cn(field.className);
				if (field.layout?.spanClass || spanClass || wrapperClassName) {
					layoutProps = {
						spanClass: cn(field.layout?.spanClass, spanClass),
						className: wrapperClassName,
					};
				}

				let heroToneClassName: string | undefined;
				if (sectionCardVariant === "hero") {
					if (field.heroStatus === "in_use") {
						heroToneClassName = "bg-brand-default";
					} else {
						heroToneClassName = "bg-neutral-20";
					}
				}

				const showTitleInBody = !useAccordion && Boolean(field.title);
				const showDescriptionInBody =
					Boolean(field.description) && (!useAccordion || Boolean(field.title));

				const showEditButtonInBody = showEditButton && !useAccordion;
				const sectionHeader =
					showTitleInBody || showDescriptionInBody || showEditButtonInBody ? (
						<div className="flex items-start relative justify-between gap-4">
							<div>
								{showTitleInBody && (
									<h3 className="text-lg font-semibold">{field.title}</h3>
								)}
								{showDescriptionInBody && (
									<p className="body3 text-foreground mt-1">
										{field.description}
									</p>
								)}
							</div>
							{showEditButtonInBody ? editButton : null}
						</div>
					) : null;

				const bodyContent = (
					<div className="space-y-2">
						{sectionHeader}
						{sectionContent}
					</div>
				);

				const renderedSection = (
					<ScrollReveal key={wrapperKey} className={layoutProps?.spanClass}>
						<SectionWrapper
							wrapperId={wrapperId}
							wrapperClassName={cn(layoutProps?.className, "flex flex-col")}
							useAccordion={useAccordion}
							accordionValue={wrapperKey}
							accordionDefaultOpen={defaultOpen}
							accordionVariant={accordionVariant}
							accordionTriggerClassName="text-lg font-semibold"
							accordionTitle={
								field.title ?? field.description ?? field.id ?? "Details"
							}
							accordionAction={useAccordion ? editButton : undefined}
							cardVariant={sectionCardVariant}
							cardClassName={heroToneClassName}
							bodyContent={bodyContent}
							onClick={
								field.onClick
									? () => field.onClick?.(data as Institution)
									: undefined
							}
							onClickAriaLabel={field.onClickAriaLabel}
							onClickAsButton={!showEditButtonInBody}
						/>
					</ScrollReveal>
				);

				if (renderedSection) nodes.push(renderedSection);
			} else {
				const renderedField = renderField(field, fieldIndex, layoutColumns);
				if (renderedField) fieldNodes.push(renderedField);
			}
		});

		flushFields();
		if (nodes.length === 0) {
			if (!alwaysShow) return null;
			return <div className={cn("grid gap-4", gridClass)} />;
		}
		if (layoutColumns && hasSectionNodes) {
			return <div className={cn("grid gap-4", gridClass)}>{nodes}</div>;
		}
		return <>{nodes}</>;
	};

	return (
		<div className={cn(getLayoutClass(), config.className)} id={config.infoId}>
			{renderFieldGroup(config.fields, config.layout, config.alwaysShow)}
		</div>
	);
}
