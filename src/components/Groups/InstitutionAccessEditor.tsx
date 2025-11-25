"use client";

import { Label } from "@/components/ui/label";
import type {
	GroupInstitutionAccess,
	CategoryAccess,
	SubcategoryAccess,
	InstitutionAccess,
} from "./types";
import { CategorySelector } from "./CategorySelector";
import { SubcategorySelector } from "./SubcategorySelector";
import { InstitutionSelector } from "../Users/InstitutionSelector";
import { DistrictSelector } from "./DistrictSelector";
import {
	getCategoriesWithSubcategories,
	searchInstitutions,
	getInstitutionsGeoJSON,
} from "@/lib/serverActions/institutions";
import type { Category } from "@/types";
import type { MultiSelectOption } from "@/components/shared/MultiSelect";
import type { SearchableSelectOption } from "@/components/shared/SearchableSelect";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Feature, Geometry } from "geojson";

interface InstitutionAccessEditorProps {
	access: GroupInstitutionAccess;
	institutionCount: number;
	onChange: (access: GroupInstitutionAccess) => void;
}

interface InstitutionProperties {
	id?: string | number;
	slug?: string;
	institution_id?: string | number;
	name?: string;
	title?: string;
	address?: string;
	city?: string;
	district?: string;
	category_keys?: string[];
	categories?: string[];
	category?: { key: string };
	subcategory_keys?: string[];
	subcategories?: string[];
	subcategory?: { key: string };
}

type InstitutionFeature = Feature<Geometry | null, InstitutionProperties>;

