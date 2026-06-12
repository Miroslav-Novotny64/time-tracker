import { eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { project } from "@/server/db/schema";

export const projectRouter = createTRPCRouter({
	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				description: z.string().optional(),
				color: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [newProject] = await ctx.db
				.insert(project)
				.values({
					name: input.name,
					description: input.description ?? null,
					color: input.color,
					userId: ctx.session.user.id,
				})
				.returning();
			return newProject;
		}),

	getAll: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.query.project.findMany({
			where: eq(project.userId, ctx.session.user.id),
			orderBy: (project, { desc }) => [desc(project.createdAt)],
		});
	}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1),
				description: z.string().optional(),
				color: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [updatedProject] = await ctx.db
				.update(project)
				.set({
					name: input.name,
					description: input.description ?? null,
					color: input.color,
				})
				.where(eq(project.id, input.id))
				.returning();
			return updatedProject;
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db.delete(project).where(eq(project.id, input.id));
			return true;
		}),
});
