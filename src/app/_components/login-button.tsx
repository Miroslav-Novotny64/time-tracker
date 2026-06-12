"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/server/better-auth/client";

export function LoginButton() {
	const [isLoading, setIsLoading] = useState(false);

	return (
		<button
			className="flex items-center justify-center gap-2 rounded-full bg-primary px-10 py-3 font-semibold text-foreground no-underline transition hover:bg-primary focus:outline-none focus:ring-4 focus:ring-ring disabled:opacity-50"
			disabled={isLoading}
			onClick={async () => {
				setIsLoading(true);
				await authClient.signIn.social({
					provider: "github",
					callbackURL: "/calendar",
				});
			}}
			type="button"
		>
			{isLoading && <Loader2 className="animate-spin" size={20} />}
			Přihlásit se přes GitHub
		</button>
	);
}
