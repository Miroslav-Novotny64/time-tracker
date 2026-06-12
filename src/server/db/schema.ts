import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified")
		.$defaultFn(() => false)
		.notNull(),
	image: text("image"),
	createdAt: timestamp("created_at")
		.$defaultFn(() => /* @__PURE__ */ new Date())
		.notNull(),
	updatedAt: timestamp("updated_at")
		.$defaultFn(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").$defaultFn(
		() => /* @__PURE__ */ new Date(),
	),
	updatedAt: timestamp("updated_at").$defaultFn(
		() => /* @__PURE__ */ new Date(),
	),
});

export const userRelations = relations(user, ({ many }) => ({
	account: many(account),
	session: many(session),
	projects: many(project),
	timeLogs: many(timeLog),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const project = pgTable(
	"project",
	(d) => ({
		id: d
			.text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		name: d.varchar({ length: 256 }).notNull(),
		description: d.text(),
		color: d.varchar({ length: 50 }).notNull().default("#3b82f6"),
		userId: d
			.text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: d
			.timestamp({ withTimezone: true })
			.$defaultFn(() => new Date())
			.notNull(),
		updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
	}),
	(t) => [index("project_user_idx").on(t.userId)],
);

export const timeLog = pgTable(
	"time_log",
	(d) => ({
		id: d
			.text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		date: d.varchar({ length: 10 }).notNull(), // YYYY-MM-DD
		timeSlot: d.varchar({ length: 5 }).notNull(), // HH:MM
		projectId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => project.id, { onDelete: "cascade" }),
		userId: d
			.text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: d
			.timestamp({ withTimezone: true })
			.$defaultFn(() => new Date())
			.notNull(),
	}),
	(t) => [
		index("time_log_user_date_idx").on(t.userId, t.date),
		index("time_log_project_idx").on(t.projectId),
	],
);

export const projectRelations = relations(project, ({ one, many }) => ({
	user: one(user, { fields: [project.userId], references: [user.id] }),
	timeLogs: many(timeLog),
}));

export const timeLogRelations = relations(timeLog, ({ one }) => ({
	user: one(user, { fields: [timeLog.userId], references: [user.id] }),
	project: one(project, {
		fields: [timeLog.projectId],
		references: [project.id],
	}),
}));
