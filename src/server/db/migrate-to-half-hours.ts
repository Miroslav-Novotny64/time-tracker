import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";
import * as schema from "./schema";

async function main() {
	const conn = postgres(env.DATABASE_URL);
	const db = drizzle(conn, { schema });

	console.log("Starting migration: 1-hour slots -> 30-min slots");

	const allLogs = await db.query.timeLog.findMany();
	console.log(`Found ${allLogs.length} total logs.`);

	let migratedCount = 0;

	for (const log of allLogs) {
		// Existing logs should be "HH:00"
		if (log.timeSlot.endsWith(":00")) {
			const hourStr = log.timeSlot.split(":")[0];
			const newTimeSlot = `${hourStr}:30`;

			// Check if the 30-min log already exists to prevent duplicates
			const existingHalfHour = await db.query.timeLog.findFirst({
				where: and(
					eq(schema.timeLog.date, log.date),
					eq(schema.timeLog.timeSlot, newTimeSlot),
					eq(schema.timeLog.userId, log.userId),
				),
			});

			if (!existingHalfHour) {
				await db.insert(schema.timeLog).values({
					id: crypto.randomUUID(),
					date: log.date,
					timeSlot: newTimeSlot,
					projectId: log.projectId,
					userId: log.userId,
					createdAt: new Date(),
				});
				migratedCount++;
			}
		}
	}

	console.log(`Migration complete. Created ${migratedCount} new 30-min slots.`);
	process.exit(0);
}

main().catch(console.error);
