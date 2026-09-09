import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
};

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), email: text("email").notNull().unique(),
  username: text("username").unique(), passwordSalt: text("password_salt"),
  passwordHash: text("password_hash"), passwordIterations: integer("password_iterations"),
  name: text("name").notNull(), role: text("role").notNull().default("GIAO_VIEN"),
  active: integer("active", { mode: "boolean" }).notNull().default(true), ...timestamps,
});

export const sessions = sqliteTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const loginAttempts = sqliteTable("login_attempts", {
  id: text("id").primaryKey(), failures: integer("failures").notNull().default(0),
  blockedUntil: integer("blocked_until"), updatedAt: integer("updated_at").notNull(),
});

export const schoolYears = sqliteTable("school_years", {
  id: text("id").primaryKey(), name: text("name").notNull().unique(),
  startDate: text("start_date").notNull(), endDate: text("end_date").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(false), ...timestamps,
});

export const departments = sqliteTable("departments", {
  id: text("id").primaryKey(), name: text("name").notNull().unique(),
  description: text("description").notNull().default(""), ...timestamps,
});

export const teachers = sqliteTable("teachers", {
  id: text("id").primaryKey(), code: text("code").notNull().unique(), name: text("name").notNull(),
  email: text("email").notNull().default(""), phone: text("phone").notNull().default(""),
  specialty: text("specialty").notNull().default(""),
  departmentId: text("department_id").references(() => departments.id, { onDelete: "set null" }), ...timestamps,
});

export const subjects = sqliteTable("subjects", {
  id: text("id").primaryKey(), code: text("code").notNull().unique(), name: text("name").notNull(),
  description: text("description").notNull().default(""), ...timestamps,
});

export const classes = sqliteTable("classes", {
  id: text("id").primaryKey(), name: text("name").notNull(), grade: integer("grade").notNull(),
  teacherId: text("teacher_id").references(() => teachers.id, { onDelete: "set null" }),
  schoolYearId: text("school_year_id").references(() => schoolYears.id, { onDelete: "set null" }), ...timestamps,
});

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(), title: text("title").notNull(),
  category: text("category").notNull().default("GIAO_AN"), status: text("status").notNull().default("NHAP"),
  notes: text("notes").notNull().default(""), reviewerNote: text("reviewer_note").notNull().default(""),
  ownerEmail: text("owner_email").notNull(), originalName: text("original_name"),
  objectKey: text("object_key").unique(), mimeType: text("mime_type"), size: integer("size"), ...timestamps,
});

export const announcements = sqliteTable("announcements", {
  id: text("id").primaryKey(), title: text("title").notNull(), content: text("content").notNull(),
  authorEmail: text("author_email").notNull(), ...timestamps,
});
