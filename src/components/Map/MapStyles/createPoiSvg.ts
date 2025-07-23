import { getCategoryIconSafe } from "@/lib/utils/iconUtils";
import { createElement, FC, SVGProps } from "react";
import { renderToString } from "react-dom/server";

type SvgIconComponent = FC<SVGProps<SVGSVGElement>>;

function extractSvgContent(svgString: string): {
	inner: string;
	viewBox: string;
} {
	const innerMatch = svgString.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
	const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/);

	const rawInner = innerMatch ? innerMatch[1].trim() : svgString;
	const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 24 24";

	return { inner: rawInner, viewBox };
}

function sanitizeSvgWrapper(svgString: string): string {
	return svgString.replace(/<svg([^>]*)fill="[^"]*"([^>]*)>/, "<svg$1$2>");
}

export function createPoiSvg(
	categoryName: string,
	fillColor = "#C288FF",
	iconColor = "#161616",
): string {
	const iconComponent: SvgIconComponent = getCategoryIconSafe(categoryName);

	const rendered = renderToString(
		createElement(iconComponent, {
			fill: iconColor,
			color: iconColor,
		}),
	);

	const sanitized = sanitizeSvgWrapper(rendered);
	const { inner, viewBox } = extractSvgContent(sanitized);

	const svg = `
<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="drop-shadow-300" x="0" y="0" width="40" height="40" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="2" flood-opacity="0.15" flood-color="#000000" stdDeviation="4"/>
    </filter>
  </defs>
  <g filter="url(#drop-shadow-300)">
    <path d="M6 4.5H30C30.8284 4.5 31.5 5.17157 31.5 6V22.4199C31.5 22.9782 31.19 23.4903 30.6953 23.749L18.6953 29.0723C18.2598 29.3 17.7402 29.3 17.3047 29.0723L5.30469 23.749C4.81004 23.4903 4.50003 22.9782 4.5 22.4199V6C4.5 5.17157 5.17157 4.5 6 4.5Z" fill="${fillColor}" stroke="${fillColor}" />
  </g>
  <foreignObject x="8" y="6" width="20" height="20">
    <div xmlns="http://www.w3.org/1999/xhtml" style="width:20px;height:20px;display:flex;align-items:center;justify-content:center;">
      <svg viewBox="${viewBox}" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${inner}
      </svg>
    </div>
  </foreignObject>
</svg>`.trim();

	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
