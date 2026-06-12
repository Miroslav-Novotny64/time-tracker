"use client";

import {
	BarChart3,
	ChevronLeft,
	ChevronRight,
	Loader2,
	PieChart as PieChartIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
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
		const dailyHours: Record<string, number> = {};
		for (let i = 1; i <= daysInMonth; i++) {
			const d = new Date(start.getFullYear(), start.getMonth(), i);
			dailyHours[formatDate(d)] = 0;
		}

		logs.forEach((log) => {
			const current = dailyHours[log.date];
			if (current !== undefined) {
				dailyHours[log.date] = current + 0.5;
			}
		});

		const byDay = Object.entries(dailyHours).map(([date, hours]) => {
			const day = Number.parseInt(date.split("-")[2]!, 10);
			return { name: day.toString(), hours };
		});

		return { totalHours, byProject, byDay };
	}, [logs, projects, start, end]);

	return (
		<ScrollArea className="h-full w-full">
			<div className="mx-auto w-full max-w-6xl p-8">
				<div className="mb-8 flex items-center justify-between">
					<h1 className="font-bold text-3xl">Výsledky</h1>
					<div className="flex items-center gap-4 rounded-xl border border-border bg-card p-2">
						<button
							className="rounded p-1 transition-colors hover:bg-secondary"
							onClick={handlePrevMonth}
							type="button"
						>
							<ChevronLeft size={20} />
						</button>
						<span className="w-32 text-center font-semibold">
							{currentMonth.toLocaleDateString("cs-CZ", {
								month: "long",
								year: "numeric",
							})}
						</span>
						<button
							className="rounded p-1 transition-colors hover:bg-secondary"
							onClick={handleNextMonth}
							type="button"
						>
							<ChevronRight size={20} />
						</button>
					</div>
				</div>

				{isLoading ? (
					<div className="flex justify-center p-12">
						<Loader2 className="animate-spin text-primary" size={48} />
					</div>
				) : (
					<div
						className="grid animate-calendar-change gap-6 md:grid-cols-3"
						key={currentMonth.toISOString()}
					>
						{/* Summary Card */}
						<div className="col-span-1 flex flex-col items-center justify-center rounded-xl border border-border bg-card/50 p-6">
							<span className="mb-2 font-medium text-lg text-muted-foreground">
								Celkový odpracovaný čas
							</span>
							<span className="font-extrabold text-6xl text-primary">
								{stats.totalHours.toFixed(1)}{" "}
								<span className="text-2xl text-primary">h</span>
							</span>
						</div>

						{/* Project Breakdown */}
						<div className="col-span-2 rounded-xl border border-border bg-card/50 p-6">
							<div className="mb-4 flex items-center gap-2">
								<PieChartIcon className="text-primary" size={20} />
								<h3 className="font-semibold text-lg">Čas podle projektů</h3>
							</div>
							{stats.byProject.length > 0 ? (
								<div className="flex h-64 items-center">
									<div className="h-full flex-1">
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
									<div className="flex flex-col gap-3 pr-8">
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
											formatter={(value: any) => [`${value} h`, "Čas"]}
											labelFormatter={(label) => `Den ${label}`}
										/>
										<Bar
											dataKey="hours"
											fill="var(--primary)"
											radius={[4, 4, 0, 0]}
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
