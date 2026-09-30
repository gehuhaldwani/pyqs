// Includes the zone name, such as "IST", so it always matches the configured timeZone.
function formatBuildTime(date: Date, timeZone: string): string {
	return date.toLocaleString("en-IN", { timeZone, timeZoneName: "short" });
}

export { formatBuildTime };
