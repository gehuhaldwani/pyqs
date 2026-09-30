function formatBuildTime(date: Date, timeZone: string): string {
	return date.toLocaleString("en-IN", { timeZone });
}

export { formatBuildTime };
