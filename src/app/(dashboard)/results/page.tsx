"use client";

import {
	BarChart3,
	ChevronLeft,
	ChevronRight,
	Loader2,
	PieChart as PieChartIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { api } from "@/trpc/react";

const getMonthStartEnd = (date: Date) => {
	const start = new Date(date.getFullYear(), date.getMonth(), 1);
	const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
	return { start, end };
};

const formatDate = (date: Date) => {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
};

export default function ResultsPage() {
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [hourlyRate, setHourlyRate] = useState<number | "">("");

	useEffect(() => {
		const saved = localStorage.getItem("hourlyRate");
		if (saved) {
			const parsed = Number.parseFloat(saved);
			if (!Number.isNaN(parsed)) {
				setHourlyRate(parsed);
			}
		}
	}, []);

	const handleHourlyRateChange = (val: string) => {
		if (val === "") {
			setHourlyRate("");
			localStorage.removeItem("hourlyRate");
			return;
		}
		const parsed = Number.parseFloat(val);
		if (!Number.isNaN(parsed)) {
			setHourlyRate(parsed);
			localStorage.setItem("hourlyRate", parsed.toString());
		}
	};

	const { start, end } = useMemo(
		() => getMonthStartEnd(currentMonth),
		[currentMonth],
	);

	const { data: logs, isLoading } = api.timeLog.getLogsByDateRange.useQuery({
		startDate: formatDate(start),
		endDate: formatDate(end),
	});

	const { data: projects } = api.project.getAll.useQuery();

	const handlePrevMonth = () => {
		setCurrentMonth(
			new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
		);
	};

	const handleNextMonth = () => {
		setCurrentMonth(
			new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
		);
	};

	// Calculate stats
	const stats = useMemo(() => {
		if (!logs || !projects) return { totalHours: 0, byProject: [], byDay: [] };

		// Total hours (each log is 0.5 hours)
		const totalHours = logs.length * 0.5;

		// By Project
		const projectHours: Record<string, number> = {};
		logs.forEach((log) => {
			projectHours[log.projectId] = (projectHours[log.projectId] || 0) + 0.5;
		});

		const byProject = Object.entries(projectHours)
			.map(([projectId, hours]) => {
				const project = projects.find((p) => p.id === projectId);
				return {
					name: project?.name || "Neznámý",
					value: hours,
					color: project?.color || "var(--primary)",
				};
			})
			.sort((a, b) => b.value - a.value);

		// By Day
		const daysInMonth = end.getDate();
		const dailyHours: Record<string, Record<string, number>> = {};
		for (let i = 1; i <= daysInMonth; i++) {
			const d = new Date(start.getFullYear(), start.getMonth(), i);
			const dateStr = formatDate(d);
			const initialTimes: Record<string, number> = {};
			for (const p of projects) {
				initialTimes[p.id] = 0;
			}
			initialTimes["Neznámý"] = 0;
			dailyHours[dateStr] = initialTimes;
		}

		logs.forEach((log) => {
			const dayData = dailyHours[log.date];
			if (dayData !== undefined) {
				const project = projects.find((p) => p.id === log.projectId);
				const key = project ? project.id : "Neznámý";
				dayData[key] = (dayData[key] || 0) + 0.5;
			}
		});

		const byDay = Object.entries(dailyHours).map(([date, projectTimes]) => {
			const day = Number.parseInt(date.split("-")[2]!, 10);
			return {
				name: day.toString(),
				...projectTimes,
			};
		});

		return { totalHours, byProject, byDay };
	}, [logs, projects, start, end]);

	return (
		<ScrollArea className="h-full w-full">
			<div className="mx-auto w-full max-w-6xl p-4 md:p-8">
				<div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-center md:justify-between">
					<h1 className="font-bold text-2xl md:text-3xl">Výsledky</h1>
					<div className="flex flex-col items-stretch gap-2 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:gap-4">
						<div className="flex items-center justify-center gap-2">
							<button
								aria-label="Předchozí měsíc"
								className="touch-manipulation rounded-lg p-2 transition-colors hover:bg-secondary"
								onClick={handlePrevMonth}
								type="button"
							>
								<ChevronLeft size={20} />
							</button>
							<span className="min-w-0 flex-1 text-center font-semibold text-sm sm:w-32 sm:flex-none">
								{currentMonth.toLocaleDateString("cs-CZ", {
									month: "long",
									year: "numeric",
								})}
							</span>
							<button
								aria-label="Další měsíc"
								className="touch-manipulation rounded-lg p-2 transition-colors hover:bg-secondary"
								onClick={handleNextMonth}
								type="button"
							>
								<ChevronRight size={20} />
							</button>
						</div>
						<input
							className="touch-manipulation w-full rounded-lg border border-border bg-background px-3 py-2 text-center text-sm focus:border-primary focus:outline-none sm:w-auto"
							onChange={(e) => {
								if (!e.target.value) return;
								const [year, month] = e.target.value.split("-").map(Number);
								if (year && month) {
									setCurrentMonth(new Date(year, month - 1, 1));
								}
							}}
							type="month"
							value={`${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`}
						/>
					</div>
				</div>

				{isLoading || !projects ? (
					<div className="flex justify-center p-12">
						<Loader2 className="animate-spin text-primary" size={48} />
					</div>
				) : (
					<div
						className="grid animate-calendar-change gap-6 md:grid-cols-3"
						key={currentMonth.toISOString()}
					>
						<div className="col-span-1 flex flex-col gap-6">
							{/* Summary Card */}
							<div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card/50 p-6">
								<span className="mb-2 font-medium text-lg text-muted-foreground">
									Celkový odpracovaný čas
								</span>
								<span className="font-extrabold text-6xl text-primary">
									{stats.totalHours.toFixed(1)}{" "}
									<span className="text-2xl text-primary">h</span>
								</span>
							</div>

							{/* Earnings Card */}
							<div className="flex flex-col rounded-xl border border-border bg-card/50 p-6">
								<h3 className="mb-4 font-semibold text-foreground text-lg">
									Finanční přehled
								</h3>
								<div className="flex flex-col gap-3">
									<div className="flex flex-col gap-1">
										<label
											className="font-medium text-muted-foreground text-xs"
											htmlFor="hourly-rate"
										>
											Hodinová sazba (Kč/h)
										</label>
										<input
											className="touch-manipulation w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base md:text-sm focus:border-primary focus:outline-none"
											id="hourly-rate"
											min="0"
											onChange={(e) => handleHourlyRateChange(e.target.value)}
											placeholder="Zadejte sazbu..."
											type="number"
											value={hourlyRate}
										/>
									</div>
									<div className="mt-2 flex flex-col">
										<span className="font-medium text-muted-foreground text-xs">
											Odhadovaný výdělek
										</span>
										<span className="mt-1 font-extrabold text-3xl text-primary">
											{(
												(typeof hourlyRate === "number" ? hourlyRate : 0) *
												stats.totalHours
											).toLocaleString("cs-CZ")}{" "}
											<span className="font-semibold text-lg">Kč</span>
										</span>
									</div>
								</div>
							</div>
						</div>

						{/* Project Breakdown */}
						<div className="col-span-2 rounded-xl border border-border bg-card/50 p-6">
							<div className="mb-4 flex items-center gap-2">
								<PieChartIcon className="text-primary" size={20} />
								<h3 className="font-semibold text-lg">Čas podle projektů</h3>
							</div>
							{stats.byProject.length > 0 ? (
								<div className="flex h-64 flex-col items-center gap-4 sm:flex-row">
									<div className="h-full w-full flex-1">
										<ResponsiveContainer height="100%" width="100%">
											<PieChart>
												<Pie
													cx="50%"
													cy="50%"
													data={stats.byProject}
													dataKey="value"
													innerRadius={60}
													outerRadius={80}
													paddingAngle={5}
												>
													{stats.byProject.map((entry) => (
														<Cell
															fill={entry.color}
															key={`cell-${entry.name}`}
															stroke="var(--background)"
														/>
													))}
												</Pie>
												<Tooltip
													contentStyle={{
														backgroundColor: "var(--card)",
														borderColor: "var(--border)",
														borderRadius: "8px",
													}}
													formatter={(value: any) => [`${value} h`, "Čas"]}
												/>
											</PieChart>
										</ResponsiveContainer>
									</div>
									<div className="flex w-full flex-col gap-3 sm:pr-8">
										{stats.byProject.map((project) => (
											<div
												className="flex items-center gap-2"
												key={project.name}
											>
												<div
													className="h-3 w-3 rounded-full"
													style={{ backgroundColor: project.color }}
												/>
												<span className="font-medium text-sm">
													{project.name}
												</span>
												<span className="ml-auto pl-4 text-muted-foreground text-sm">
													{project.value}h
												</span>
											</div>
										))}
									</div>
								</div>
							) : (
								<div className="flex h-64 items-center justify-center text-muted-foreground">
									Žádná data pro tento měsíc.
								</div>
							)}
						</div>

						{/* Daily Breakdown */}
						<div className="col-span-3 rounded-xl border border-border bg-card/50 p-6">
							<div className="mb-6 flex items-center gap-2">
								<BarChart3 className="text-primary" size={20} />
								<h3 className="font-semibold text-lg">Denní aktivita</h3>
							</div>
							<div className="h-72 w-full">
								<ResponsiveContainer height="100%" width="100%">
									<BarChart
										barSize={20}
										data={stats.byDay}
										margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
									>
										<CartesianGrid
											stroke="var(--border)"
											strokeDasharray="3 3"
											vertical={false}
										/>
										<XAxis
											axisLine={false}
											dataKey="name"
											stroke="var(--muted-foreground)"
											tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
											tickLine={false}
										/>
										<YAxis
											axisLine={false}
											stroke="var(--muted-foreground)"
											tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
											tickLine={false}
										/>
										<Tooltip
											contentStyle={{
												backgroundColor: "var(--card)",
												borderColor: "var(--border)",
												borderRadius: "8px",
											}}
											cursor={{ fill: "rgba(255,255,255,0.05)" }}
											formatter={(value: any, name: any) => [
												`${value} h`,
												name,
											]}
											labelFormatter={(label) => `Den ${label}`}
										/>
										{(projects || []).map((project) => (
											<Bar
												barSize={20}
												dataKey={project.id}
												fill={project.color}
												key={project.id}
												name={project.name}
												stackId="a"
											/>
										))}
										<Bar
											barSize={20}
											dataKey="Neznámý"
											fill="var(--muted-foreground)"
											name="Neznámé"
											stackId="a"
										/>
									</BarChart>
								</ResponsiveContainer>
							</div>
						</div>
					</div>
				)}
			</div>
		</ScrollArea>
	);
}
