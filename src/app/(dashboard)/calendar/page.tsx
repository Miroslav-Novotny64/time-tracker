"use client";

import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/trpc/react";

const getStartOfWeek = (date: Date) => {
	const d = new Date(date);
	const day = d.getDay() || 7;
	if (day !== 1) d.setHours(-24 * (day - 1));
	d.setHours(0, 0, 0, 0);
	return d;
};

const formatDate = (date: Date) => {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
};

const isSameDay = (a: Date, b: Date) => formatDate(a) === formatDate(b);

const getCurrentTimeSlot = (date: Date) => {
	const h = date.getHours();
	const m = date.getMinutes() >= 30 ? "30" : "00";
	return `${h.toString().padStart(2, "0")}:${m}`;
};

const timeSlots = Array.from({ length: 48 }, (_, i) => {
	const h = Math.floor(i / 2);
	const m = i % 2 === 0 ? "00" : "30";
	return `${h.toString().padStart(2, "0")}:${m}`;
});

function useClientNow() {
	const [now, setNow] = useState<Date | null>(null);

	useEffect(() => {
		const update = () => setNow(new Date());
		update();
		const interval = setInterval(update, 30_000);
		return () => clearInterval(interval);
	}, []);

	return now;
}

function useIsMobile() {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const mq = window.matchMedia("(max-width: 767px)");
		const update = () => setIsMobile(mq.matches);
		update();
		mq.addEventListener("change", update);
		return () => mq.removeEventListener("change", update);
	}, []);

	return isMobile;
}

