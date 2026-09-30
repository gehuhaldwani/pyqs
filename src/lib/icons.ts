import type { IconifyJSON } from "@iconify/types";
import { getIconData, iconToHTML, iconToSVG, replaceIDs } from "@iconify/utils";
import { icons as mdi } from "@iconify-json/mdi";
import { icons as simpleIcons } from "@iconify-json/simple-icons";

// Icon sets available for rendering outside of astro-icon's <Icon> component.
const collections: Record<string, IconifyJSON> = {
	mdi,
	"simple-icons": simpleIcons,
};

// Renders an iconify name like "mdi:web" to an SVG string, or null if unknown.
function renderIconSvg(name: string): string | null {
	const [prefix, iconName] = name.split(":");
	const collection = collections[prefix];
	if (!collection || !iconName) {
		return null;
	}

	const data = getIconData(collection, iconName);
	if (!data) {
		return null;
	}

	const { attributes, body } = iconToSVG(data);
	return iconToHTML(replaceIDs(body), {
		...attributes,
		"data-icon": name,
	});
}

export { renderIconSvg };
