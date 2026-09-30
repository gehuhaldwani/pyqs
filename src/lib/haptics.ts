import { defaultPatterns, WebHaptics } from "web-haptics";

const haptics = new WebHaptics({
	debug: import.meta.env.DEV,
});

export { defaultPatterns, haptics };
