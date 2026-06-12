import { Clock } from "lucide-react";

import { redirect } from "next/navigation";
import { LoginButton } from "@/app/_components/login-button";
import { getSession } from "@/server/better-auth/server";

export default async function Home() {
	const session = await getSession();

	if (session) {
		redirect("/calendar");
	}

	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
			<div className="container flex flex-col items-center justify-center gap-8 px-4 py-16 text-center">
				<div className="flex items-center gap-4 text-primary">
					<Clock size={48} />
					<h1 className="font-extrabold text-5xl tracking-tight sm:text-[4rem]">
						Sledování času
					</h1>
				</div>
				<p className="max-w-md text-lg text-muted-foreground">
					Sledujte svou pracovní dobu snadno. Přiřazujte projekty k časovým
					úsekům a prohlížejte si výsledky v přehledném panelu.
				</p>

				<div className="mt-8 flex flex-col items-center justify-center gap-4">
					<LoginButton />
				</div>
			</div>
		</main>
	);
}
