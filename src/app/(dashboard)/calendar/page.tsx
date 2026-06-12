"use client";

import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { api } from "@/trpc/react";

const getStartOfWeek = (date: Date) => {
	const d = new Date(date);
	const day = d.getDay() || 7; // Get current day number, converting Sun. to 7
	if (day !== 1) d.setHours(-24 * (day - 1)); // Set to previous Monday
	d.setHours(0, 0, 0, 0);
	return d;
};

const formatDate = (date: Date) => {
	// Format as YYYY-MM-DD
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
};

const timeSlots = Array.from({ length: 24 }, (_, i) => {
	const h = i;
	return `${h.toString().padStart(2, "0")}:00`;
});

export default function CalendarPage() {
	const utils = api.useUtils();
	const [currentDate, setCurrentDate] = useState(new Date());
	const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

	// Load from localStorage on mount
	useEffect(() => {
		const saved = localStorage.getItem("activeProjectId");
		if (saved) {
			setActiveProjectId(saved);
		}
	}, []);

	useEffect(() => {
		// Use setTimeout to ensure the DOM is fully rendered before scrolling
		setTimeout(() => {
			const el = document.getElementById("hour-08:00");
			if (el) {
				el.scrollIntoView({ behavior: "auto", block: "start" });
			}
		}, 100);
	}, []);

	const startOfWeek = getStartOfWeek(currentDate);

	const weekDays = useMemo(() => {
		return Array.from({ length: 7 }, (_, i) => {
			const d = new Date(startOfWeek);
			d.setDate(d.getDate() + i);
			return d;
		});
	}, [startOfWeek]);

	const startDateStr = formatDate(weekDays[0]!);
	const endDateStr = formatDate(weekDays[6]!);

	const { data: projects } = api.project.getAll.useQuery();

	// Automatically select the first project if none is selected or if selected project is invalid
	useEffect(() => {
		if (projects && projects.length > 0) {
			const hasValidSelected = projects.some((p) => p.id === activeProjectId);
			if (!hasValidSelected) {
				const saved = localStorage.getItem("activeProjectId");
				const savedExists = projects.find((p) => p.id === saved);
				if (savedExists) {
					setActiveProjectId(savedExists.id);
				} else {
					setActiveProjectId(projects[0]!.id);
					localStorage.setItem("activeProjectId", projects[0]!.id);
				}
			}
		}
	}, [projects, activeProjectId]);

	const activeProject = projects?.find((p) => p.id === activeProjectId);

	const { data: logs } = api.timeLog.getLogsByDateRange.useQuery({
		startDate: startDateStr,
		endDate: endDateStr,
	});

	const toggleLog = api.timeLog.toggleLog.useMutation({
		onMutate: async (newLog) => {
			await utils.timeLog.getLogsByDateRange.cancel();
			const previousLogs = utils.timeLog.getLogsByDateRange.getData({
				startDate: startDateStr,
				endDate: endDateStr,
			});

			utils.timeLog.getLogsByDateRange.setData(
				{ startDate: startDateStr, endDate: endDateStr },
				(old) => {
					if (!old) return [];
					const existingIndex = old.findIndex(
						(l) => l.date === newLog.date && l.timeSlot === newLog.timeSlot,
					);
					if (existingIndex >= 0) {
						const existingLog = old[existingIndex]!;
						if (existingLog.projectId === newLog.projectId) {
							return old.filter((_, i) => i !== existingIndex);
						} else {
							const newArray = [...old];
							const project = projects?.find((p) => p.id === newLog.projectId);
							newArray[existingIndex] = {
								...existingLog,
								projectId: newLog.projectId,
								project: project || existingLog.project,
							};
							return newArray;
						}
					} else {
						const project = projects?.find((p) => p.id === newLog.projectId);
						return [
							...old,
							{
								id: "temp-id",
								userId: "temp-user",
								date: newLog.date,
								timeSlot: newLog.timeSlot,
								projectId: newLog.projectId,
								createdAt: new Date(),
								updatedAt: new Date(),
								project: project || {
									id: newLog.projectId,
									name: "Neznámý",
									description: null,
									color: "#fff",
									userId: "temp-user",
									createdAt: new Date(),
									updatedAt: new Date(),
								},
							},
						];
					}
				},
			);
			return { previousLogs };
		},
		onError: (_err, _newLog, context) => {
			if (context?.previousLogs) {
				utils.timeLog.getLogsByDateRange.setData(
					{ startDate: startDateStr, endDate: endDateStr },
					context.previousLogs,
				);
			}
		},
		onSettled: () => {
			void utils.timeLog.getLogsByDateRange.invalidate();
		},
	});

	const handlePrevWeek = () => {
		const d = new Date(currentDate);
		d.setDate(d.getDate() - 7);
		setCurrentDate(d);
	};

	const handleNextWeek = () => {
		const d = new Date(currentDate);
		d.setDate(d.getDate() + 7);
		setCurrentDate(d);
	};

	const handleCellClick = (dateStr: string, timeSlot: string) => {
		if (!activeProjectId) return;
		toggleLog.mutate({ date: dateStr, timeSlot, projectId: activeProjectId });
	};

	const getLogForCell = (dateStr: string, timeSlot: string) => {
		return logs?.find((l) => l.date === dateStr && l.timeSlot === timeSlot);
	};

	return (
		<div className="flex h-full flex-col gap-4 p-4">
			{/* Top Bar - Select & Info */}
			<div className="flex shrink-0 gap-4">
				{/* Select Project */}
				<div className="flex w-1/3 flex-col gap-2 rounded-xl border border-border bg-card p-4">
					<span className="font-medium text-muted-foreground text-sm">
						Výběr projektu
					</span>
					{projects && projects.length > 0 ? (
						<select
							className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
							onChange={(e) => {
								const newId = e.target.value;
								setActiveProjectId(newId);
								localStorage.setItem("activeProjectId", newId);
							}}
							value={activeProjectId || ""}
						>
							{projects.map((p) => (
								<option key={p.id} value={p.id}>
									{p.name}
								</option>
							))}
						</select>
					) : (
						<span className="text-destructive text-sm">
							Nejprve prosím vytvořte projekt
						</span>
					)}
				</div>

				{/* Project Info */}
				<div className="flex flex-1 flex-col gap-2 rounded-xl border border-border bg-card p-4">
					<span className="font-medium text-muted-foreground text-sm">
						Informace o vybraném projektu
					</span>
					{activeProject ? (
						<div className="flex items-start gap-3">
							<div
								className="mt-1 h-4 w-4 shrink-0 rounded-full"
								style={{ backgroundColor: activeProject.color }}
							/>
							<div>
								<h3 className="font-semibold text-foreground">
									{activeProject.name}
								</h3>
								{activeProject.description && (
									<p className="mt-1 text-muted-foreground text-sm">
										{activeProject.description}
									</p>
								)}
							</div>
						</div>
					) : (
						<span className="text-muted-foreground text-sm italic">
							Žádný projekt není vybrán
						</span>
					)}
				</div>
			</div>

			{/* Header - Week Navigator */}
			<div className="flex shrink-0 items-center justify-center rounded-xl border border-border bg-card p-3">
				<div className="flex items-center gap-4">
					<button
						className="rounded p-1 transition-colors hover:bg-secondary"
						onClick={handlePrevWeek}
						type="button"
					>
						<ChevronLeft />
					</button>
					<h2 className="w-56 text-center font-semibold text-lg">
						{weekDays[0]?.toLocaleDateString("cs-CZ")} -{" "}
						{weekDays[6]?.toLocaleDateString("cs-CZ")}
					</h2>
					<button
						className="rounded p-1 transition-colors hover:bg-secondary"
						onClick={handleNextWeek}
						type="button"
					>
						<ChevronRight />
					</button>
				</div>
			</div>

			{/* Calendar Grid */}
			<ScrollArea className="flex-1 rounded-xl border border-border bg-card/30">
				<div
					className="min-w-[800px] animate-calendar-change"
					key={startDateStr}
				>
					{/* Header Row */}
					<div className="sticky top-0 z-10 flex border-border border-b bg-card">
						<div className="w-20 border-border border-r p-3 text-center font-medium text-muted-foreground text-xs">
							Čas
						</div>
						{weekDays.map((day) => (
							<div
								className="flex-1 border-border border-r p-3 text-center last:border-0"
								key={day.toISOString()}
							>
								<div className="font-semibold text-sm">
									{day.toLocaleDateString("cs-CZ", { weekday: "short" })}
								</div>
								<div className="text-muted-foreground text-xs">
									{day.getDate()}.{day.getMonth() + 1}.
								</div>
							</div>
						))}
					</div>

					{/* Time Rows */}
					{timeSlots.map((time) => (
						<div
							className="flex border-border/50 border-b transition-colors last:border-0 hover:bg-secondary/50"
							id={`hour-${time}`}
							key={time}
						>
							<div className="flex w-20 items-center justify-center border-border border-r p-2 text-center text-muted-foreground text-xs">
								{time}
							</div>
							{weekDays.map((day) => {
								const dateStr = formatDate(day);
								const log = getLogForCell(dateStr, time);

								return (
									<div
										className="flex flex-1 cursor-pointer items-center justify-center border-border/50 border-r p-1 transition-colors last:border-0"
										key={dateStr}
										onClick={() => handleCellClick(dateStr, time)}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												handleCellClick(dateStr, time);
											}
										}}
										role="button"
										tabIndex={0}
									>
										<div
											className={`flex h-10 w-full items-center justify-center gap-1 overflow-hidden rounded border transition-all ${
												log
													? "border-transparent shadow-sm"
													: "border-border hover:border-border/60"
											}`}
											style={{
												backgroundColor: log
													? log.project.color
													: "transparent",
											}}
										>
											{log && (
												<>
													<Check
														className="shrink-0 text-foreground/80 drop-shadow-sm"
														size={14}
													/>
													<span className="truncate px-1 font-semibold text-foreground text-xs leading-tight drop-shadow-md">
														{log.project.name}
													</span>
												</>
											)}
										</div>
									</div>
								);
							})}
						</div>
					))}
				</div>
			</ScrollArea>
		</div>
	);
}
