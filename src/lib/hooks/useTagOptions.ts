"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SelectOption } from "@/components/FormWrapper";
import { toNewTagValue } from "@/lib/utils/institutionTagSelection";
import { reportClientTelemetry } from "@/lib/utils/clientTelemetry";
import { getTags } from "@/server/actions/tags";

type TagOption = { id: number; name: string };

/**
 * Loads the tag options for the place form and keeps tags typed in the form as
 * pending options until the place is saved. Loads nothing when the user cannot read tags.
 */
export const useTagOptions = (enabled: boolean, newTagLabel: string) => {
	const [tags, setTags] = useState<TagOption[]>([]);
	const [newTagNames, setNewTagNames] = useState<string[]>([]);

	useEffect(() => {
		if (!enabled) return;
		let active = true;
		getTags()
			.then((result) => {
				if (active) setTags(result);
			})
			.catch((error) => {
				reportClientTelemetry({
					level: "warn",
					event: "institution_form.tags_load.failed",
					error,
				});
			});
		return () => {
			active = false;
		};
	}, [enabled]);

	const tagOptions = useMemo<SelectOption[]>(
		() => [
			...tags.map((tag) => ({ value: String(tag.id), label: tag.name })),
			...newTagNames.map((name) => ({
				value: toNewTagValue(name),
				label: `${name} (${newTagLabel})`,
				searchText: name,
			})),
		],
		[newTagLabel, newTagNames, tags],
	);

	const createTagOption = useCallback(
		(name: string) => {
			const pendingName = newTagNames.find(
				(item) => item.toLowerCase() === name.toLowerCase(),
			);
			if (pendingName) return toNewTagValue(pendingName);
			setNewTagNames((current) => [...current, name]);
			return toNewTagValue(name);
		},
		[newTagNames],
	);

	return { tagOptions, createTagOption };
};