export default function CalendarPage() {
	const utils = api.useUtils();
	const isMobile = useIsMobile();
	const now = useClientNow();
	const [currentDate, setCurrentDate] = useState(() => new Date());
	const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
	const currentTimeSlot = now ? getCurrentTimeSlot(now) : null;

	useEffect(() => {
		const saved = localStorage.getItem("activeProjectId");
		if (saved) {
			setActiveProjectId(saved);
		}
	}, []);

	useEffect(() => {
		if (!currentTimeSlot) return;
		setTimeout(() => {
			const el = document.getElementById(`hour-${currentTimeSlot}`);
			if (el) {
				el.scrollIntoView({ behavior: "auto", block: "center" });
			}
		}, 100);
	}, [currentTimeSlot]);

	const startOfWeek = getStartOfWeek(currentDate);

	const weekDays = useMemo(() => {
		return Array.from({ length: 7 }, (_, i) => {
			const d = new Date(startOfWeek);
			d.setDate(d.getDate() + i);
			return d;
		});
	}, [startOfWeek]);

	const displayDays = isMobile ? [currentDate] : weekDays;

	const startDateStr = formatDate(weekDays[0]!);
	const endDateStr = formatDate(weekDays[6]!);

	const { data: projects } = api.project.getAll.useQuery();

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
						}
						const newArray = [...old];
						const project = projects?.find((p) => p.id === newLog.projectId);
						newArray[existingIndex] = {
							...existingLog,
							projectId: newLog.projectId,
							project: project || existingLog.project,
						};
						return newArray;
					}
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
		d.setDate(d.getDate() - (isMobile ? 1 : 7));
		setCurrentDate(d);
	};

	const handleNextWeek = () => {
		const d = new Date(currentDate);
		d.setDate(d.getDate() + (isMobile ? 1 : 7));
		setCurrentDate(d);
	};

	const handleGoToToday = () => {
		setCurrentDate(new Date());
	};

	const handleDateChange = (value: string) => {
		if (!value) return;
		const [year, month, day] = value.split("-").map(Number);
		if (year && month && day) {
			setCurrentDate(new Date(year, month - 1, day));
		}
	};

	const handleCellClick = (dateStr: string, timeSlot: string) => {
		if (!activeProjectId) return;
		toggleLog.mutate({ date: dateStr, timeSlot, projectId: activeProjectId });
	};

	const getLogForCell = (dateStr: string, timeSlot: string) => {
		return logs?.find((l) => l.date === dateStr && l.timeSlot === timeSlot);
	};

	return (
		<div className="flex h-full flex-col gap-3 p-3 md:gap-4 md:p-4">
			<div className="flex shrink-0 flex-col gap-3 md:flex-row md:gap-4">
				<div className="flex w-full flex-col gap-2 rounded-xl border border-border bg-card p-3 md:w-1/3 md:p-4">
					<span className="font-medium text-muted-foreground text-sm">
						Výběr projektu
					</span>
					{projects && projects.length > 0 ? (
						<select
							className="touch-manipulation w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base md:text-sm focus:border-primary focus:outline-none"
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
					{activeProject && (
						<div className="flex items-center gap-2 md:hidden">
							<div
								className="h-3 w-3 shrink-0 rounded-full"
								style={{ backgroundColor: activeProject.color }}
							/>
							<span className="truncate font-medium text-sm">
								{activeProject.name}
							</span>
						</div>
					)}
				</div>

				<div className="hidden flex-1 flex-col gap-2 rounded-xl border border-border bg-card p-4 md:flex">
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

			<div className="flex shrink-0 flex-col gap-2 rounded-xl border border-border bg-card p-3 md:p-3">
				<div className="flex items-center justify-between gap-2">
					<button
						aria-label={isMobile ? "Předchozí den" : "Předchozí týden"}
						className="touch-manipulation rounded-lg p-2 transition-colors hover:bg-secondary"
						onClick={handlePrevWeek}
						type="button"
					>
						<ChevronLeft size={20} />
					</button>

					<div className="flex min-w-0 flex-1 flex-col items-center gap-1">
						{isMobile ? (
							<h2 className="text-center font-semibold text-base">
								{currentDate.toLocaleDateString("cs-CZ", {
									weekday: "long",
									day: "numeric",
									month: "long",
								})}
							</h2>
						) : (
							<h2 className="text-center font-semibold text-lg">
								{weekDays[0]?.toLocaleDateString("cs-CZ")} –{" "}
								{weekDays[6]?.toLocaleDateString("cs-CZ")}
							</h2>
						)}
						<input
							className="touch-manipulation w-full max-w-[11rem] rounded-lg border border-border bg-background px-3 py-1.5 text-center text-sm focus:border-primary focus:outline-none"
							onChange={(e) => handleDateChange(e.target.value)}
							type="date"
							value={formatDate(currentDate)}
						/>
					</div>

					<button
						aria-label={isMobile ? "Další den" : "Další týden"}
						className="touch-manipulation rounded-lg p-2 transition-colors hover:bg-secondary"
						onClick={handleNextWeek}
						type="button"
					>
						<ChevronRight size={20} />
					</button>
				</div>

				{now && !isSameDay(currentDate, now) && (
					<button
						className="touch-manipulation self-center rounded-lg bg-primary/10 px-4 py-1.5 font-medium text-primary text-sm transition-colors hover:bg-primary/20"
						onClick={handleGoToToday}
						type="button"
					>
						Dnes
					</button>
				)}
			</div>

			<div className="flex-1 overflow-auto rounded-xl border border-border bg-card/30">
				<div
					className={`animate-calendar-change uppercase ${isMobile ? "w-full" : "min-w-[800px]"}`}
					key={`${startDateStr}-${isMobile ? formatDate(currentDate) : "week"}`}
					style={{ fontFamily: "Arial, sans-serif" }}
				>
					<div className="sticky top-0 z-10 flex border-border border-b bg-card">
						<div className="flex w-20 shrink-0 items-center justify-center border-border border-r p-2 text-center font-medium text-muted-foreground text-xs md:w-28 md:p-3">
							Čas
						</div>
						{displayDays.map((day) => {
							const isToday = now !== null && isSameDay(day, now);
							return (
								<div
									className={`min-w-0 flex-1 border-border border-r p-2 text-center last:border-0 md:p-3 ${
										isToday ? "bg-primary/10" : ""
									}`}
									key={day.toISOString()}
								>
									<div
										className={`font-semibold text-sm ${isToday ? "text-primary" : ""}`}
									>
										{day.toLocaleDateString("cs-CZ", { weekday: "short" })}
									</div>
									<div
										className={`text-xs ${isToday ? "text-primary/80" : "text-muted-foreground"}`}
									>
										{day.getDate()}.{day.getMonth() + 1}.
									</div>
								</div>
							);
						})}
					</div>

					{timeSlots.map((time) => {
						const [hourStr, minStr] = time.split(":");
						const h = Number.parseInt(hourStr!);
						const nextH = minStr === "30" ? (h + 1) % 24 : h;
						const nextM = minStr === "30" ? "00" : "30";
						const nextTime = `${nextH.toString().padStart(2, "0")}:${nextM}`;
						const isCurrentSlot =
							currentTimeSlot !== null && time === currentTimeSlot;

						return (
							<div
								className={`flex border-border/50 border-b transition-colors last:border-0 hover:bg-secondary/50 ${
									isCurrentSlot ? "bg-primary/[0.07]" : ""
								}`}
								id={`hour-${time}`}
								key={time}
							>
								<div
									className={`flex w-20 shrink-0 items-center justify-center whitespace-nowrap border-border border-r p-2 text-center text-[10px] tracking-tight md:w-28 md:text-[11px] ${
										isCurrentSlot
											? "bg-primary/10 font-semibold text-primary"
											: "text-muted-foreground"
									}`}
								>
									{time} - {nextTime}
								</div>
								{displayDays.map((day) => {
									const dateStr = formatDate(day);
									const log = getLogForCell(dateStr, time);
									const isToday = now !== null && isSameDay(day, now);

									return (
										<div
											className={`flex min-w-0 flex-1 cursor-pointer items-center justify-center border-border/50 border-r p-1 transition-colors last:border-0 touch-manipulation ${
												isToday ? "bg-primary/[0.03]" : ""
											}`}
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
												className={`flex h-11 w-full items-center justify-center gap-1 overflow-hidden rounded border transition-all md:h-10 ${
													log
														? "border-transparent shadow-sm"
														: "border-border hover:border-border/60"
												} ${isCurrentSlot && isToday ? "ring-1 ring-primary/30" : ""}`}
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
														<span className="truncate px-1 font-semibold text-[10px] text-foreground leading-tight drop-shadow-md">
															{log.project.name}
														</span>
													</>
												)}
											</div>
										</div>
									);
								})}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
