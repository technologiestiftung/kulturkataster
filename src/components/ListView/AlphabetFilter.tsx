"use client";

import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type AlphabetFilterProps = {
	activeLetter: string | null;
	onSelectLetter: (letter: string | null) => void;
	enabledLetters: Set<string>;
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function AlphabetFilter({
	activeLetter,
	onSelectLetter,
	enabledLetters,
}: AlphabetFilterProps) {
	const { t } = useTranslation();
	return (
		<div
			className="w-full overflow-x-auto"
			role="group"
			aria-label={t("common.a11y.list.letterFilter")}
		>
			<div className="inline-flex min-w-full items-center py-1">
				{LETTERS.map((letter) => {
					const isEnabled = enabledLetters.has(letter);
					const isActive = activeLetter === letter;

					return (
						<button
							key={letter}
							type="button"
							disabled={!isEnabled}
							aria-pressed={isActive}
							onClick={() => onSelectLetter(isActive ? null : letter)}
							className={cn(
								"-ml-px first:ml-0 h-8 min-w-8 flex-1 border border-neutral-20 px-2 body2 font-bold transition-colors first:rounded-l-sm last:rounded-r-sm",
								isActive && "bg-foreground text-background",
								!isActive &&
									isEnabled &&
									"bg-background text-foreground hover:bg-neutral-20",
								!isActive &&
									!isEnabled &&
									"bg-neutral-5 text-neutral-40 cursor-not-allowed",
							)}
						>
							{letter}
						</button>
					);
				})}
			</div>
		</div>
	);
}
