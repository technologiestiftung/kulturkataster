import { RankingInfo } from "@tanstack/match-sorter-utils";

declare module "*.svg?raw" {
	const content: string;
	export default content;
}

declare module "*.svg?url" {
	const content: string;
	export default content;
}

declare module "*.svg" {
	import type { FC, SVGProps } from "react";
	const content: FC<SVGProps<SVGSVGElement>>;
	export default content;
}

declare module "@tanstack/react-table" {
	interface FilterMeta {
		itemRank?: RankingInfo;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface ColumnMeta<TData, TValue> {
		pin?: "left" | "right";
		truncate?: boolean;
	}
}

// Cap's captcha web component (cap-widget), see src/components/Captcha.
declare module "react" {
	namespace JSX {
		interface IntrinsicElements {
			"cap-widget": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement>,
				HTMLElement
			>;
		}
	}
}
