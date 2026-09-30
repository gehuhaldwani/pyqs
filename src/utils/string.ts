function toTitleCase(str: string): string {
	return str.replace(
		/\w\S*/g,
		(text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase(),
	);
}

function formatPageTitle(siteTitle: string, pageTitle?: string): string {
	return pageTitle ? `${siteTitle} | ${pageTitle}` : siteTitle;
}

export { formatPageTitle, toTitleCase };
