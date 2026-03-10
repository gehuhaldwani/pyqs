import { WebHaptics, defaultPatterns } from "web-haptics";

const haptics = new WebHaptics({
    debug: import.meta.env.DEV,
});

export {
    haptics,
    defaultPatterns,
};