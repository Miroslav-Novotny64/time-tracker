import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
	const domain = "https://novotnymiroslav.cz";
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: "/api/",
		},
		sitemap: `${domain}/sitemap.xml`,
	};
}
