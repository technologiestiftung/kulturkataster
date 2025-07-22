import { Heart, Home, Star } from "lucide-react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

// Available icons mapping
const ICONS = {
	heart: Heart,
	star: Star,
	home: Home,
} as const;

type IconName = keyof typeof ICONS;

/**
 * Creates an SVG icon with your custom shape and a Lucide icon inside
 */
export function createIconSvg(
	iconName: IconName = "heart",
	fillColor: string = "#C288FF",
	iconColor: string = "white",
): string {
	const IconComponent = ICONS[iconName];

	if (!IconComponent) {
		throw new Error(
			`Icon "${iconName}" not found. Available icons: ${Object.keys(ICONS).join(", ")}`,
		);
	}

	// Render the Lucide icon to string and extract just the inner content
	const iconString = renderToString(
		createElement(IconComponent, {
			size: 16,
			color: iconColor,
			strokeWidth: 2,
		}),
	);

	// Create the complete SVG with your original custom shape
	const svgString = `
<svg width="38" height="39" viewBox="0 0 38 39" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g>
    <path d="M5 0.5H33C33.8284 0.5 34.5 1.17157 34.5 2V22.4199C34.5 22.9782 34.19 23.4903 33.6953 23.749L19.6953 31.0723C19.2598 31.3 18.7402 31.3 18.3047 31.0723L4.30469 23.749C3.81004 23.4903 3.50003 22.9782 3.5 22.4199V2C3.5 1.17157 4.17157 0.5 5 0.5Z" fill="${fillColor}" stroke="${fillColor}"/>
  </g>
  <foreignObject x="11" y="6" width="16" height="16">
    <div xmlns="http://www.w3.org/1999/xhtml" style="width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;">
      ${iconString}
    </div>
  </foreignObject>
</svg>`.trim();

	// Convert to data URL for use with OpenLayers Icon
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
}

// Usage examples:
// const heartIcon = createIconSvg('heart');
// const starIcon = createIconSvg('star', '#FF6B6B', 'white');
// const homeIcon = createIconSvg('home', '#4ECDC4', '#333333');
