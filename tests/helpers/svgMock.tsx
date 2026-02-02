import type { SVGProps } from "react";

export default function SvgMock(props: SVGProps<SVGSVGElement>) {
	return (
		<svg {...props} data-testid="svg-mock" viewBox="0 0 24 24">
			<rect width="24" height="24" />
		</svg>
	);
}
