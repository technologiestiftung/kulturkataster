"use client";

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
	return (
		<div
			className="w-full overflow-x-auto"
			role="group"
			aria-label="Filter institutions by first letter"
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
									"bg-background text-foreground hover:bg-foreground/50 hover:text-background",
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
