import { redirect } from "next/navigation";
import { Sidebar } from "@/app/_components/sidebar";
import { getSession } from "@/server/better-auth/server";

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await getSession();

	if (!session) {
		redirect("/");
	}

	return (
		<div className="flex h-dvh flex-col md:flex-row overflow-hidden bg-background text-foreground">
			<Sidebar user={session.user} />
			<main className="flex flex-1 flex-col overflow-hidden bg-background md:order-0 mb-0">
				{children}
			</main>
		</div>
	);
}
