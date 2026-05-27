import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { reportClientTelemetry } from "@/lib/utils/clientTelemetry";

/**
 * Props for the useSearch hook.
 * @template T The type of the search results.
 *
 * @property {function} searchFunction The function to call to search for results.
 * The function should return a Promise that resolves to an array of results.
 */
interface UseSearchProps<T> {
	timeoutDuration: number;
	searchFunction: (query: string) => Promise<T[]>;
}

/**
 * A hook to handle searching for results.
 * @template T The type of the search results.
 * @param {UseSearchProps<T>} props The props for the hook.
 * @returns {object} An object containing the search state and functions.
 */
export function useSearch<T>({
	timeoutDuration,
	searchFunction,
}: UseSearchProps<T>) {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<T[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [resultErrorMessage, setResultErrorMessage] = useState<string | null>(
		null,
	);
	const [requestId, setRequestId] = useState<number>(0);
	const statusRef = useRef<HTMLDivElement>(null);
	const [debounceTimeout, setDebounceTimeout] = useState<ReturnType<
		typeof setTimeout
	> | null>(null);
	const { t } = useTranslation();

	useEffect(() => {
		return () => {
			if (debounceTimeout) clearTimeout(debounceTimeout);
		};
	}, [debounceTimeout]);

	// Search for results when the query changes.
	useEffect(() => {
		if (debounceTimeout) clearTimeout(debounceTimeout);

		const timeout = setTimeout(() => {
			search();
		}, timeoutDuration);

		setDebounceTimeout(timeout);
	}, [query]);

	const search = async () => {
		if (!query.trim()) {
			setResults([]);
			return;
		}

		setIsLoading(true);
		const currentRequestId = requestId + 1;
		setRequestId(currentRequestId);

		try {
			const data = await searchFunction(query);

			if (currentRequestId === requestId + 1) {
				if (data.length === 0) {
					displayResultError();
				} else {
					setResultErrorMessage(null);
				}

				setResults(data);

				// Announce results to screen readers
				if (statusRef.current) {
					const resultCount = data.length;
					statusRef.current.textContent = `${resultCount} ${
						resultCount === 1 ? "Ergebnis" : "Ergebnisse"
					} gefunden.`;
				}
			}
		} catch (error) {
			if (currentRequestId === requestId + 1) {
				reportClientTelemetry({
					level: "warn",
					event: "search.query.failed",
					error,
					metadata: {
						query_length: query.trim().length,
					},
				});
				setResults([]);
				setResultErrorMessage(
					"Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
				);
			}
		} finally {
			if (currentRequestId === requestId + 1) {
				setIsLoading(false);
			}
		}
	};

	const displayResultError = () => {
		setResultErrorMessage(t("common.search.noResultsFound"));
	};

	return {
		query,
		results,
		isLoading,
		resultErrorMessage,
		statusRef,
		setResults,
		setQuery,
	};
}
