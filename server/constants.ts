import { z } from "zod";
import { events as _events } from "./events.json";

const eventSchema = z.array(
	z.object({
		uid: z.string(),
		platform: z.array(z.enum(["PC", "Android"])),
		title: z.string(),
		image: z.string(),
		schedules: z.array(
			z.object({
				year: z.string(),
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
);
export const EVENTS: Event[] = eventSchema.parse(_events);
export type Event = z.infer<typeof eventSchema>[number];
