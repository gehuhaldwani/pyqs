import { hapticTrigger } from "ios-haptics";
import type { Attachment } from "svelte/attachments";

// A light tick when a control is tapped. iOS Safari has no vibration API, so ios-haptics overlays a hidden native switch,
// which ticks when the tap reaches it. Android browsers use navigator.vibrate instead.
export const haptic: Attachment<HTMLElement> = (node) => {
	hapticTrigger(node);
	if (!("vibrate" in navigator)) return;
	const buzz = () => navigator.vibrate(10);
	node.addEventListener("click", buzz);
	return () => node.removeEventListener("click", buzz);
};
