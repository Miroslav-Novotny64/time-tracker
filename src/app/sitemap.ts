import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
	const domain = "https://novotnymiroslav.cz";
	const routes = ["", "/calendar", "/projects", "/results"];

	return routes.map((route) => ({
		url: `${domain}${route}`,
		lastModified: new Date(),
		changeFrequency: route === "" ? "daily" : "weekly",
		priority: route === "" ? 1.0 : 0.8,
	}));
}