export function InstitutionAccessEditor({
	access,
	institutionCount,
	onChange,
}: InstitutionAccessEditorProps) {
	const { t: tEnum } = useTranslation("enumMap");
	const [categoriesData, setCategoriesData] = useState<Category[]>([]);
	const [categoryOptions, setCategoryOptions] = useState<MultiSelectOption[]>(
		[],
	);
	const [matchedInstitutionOptions, setMatchedInstitutionOptions] = useState<
		SearchableSelectOption[]
	>([]);
	const [searchInstitutionOptions, setSearchInstitutionOptions] = useState<
		SearchableSelectOption[]
	>([]);
	const [loadingInstitutions, setLoadingInstitutions] = useState(false);

	useEffect(() => {
		const loadCategories = async () => {
			const categories = await getCategoriesWithSubcategories();
			setCategoriesData(categories);
			setCategoryOptions(
				categories.map((cat) => ({
					value: cat.key || String(cat.id),
					label:
						tEnum(`category.${cat.key}`) ||
						cat.key ||
						cat.id?.toString() ||
						"Category",
				})),
			);
		};
		loadCategories();
	}, [tEnum]);

	const selectedCategories = access.categories || [];
	const selectedSubcategories = access.subcategories || [];
	const availableSubcategories = useMemo(() => {
		const selectedKeys = new Set(selectedCategories.map((cat) => cat.key));
		return categoriesData
			.filter((category) => selectedKeys.has(category.key))
			.flatMap((category) =>
				(category.subcategory || []).map((sub) => ({
					value: sub.key,
					label:
						`${tEnum(`category.${category.key}`) || category.key} — ` +
						`${tEnum(`subcategory.${sub.key}`) || sub.key}`,
				})),
			);
	}, [selectedCategories, categoriesData, tEnum]);
	const subcategoryCategoryMap = useMemo(() => {
		const map = new Map<string, string>();
		categoriesData.forEach((cat) => {
			(cat.subcategory || []).forEach((sub) => {
				map.set(sub.key, cat.key || "");
			});
		});
		return map;
	}, [categoriesData]);

	const matchedInstitutionCount = matchedInstitutionOptions.length;

	const displayedCount =
		access.type === "category"
			? matchedInstitutionCount
			: access.type === "custom"
				? access.institutions?.length || 0
				: institutionCount;

	const currentInstitutionIds =
		access.type === "custom" && access.institutions
			? access.institutions.map((inst) => inst.id)
			: matchedInstitutionOptions.map((inst) => inst.value);

	const combinedInstitutionOptions = useMemo(
		() =>
			[...matchedInstitutionOptions, ...searchInstitutionOptions].filter(
				(option, index, self) =>
					self.findIndex((o) => o.value === option.value) === index,
			),
		[matchedInstitutionOptions, searchInstitutionOptions],
	);

	const getSubcategoriesForCategories = (
		categories: CategoryAccess[],
		sourceCategories: Category[],
	): SubcategoryAccess[] => {
		const selectedKeys = new Set(categories.map((cat) => cat.key));
		return sourceCategories
			.filter((category) => selectedKeys.has(category.key))
			.flatMap((category) =>
				(category.subcategory || []).map((sub) => ({
					key: sub.key,
					name: tEnum(`subcategory.${sub.key}`) || sub.key,
					categoryKey: category.key || sub.category_id?.toString() || "",
				})),
			);
	};

	const mapInstitutionIdsToAccess = (
		ids: string[],
		options: SearchableSelectOption[],
	): InstitutionAccess[] =>
		ids.map((id) => {
			const match = options.find((opt) => opt.value === id);
			return {
				id,
				name: match?.label || id,
			};
		});

	const fetchInstitutionsForSelection = async (
		categories: CategoryAccess[],
		subcategories: SubcategoryAccess[],
	) => {
		setLoadingInstitutions(true);
		try {
			const geojson = await getInstitutionsGeoJSON().catch(() => null);
			if (geojson && "features" in geojson && Array.isArray(geojson.features)) {
				const features = geojson.features as InstitutionFeature[];
				const selectedCategoryKeys = new Set(categories.map((c) => c.key));
				const selectedSubcategoryKeys = new Set(
					subcategories.map((s) => s.key),
				);
				const fallbackOptions: SearchableSelectOption[] = features
					.filter((feature) => {
						const props = feature.properties || {};
						const featureCategories: string[] =
							props.category_keys ||
							props.categories ||
							(props.category?.key ? [props.category.key] : []);
						const featureSubcats: string[] =
							props.subcategory_keys ||
							props.subcategories ||
							(props.subcategory?.key ? [props.subcategory.key] : []);

						const matchesCategory =
							selectedCategoryKeys.size === 0 ||
							featureCategories.length === 0 ||
							featureCategories.some((key) => selectedCategoryKeys.has(key));
						const matchesSubcategory =
							selectedSubcategoryKeys.size === 0 ||
							featureSubcats.length === 0 ||
							featureSubcats.some((key) => selectedSubcategoryKeys.has(key));
						return matchesCategory && matchesSubcategory;
					})
					.map((feature) => ({
						value: String(
							feature.id ||
								feature.properties?.id ||
								feature.properties?.slug ||
								feature.properties?.institution_id ||
								"",
						),
						label:
							feature.properties?.name ||
							feature.properties?.title ||
							"Institution",
						description:
							feature.properties?.address ||
							feature.properties?.city ||
							feature.properties?.district ||
							"",
					}));
				setMatchedInstitutionOptions(fallbackOptions);
				return fallbackOptions;
			}
			setMatchedInstitutionOptions([]);
			return [];
		} finally {
			setLoadingInstitutions(false);
		}
	};

	useEffect(() => {
		if (
			access.type === "category" &&
			selectedCategories.length > 0 &&
			categoriesData.length > 0
		) {
			fetchInstitutionsForSelection(
				selectedCategories,
				selectedSubcategories,
			).then((options) => {
				if (options.length > 0) {
					onChange({
						...access,
						type: "category",
						institutions: mapInstitutionIdsToAccess(
							options.map((opt) => opt.value),
							options,
						),
					});
				}
			});
		} else if (
			categoriesData.length > 0 &&
			matchedInstitutionOptions.length === 0
		) {
			// Populate base options even when no categories are selected (for custom mode demo)
			fetchInstitutionsForSelection([], []);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [categoriesData.length]);

	const handleCategoriesChange = (categories: CategoryAccess[]) => {
		const allSubcategories = getSubcategoriesForCategories(
			categories,
			categoriesData,
		);
		fetchInstitutionsForSelection(categories, allSubcategories).then(
			(options) => {
				const fullInstitutions = mapInstitutionIdsToAccess(
					options.map((opt) => opt.value),
					options,
				);

				onChange({
					...access,
					type: "category",
					categories,
					subcategories: allSubcategories,
					institutions: fullInstitutions,
				});
			},
		);
	};

	const handleSubcategoriesChange = (subcategories: SubcategoryAccess[]) => {
		fetchInstitutionsForSelection(selectedCategories, subcategories).then(
			(options) => {
				const fullInstitutions = mapInstitutionIdsToAccess(
					options.map((opt) => opt.value),
					options,
				);

				onChange({
					...access,
					type: "category",
					subcategories,
					institutions: fullInstitutions,
				});
			},
		);
	};

	const handleInstitutionSelectionChange = (selectedIds: string[]) => {
		const matchedIds = new Set(
			matchedInstitutionOptions.map((opt) => opt.value),
		);
		const selectedInstitutions: InstitutionAccess[] = mapInstitutionIdsToAccess(
			selectedIds,
			combinedInstitutionOptions,
		);
		const isExactMatch =
			matchedInstitutionOptions.length > 0 &&
			selectedIds.length === matchedInstitutionOptions.length &&
			selectedIds.every((id) => matchedIds.has(id));
		const includesOutside = selectedIds.some((id) => !matchedIds.has(id));

		onChange({
			...access,
			type: isExactMatch && !includesOutside ? "category" : "custom",
			institutions: selectedInstitutions,
		});
	};

	const handleSearchInstitutions = async (term: string) => {
		if (!term || term.trim().length === 0) {
			setSearchInstitutionOptions([]);
			return;
		}
		try {
			const results = await searchInstitutions(term);
			const options: SearchableSelectOption[] = (results || []).map((inst) => ({
				value: String(inst.id ?? inst.institution_id ?? inst.slug ?? ""),
				label: inst.name || inst.title || "Institution",
				description: inst.address || inst.city || "",
			}));
			setSearchInstitutionOptions(options);
		} catch (error) {
			console.error(
				"Institution search failed, falling back to GeoJSON",
				error,
			);
			const geojson = await getInstitutionsGeoJSON().catch(() => null);
			if (geojson && "features" in geojson && Array.isArray(geojson.features)) {
				const fallback = (geojson.features as InstitutionFeature[])
					.map((feature) => ({
						value: String(
							feature.id ||
								feature.properties?.id ||
								feature.properties?.slug ||
								feature.properties?.institution_id ||
								"",
						),
						label:
							feature.properties?.name ||
							feature.properties?.title ||
							"Institution",
						description:
							feature.properties?.address ||
							feature.properties?.city ||
							feature.properties?.district ||
							"",
					}))
					.filter((opt) =>
						opt.label.toLowerCase().includes(term.toLowerCase()),
					);
				setSearchInstitutionOptions(fallback);
			} else {
				setSearchInstitutionOptions([]);
			}
		}
	};

	useEffect(() => {
		if (access.type === "category" && selectedCategories.length > 0) {
			fetchInstitutionsForSelection(selectedCategories, selectedSubcategories);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<div className="space-y-2">
			<Label htmlFor="accessType">Institution Access</Label>
			<select
				id="accessType"
				className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				value={access.type}
				onChange={(e) =>
					onChange({
						...access,
						type: e.target.value as GroupInstitutionAccess["type"],
					})
				}
			>
				<option value="all">Alle (All)</option>
				<option value="district">Distrikt (District)</option>
				<option value="category">Spartenverband (Category)</option>
				<option value="custom">Benutzerdefiniert (Custom)</option>
			</select>

			{access.type === "district" && (
				<div className="space-y-2">
					<Label className="text-sm text-muted-foreground">
						Select Districts
					</Label>
					<DistrictSelector
						selectedDistricts={access.districts || []}
						onChange={(districts) =>
							onChange({
								...access,
								districts,
							})
						}
					/>
				</div>
			)}

			{access.type === "category" && (
				<div className="space-y-2">
					<Label className="text-sm text-muted-foreground">
						Select Categories
					</Label>
					<CategorySelector
						selectedCategories={selectedCategories}
						options={categoryOptions}
						onChange={handleCategoriesChange}
					/>
					{selectedCategories.length > 0 && (
						<div className="space-y-1">
							<Label className="text-sm text-muted-foreground">
								Select Subcategories
							</Label>
							<SubcategorySelector
								availableSubcategories={availableSubcategories}
								selectedSubcategories={selectedSubcategories}
								onChange={handleSubcategoriesChange}
								getCategoryKey={(subKey) => subcategoryCategoryMap.get(subKey)}
							/>
						</div>
					)}
					{matchedInstitutionOptions.length > 0 && (
						<div className="space-y-1">
							<Label className="text-sm text-muted-foreground">
								Matched Institutions (deselect or add to customize)
							</Label>
							<InstitutionSelector
								selectedInstitutions={mapInstitutionIdsToAccess(
									currentInstitutionIds,
									combinedInstitutionOptions,
								)}
								onChange={(institutions) =>
									handleInstitutionSelectionChange(
										institutions.map((inst) => inst.id),
									)
								}
								options={combinedInstitutionOptions}
								onSearch={handleSearchInstitutions}
							/>
							<div className="flex items-center justify-between text-xs text-muted-foreground">
								<p>
									Deselecting or adding an institution will switch access to
									custom.
								</p>
								{loadingInstitutions && <span>Lädt Institutionen...</span>}
							</div>
						</div>
					)}
				</div>
			)}

			{access.type === "custom" && (
				<div className="space-y-2">
					<Label className="text-sm text-muted-foreground">
						Select Institutions
					</Label>
					<InstitutionSelector
						selectedInstitutions={access.institutions || []}
						onChange={(institutions) =>
							onChange({
								...access,
								institutions,
							})
						}
						options={
							matchedInstitutionOptions.length > 0
								? combinedInstitutionOptions
								: undefined
						}
					/>
				</div>
			)}

			<div className="p-3 bg-muted rounded-md text-sm">
				<span className="text-muted-foreground">
					Currently: {displayedCount}{" "}
					{displayedCount === 1 ? "institution" : "institutions"}
				</span>
			</div>
		</div>
	);
}
