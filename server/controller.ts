import type { Context } from "hono";
import { z } from "zod";
import { events } from "./events.json";

const eventSchema =
	z.array(
		z.object({
			platform: z.array(z.enum(["PC", "Android"])),
			title: z.string(),
			image: z.string(),
			schedules: z.array(
				z.object({
					date: z.object({
						month: z.string(),
						day: z.string(),
					}),
					time: z.object({
						hour: z.string(),
						minute: z.string(),
					}),
				}),
			),
		}),
	)

export const getEvents = async (c: Context) => {
	const validatedEvents = eventSchema.parse(events);
	return c.json(validatedEvents);
};
