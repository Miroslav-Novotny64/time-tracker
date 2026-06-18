import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "Sledování času",
		short_name: "Sledování času",
		description:
			"Jednoduchá aplikace pro sledování a správu času stráveného na projektech",
		start_url: "/",
		display: "standalone",
		background_color: "#0f0f0f",
		theme_color: "#0f0f0f",
		icons: [
			{
				src: "/favicon.ico",
				sizes: "any",
				type: "image/x-icon",
			},
			{
				src: "/web-app-manifest-192x192.png",
				sizes: "192x192",
				type: "image/png",
				purpose: "maskable",
			},
			{
				src: "/web-app-manifest-512x512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable",
			},
			{
				src: "/apple-icon.png",
				sizes: "180x180",
				type: "image/png",
			},
		],
	};
}
