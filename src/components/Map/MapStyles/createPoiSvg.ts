import { getCategoryIconRawSvg } from "@/lib/utils/iconUtils";
import { remToPx } from "@/lib/utils/mapUtils";
import { CategoryType } from "@/types";

function extractSvgContent(svgString: string): {
	inner: string;
	viewBox: string;
} {
	const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/);
	const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 24 24";
	const innerMatch = svgString.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
	const inner = innerMatch ? innerMatch[1].trim() : "";
	return { inner, viewBox };
}

export function createPoiSvg(
	categoryKey: CategoryType,
	fillColor = "#C288FF",
	iconColor = "#FFFFFF", // Changed default to white for better contrast
	state: string = "default",
): string {
	const iconSvgString = getCategoryIconRawSvg(categoryKey);
	const { inner, viewBox } = extractSvgContent(iconSvgString);
	const size = state === "selected" ? 3.5 : 2.5;

	const svg = `
		<svg width="${remToPx(size)}px" height="${remToPx(size)}px" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
			<defs>
				<filter id="drop-shadow-300" x="0" y="0" width="${remToPx(size)}px" height="${remToPx(size)}px" filterUnits="userSpaceOnUse">
				<feDropShadow dx="0" dy="2" flood-opacity="0.15" flood-color="#000000" stdDeviation="4"/>
			</filter>
		</defs>
		<g filter="url(#drop-shadow-300)">
			<path d="M6 4.5H30C30.8284 4.5 31.5 5.17157 31.5 6V22.4199C31.5 22.9782 31.19 23.4903 30.6953 23.749L18.6953 29.0723C18.2598 29.3 17.7402 29.3 17.3047 29.0723L5.30469 23.749C4.81004 23.4903 4.50003 22.9782 4.5 22.4199V6C4.5 5.17157 5.17157 4.5 6 4.5Z" fill="${fillColor}" stroke="${fillColor}" />
		</g>
		<foreignObject x="8" y="6" width="20" height="20">
			<div xmlns="http://www.w3.org/1999/xhtml" style="width:20px;height:20px;display:flex;align-items:center;justify-content:center;color:${iconColor};">
			<svg viewBox="${viewBox}" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
				${inner}
			</svg>
			</div>
		</foreignObject>
		</svg>`.trim();

	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
