import { query } from "$app/server";
import { db } from "$lib/server/db";
import { candidates, rooms } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import z from "zod";

export const createCandidates = query(
  z.object({
    roomID: z.string(),
    role: z.enum(["offer", "answer"]),
    candidate: z.string(),
  }),
  async (data) => {
    await db.insert(candidates).values(data);
  },
);

export const getCandidates = query(z.string(), async (roomID) => {
  return db.query.candidates.findMany({
    where: eq(candidates.roomID, roomID),
  });
});

export const createRoom = query(
  z.object({
    roomID: z.string(),
    offer: z.string(),
  }),
  async (data) => {
    await db
      .insert(rooms)
      .values(data)
      .onConflictDoUpdate({
        target: rooms.roomID,
        set: {
          offer: data.offer,
        },
      });
  },
);

export const getRoom = query(z.string(), async (roomID) => {
  return await db.query.rooms.findFirst({
    where: eq(rooms.roomID, roomID),
  });
});

export const createAnswer = query(
  z.object({
    roomID: z.string(),
    answer: z.string(),
  }),
  async (data) => {
    await db
      .update(rooms)
      .set({
        answer: data.answer,
      })
      .where(eq(rooms.roomID, data.roomID));
  },
);

export const deleteCandidates = query(z.string(), async (roomID) => {
  await db.delete(candidates).where(eq(candidates.roomID, roomID));
});
