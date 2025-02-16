import type { Social } from "./utils/types";

export const SITE_TITLE = "PYQ Archive";
export const SITE_DESCRIPTION =
	"A collection of student contributed previous year question papers for Graphic Era Hill University semester examinations.";

export const MAINTAINER_NAME = "Lakshyajeet Jalal";
export const MAINTAINER_COURSE = "B.Tech CSE";

const respone = await fetch(
	"https://raw.githubusercontent.com/mglsj/socials/refs/heads/main/socials.json",
).then((res) => res.json());

export const SOCIALS: Social[] = respone.primary as Social[];
