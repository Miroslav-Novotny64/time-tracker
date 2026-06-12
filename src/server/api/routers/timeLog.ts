import { and, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { timeLog } from "@/server/db/schema";

export const timeLogRouter = createTRPCRouter({
	toggleLog: protectedProcedure
		.input(
			z.object({
				date: z.string(), // YYYY-MM-DD
				timeSlot: z.string(), // HH:MM
				projectId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.query.timeLog.findFirst({
				where: and(
					eq(timeLog.userId, ctx.session.user.id),
					eq(timeLog.date, input.date),
					eq(timeLog.timeSlot, input.timeSlot),
				),
			});

			if (existing) {
				// If clicking again on the same project, we toggle off (delete)
				if (existing.projectId === input.projectId) {
					await ctx.db.delete(timeLog).where(eq(timeLog.id, existing.id));
					return { action: "deleted" };
				} else {
					// Otherwise we switch the project
					await ctx.db
						.update(timeLog)
						.set({ projectId: input.projectId })
						.where(eq(timeLog.id, existing.id));
					return { action: "updated" };
				}
			}

			// Create new log
			await ctx.db.insert(timeLog).values({
				date: input.date,
				timeSlot: input.timeSlot,
				projectId: input.projectId,
				userId: ctx.session.user.id,
			});
			return { action: "created" };
		}),

	getLogsByDateRange: protectedProcedure
		.input(
			z.object({
				startDate: z.string(),
				endDate: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			return ctx.db.query.timeLog.findMany({
				where: and(
					eq(timeLog.userId, ctx.session.user.id),
					gte(timeLog.date, input.startDate),
					lte(timeLog.date, input.endDate),
				),
				with: {
					project: true,
				},
			});
		}),
});
