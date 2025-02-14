import { z } from "zod";
import { events as _events } from "./events.json";

const eventSchema = z.array(
	z.object({
		uid: z.string().uuid(),
		floor: z.enum(["B4F", "1F/2F", "4F", "B3F", "その他"]),
		ticketLink: z.string().optional(),
		path: z.string().optional(),
		locationName: z.string().optional(),
		description: z.string().optional(),
		platform: z.array(z.enum(["PC", "Android"])),
		title: z.string().min(1),
		image: z.string().optional(),
		timeSlotMinutes: z.number(),
		schedules: z.array(
			z.object({
				year: z.string().regex(/^\d{4}$/),
				date: z.object({
					// 一文字 or 二文字
					month: z.string().regex(/^\d{1,2}$/),
					day: z.string().regex(/^\d{1,2}$/),
				}),
				time: z.object({
					hour: z.string().regex(/^\d{1,2}$/),
					minute: z.string().regex(/^\d{1,2}$/),
				}),
			}),
		),
	}),
);
export const EVENTS: Event[] = eventSchema.parse(_events);
export type Event = z.infer<typeof eventSchema>[number];
