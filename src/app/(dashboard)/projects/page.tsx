"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { api } from "@/trpc/react";

export default function ProjectsPage() {
	const utils = api.useUtils();
	const { data: projects, isLoading } = api.project.getAll.useQuery();

	const createProject = api.project.create.useMutation({
		onSuccess: () => {
			setName("");
			setDescription("");
			setColor("#3b82f6");
			void utils.project.getAll.invalidate();
		},
	});

	const deleteProject = api.project.delete.useMutation({
		onSuccess: () => {
			void utils.project.getAll.invalidate();
		},
	});

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [color, setColor] = useState("#3b82f6");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name) return;
		createProject.mutate({ name, description, color });
	};

	return (
		<ScrollArea className="h-full w-full">
			<div className="mx-auto w-full max-w-4xl p-8">
				<h1 className="mb-8 font-bold text-3xl">Projekty</h1>

				<div className="mb-8 rounded-xl border border-border bg-card p-6">
					<h2 className="mb-4 font-semibold text-xl">Vytvořit nový projekt</h2>
					<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
						<div className="flex gap-4">
							<div className="flex-1">
								<label
									className="mb-1 block font-medium text-muted-foreground text-sm"
									htmlFor="projectName"
								>
									Název
								</label>
								<input
									className="w-full rounded-lg border border-border bg-background px-4 py-2 focus:border-primary focus:outline-none"
									id="projectName"
									onChange={(e) => setName(e.target.value)}
									placeholder="např. Redesign webu"
									required
									type="text"
									value={name}
								/>
							</div>
							<div>
								<label
									className="mb-1 block font-medium text-muted-foreground text-sm"
									htmlFor="projectColor"
								>
									Barva
								</label>
								<div className="flex h-[42px] items-center gap-2">
									<input
										className="h-10 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
										id="projectColor"
										onChange={(e) => setColor(e.target.value)}
										type="color"
										value={color}
									/>
								</div>
							</div>
						</div>
						<div>
							<label
								className="mb-1 block font-medium text-muted-foreground text-sm"
								htmlFor="projectDescription"
							>
								Popis (volitelné)
							</label>
							<textarea
								className="w-full rounded-lg border border-border bg-background px-4 py-2 focus:border-primary focus:outline-none"
								id="projectDescription"
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Název klienta, poznámky, atd."
								rows={2}
								value={description}
							/>
						</div>
						<button
							className="flex items-center gap-2 self-end rounded-lg bg-primary px-6 py-2 font-medium text-foreground transition-colors hover:bg-primary disabled:opacity-50"
							disabled={createProject.isPending}
							type="submit"
						>
							{createProject.isPending ? (
								<Loader2 className="animate-spin" size={18} />
							) : (
								<Plus size={18} />
							)}
							Vytvořit projekt
						</button>
					</form>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{isLoading ? (
						<div className="col-span-2 flex justify-center p-8">
							<Loader2 className="animate-spin text-primary" size={32} />
						</div>
					) : projects?.length === 0 ? (
						<div className="col-span-2 rounded-xl border border-border border-dashed p-8 text-center text-muted-foreground">
							Nebyly nalezeny žádné projekty. Vytvořte nový výše.
						</div>
					) : (
						projects?.map((project) => (
							<div
								className="flex items-start gap-4 rounded-xl border border-border bg-card/50 p-5 transition-colors hover:border-border"
								key={project.id}
							>
								<div
									className="h-full min-h-12 w-4 flex-shrink-0 rounded-full"
									style={{ backgroundColor: project.color }}
								/>
								<div className="flex-1">
									<h3 className="font-semibold text-lg">{project.name}</h3>
									{project.description && (
										<p className="mt-1 text-muted-foreground text-sm">
											{project.description}
										</p>
									)}
								</div>
								<button
									className="p-2 text-muted-foreground hover:text-destructive"
									disabled={deleteProject.isPending}
									onClick={() => deleteProject.mutate({ id: project.id })}
									type="button"
								>
									<Trash2 size={18} />
								</button>
							</div>
						))
					)}
				</div>
			</div>
		</ScrollArea>
	);
}
