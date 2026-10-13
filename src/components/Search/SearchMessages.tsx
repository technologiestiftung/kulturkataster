import { cn } from "@/lib/utils";

interface SearchMessagesProps {
	id?: string;
	message: string | null;
	isLoading: boolean;
	query: string;
	className?: string;
}

/**
 * Visible error / "no results" message for a search. Screen readers get the
 * same text via the search's polite live region (see useSearch).
 */
export function SearchMessages({
	id,
	message,
	isLoading,
	query,
	className,
}: SearchMessagesProps) {
	if (!message || isLoading || query.trim().length === 0) {
		return null;
	}

	return (
		<p
			id={id}
			className={cn(
				"body2 rounded-lg bg-background p-4 shadow-sm pointer-events-auto",
				className,
			)}
		>
			{message}
		</p>
	);
}
