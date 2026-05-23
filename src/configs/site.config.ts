import type { SiteConfig, Social } from "./types";

const siteConfig: SiteConfig = {
	"site": {
		"title": "PYQs Archive",
		"description": "A collection of student contributed previous year question papers for Graphic Era Hill University semester examinations.",
		"url": "https://hualdwani.gehu.in/pyqs",
		"githubRepo": "gehuhaldwani/pyqs",
		"logo": "/logo.png",
		"favicon": "/favicon.ico",
		"timezone": "Asia/Kolkata"
	},
	"header": {
		"links": [
			{
				"type": "external",
				"name": "Support",
				"url": "https://link2.jalal.uk.in/support"
			},
			{
				"type": "internal",
				"name": "Contribute",
				"url": "/contribute"
			},
			{
				"type": "internal",
				"name": "About",
				"url": "/about"
			}
		]
	},
	"footer": {
		"maintainer": {
			"name": "Lakshyajeet Jalal",
			"designation": "B.Tech CSE 2026",
			"support": "https://link2.jalal.uk.in/support"
		},
		"links": [
			{
				"type": "external",
				"name": "Support my work",
				"url": "https://link2.jalal.uk.in/support"
			},
			{
				"type": "external",
				"name": "Join Discord",
				"url": "https://discord.gg/xgp4F9MXeG"
			},
			{
				"type": "internal",
				"name": "Contribute",
				"url": "/contribute"
			},
			{
				"type": "internal",
				"name": "About",
				"url": "/about"
			}
		]
	}
};

export default siteConfig;


const response = await fetch(
	"https://raw.githubusercontent.com/mglsj/socials/refs/heads/main/socials.json",
).then((res) => res.json()).catch((err) => {
	console.error("Failed to fetch socials data:", err);
	return { primary: [] };
});

export const SOCIALS: Social[] = response.primary as Social[];
