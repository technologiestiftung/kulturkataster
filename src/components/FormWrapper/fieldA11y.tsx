import type { FieldType } from "./types";

// Control types whose rendered element (input, textarea, combobox,
// radiogroup, checkbox, switch) supports aria-required. For the others
// (groups, dialog triggers, composite widgets) the required state is
// announced via visually hidden text in the label instead.
const ARIA_REQUIRED_TYPES = new Set<FieldType>([
	"text",
	"email",
	"password",
	"number",
	"tel",
	"url",
	"date",
	"partialDate",
	"file",
	"textarea",
	"select",
	"radio",
	"likert",
	"likertMatrix",
	"checkbox",
	"switch",
]);

// Control types whose element can be referenced by <label htmlFor>.
const LABELABLE_TYPES = new Set<FieldType>([
	"text",
	"email",
	"password",
	"number",
	"tel",
	"url",
	"date",
	"partialDate",
	"file",
	"textarea",
	"select",
	"checkbox",
	"switch",
]);

export const supportsAriaRequired = (type: FieldType) =>
	ARIA_REQUIRED_TYPES.has(type);

export const isLabelableType = (type: FieldType) => LABELABLE_TYPES.has(type);

export const getFieldA11yIds = (name: string) => ({
	labelId: `${name}-label`,
	descriptionId: `${name}-description`,
	privateNoteId: `${name}-private-note`,
	formatHintId: `${name}-format-hint`,
	errorId: `${name}-error`,
});

/** Joins the ids that are actually rendered into an aria-describedby value. */
export const joinIds = (...ids: Array<string | false | null | undefined>) =>
	ids.filter(Boolean).join(" ") || undefined;

/** First keyboard-focusable element: the element itself or a descendant. */
export const findFocusableTarget = (
	element: HTMLElement | null,
): HTMLElement | null => {
	if (!element) return null;
	if (element.tabIndex >= 0 && !element.hasAttribute("disabled")) {
		return element;
	}
	const candidates = element.querySelectorAll<HTMLElement>(
		"input, select, textarea, button, [tabindex]",
	);
	return (
		Array.from(candidates).find(
			(candidate) =>
				candidate.tabIndex >= 0 &&
				!candidate.hasAttribute("disabled") &&
				candidate.getAttribute("aria-hidden") !== "true" &&
				(candidate as HTMLInputElement).type !== "hidden",
		) ?? null
	);
};

/** Visual required marker; the state itself is exposed via aria-required or sr-only text. */
export function RequiredMark({ srText }: { srText?: string }) {
	return (
		<>
			<span aria-hidden="true" className="ml-1">
				*
			</span>
			{srText ? (
				<>
					{" "}
					<span className="sr-only">{srText}</span>
				</>
			) : null}
		</>
	);
}
