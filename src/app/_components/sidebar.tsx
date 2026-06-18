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
		<aside className="order-last md:order-0 flex md:w-64 shrink-0 flex-row md:flex-col border-border border-t md:border-t-0 md:border-r bg-card p-2 md:p-4 z-10 w-full md:h-full items-center justify-between md:items-stretch overflow-x-auto pb-safe">
			{/* Logo area - hidden on mobile */}
			<div className="mb-8 hidden md:flex items-center gap-2 px-4 py-2">
				<Clock className="text-primary" size={24} />
				<h2 className="font-bold text-foreground text-xl tracking-tight">
					Sledování času
				</h2>
			</div>

			{/* Navigation wrapper */}
			<div className="flex flex-1 flex-row md:flex-col w-full justify-around md:justify-start gap-1 md:gap-2 items-center md:items-stretch">
				{/* Links */}
				<nav className="flex flex-row md:flex-col flex-1 md:flex-none justify-around md:justify-start gap-1 md:gap-2 w-full">
					{links.map((link) => {
						const Icon = link.icon;
						const isActive = pathname.startsWith(link.href);
						return (
							<Link
								className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 rounded-lg p-2 md:px-4 md:py-3 font-medium text-[10px] md:text-sm transition-colors flex-1 md:flex-none ${
									isActive
										? "bg-primary/10 text-primary"
										: "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
								}`}
								href={link.href}
								key={link.href}
							>
								<Icon size={20} className="md:w-5 md:h-5" />
								<span className="truncate">{link.label}</span>
							</Link>
						);
					})}
				</nav>

				{/* Mobile Controls (Theme + Logout) inline with bottom nav */}
				<div className="flex md:hidden flex-row justify-around gap-1 flex-1 h-full items-stretch">
					<button
						className="flex flex-col items-center justify-center gap-1 rounded-lg p-2 font-medium text-[10px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground flex-1"
						onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
						type="button"
					>
						{mounted && theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
						<span className="truncate">Motiv</span>
					</button>
					<button
						className="flex flex-col items-center justify-center gap-1 rounded-lg p-2 font-medium text-[10px] text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive flex-1"
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
						<LogOut size={20} />
						<span className="truncate">Odhlásit</span>
					</button>
				</div>
			</div>

			{/* PC Footer - User Profile & Controls */}
			<div className="mt-auto border-border border-t pt-4 hidden md:block">
				{/* User Profile Info Row */}
				<div className="flex items-center gap-3 px-2">
					{user?.image ? (
						<img
							alt={user.name}
							className="h-10 w-10 rounded-full object-cover"
							src={user.image}
						/>
					) : (
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-base text-foreground">
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
							{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
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
