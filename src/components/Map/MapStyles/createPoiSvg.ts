/* eslint-disable max-params */

import { remToPx } from "@/lib/utils/mapUtils";

export const PLACEHOLDER_ICON_RAW_SVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export const MULTI_CATEGORIES_ICON_RAW_SVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" fill="currentColor"/>
<path d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z" fill="currentColor"/>
<path d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z" fill="currentColor"/>
<path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" stroke="currentColor" stroke-width="1.67" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z" stroke="currentColor" stroke-width="1.67" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z" stroke="currentColor" stroke-width="1.67" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export function extractSvgContent(svgString: string): {
	inner: string;
	viewBox: string;
} {
	const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/);
	const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 24 24";
	const innerMatch = svgString.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
	const inner = innerMatch ? innerMatch[1].trim() : "";
	return { inner, viewBox };
}

const sanitizeSvgMarkup = (svg: string): string =>
	svg
		.replace(/<script[\s\S]*?<\/script>/gi, "")
		.replace(/\son\w+="[^"]*"/gi, "")
		.replace(/\son\w+='[^']*'/gi, "")
		.replace(/javascript:/gi, "");

export function createPoiSvg(
	iconRawSvg: string,
	fillColor = "#C288FF",
	iconColor = "#FFFFFF",
	state: string = "default",
): string {
	const size = state === "selected" ? 3.5 : 2.5;
	const sanitizedIconRawSvg = sanitizeSvgMarkup(
		iconRawSvg?.trim() ? iconRawSvg : PLACEHOLDER_ICON_RAW_SVG,
	);
	const { inner, viewBox } = extractSvgContent(sanitizedIconRawSvg);

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
		<svg x="8" y="6" width="20" height="20" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
			<g style="color:${iconColor}">
				${inner}
			</g>
		</svg>
		</svg>`.trim();

	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
