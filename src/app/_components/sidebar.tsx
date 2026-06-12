"use client";

import {
	Calendar,
	Clock,
	FolderKanban,
	LayoutDashboard,
	LogOut,
	Moon,
	Sun,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { authClient } from "@/server/better-auth/client";

export function Sidebar({ user }: { user: any }) {
	const pathname = usePathname() || "";
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const links = [
		{ href: "/calendar", label: "Kalendář", icon: Calendar },
		{ href: "/projects", label: "Projekty", icon: FolderKanban },
		{ href: "/results", label: "Výsledky", icon: LayoutDashboard },
	];

	return (
		<aside className="flex w-64 shrink-0 flex-col border-border border-r bg-card p-4">
			<div className="mb-8 flex items-center gap-2 px-4 py-2">
				<Clock className="text-primary" size={24} />
				<h2 className="font-bold text-foreground text-xl tracking-tight">
					Sledování času
				</h2>
			</div>

			<nav className="flex flex-1 flex-col gap-2">
				{links.map((link) => {
					const Icon = link.icon;
					const isActive = pathname.startsWith(link.href);
					return (
						<Link
							className={`flex items-center gap-3 rounded-lg px-4 py-3 font-medium text-sm transition-colors ${
								isActive
									? "bg-primary/10 text-primary"
									: "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
							}`}
							href={link.href}
							key={link.href}
						>
							<Icon size={20} />
							{link.label}
						</Link>
					);
				})}
			</nav>

			<div className="mt-auto border-border border-t pt-4">
				{/* User Profile Info Row */}
				<div className="flex items-center gap-3 px-2">
					{user?.image ? (
						<img
							alt={user.name}
							className="h-10 w-10 rounded-full"
							src={user.image}
						/>
					) : (
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-base text-foreground">
							{user?.name?.charAt(0).toUpperCase() || "U"}
						</div>
					)}
					<div className="flex flex-1 flex-col overflow-hidden">
						<span className="truncate font-semibold text-foreground text-sm">
							{user?.name}
						</span>
					</div>
				</div>

				{/* Control Buttons Row */}
				<div className="mt-4 flex items-center justify-between border-border/50 border-t px-2 pt-3">
					{mounted && (
						<button
							className="flex items-center gap-2 rounded-lg px-3 py-3 font-medium text-muted-foreground text-xs transition-colors hover:bg-secondary hover:text-foreground"
							onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
							type="button"
						>
							{theme === "dark" ? (
								<>
									<Sun size={18} />
								</>
							) : (
								<>
									<Moon size={18} />
								</>
							)}
						</button>
					)}
					<button
						className="ml-auto flex items-center gap-2 rounded-lg px-3 py-1.5 font-medium text-muted-foreground text-xs transition-colors hover:bg-destructive/10 hover:text-destructive"
						onClick={async () => {
							await authClient.signOut({
								fetchOptions: {
									onSuccess: () => {
										window.location.href = "/";
									},
								},
							});
						}}
						type="button"
					>
						<LogOut size={14} />
						<span>Odhlásit</span>
					</button>
				</div>
			</div>
		</aside>
	);
}
