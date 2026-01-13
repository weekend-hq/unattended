import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const rooms = pgTable("rooms", {
  roomID: text("roomID").primaryKey(),
  offer: text("offer"),
  answer: text("answer"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  roomID: text("roomID"),
  role: text("role"),
  candidate: text("candidate"),
  createdAt: timestamp("created_at").defaultNow(),
});
