import { z } from "zod";

export type Platform = "PC" | "Android";

export type Event = {
	platform: Platform[];
	title: string;
	image: string;
	schedules: Schedule[];
};

export type Schedule = {
	date: {
		month: string;
		day: string;
	};
	time: {
		hour: string;
		minute: string;
	};
};

const eventKeyRegex = /^(.+)-(\d+)\/(\d+)-(\d+):(\d+)$/;

export const eventKeySchema = z.string().refine(
	(val) => {
		const match = val.match(eventKeyRegex);
		if (!match) return false;

		const [, title, month, day, hour, minute] = match;
		if (!title) return false;

		const m = Number(month);
		const d = Number(day);
		const h = Number(hour);
		const min = Number(minute);

		return (
			m >= 1 && m <= 12 &&
			d >= 1 && d <= 31 &&
			h >= 0 && h <= 23 &&
			min >= 0 && min <= 59
		);
	},
	{
		message: "Invalid event key format. Expected: title-MM/DD-HH:mm",
	}
);

export const parsedEventKeySchema = z.object({
	title: z.string(),
	date: z.object({
		month: z.string().regex(/^\d+$/).transform(Number),
		day: z.string().regex(/^\d+$/).transform(Number),
	}),
	time: z.object({
		hour: z.string().regex(/^\d+$/).transform(Number),
		minute: z.string().regex(/^\d+$/).transform(Number),
	}),
});

export type EventKey = z.infer<typeof eventKeySchema>;
export type ParsedEventKey = z.infer<typeof parsedEventKeySchema>;

export function createEventKey(
	event: Event,
	date: { month: string | number; day: string | number },
	time: { hour: string | number; minute: string | number },
): EventKey {
	const key = `${event.title}-${Number(date.month)}/${Number(date.day)}-${Number(time.hour)}:${Number(time.minute)}`;
	return eventKeySchema.parse(key);
}

export function parseEventKey(key: EventKey): ParsedEventKey | null {
	try {
		const match = key.match(eventKeyRegex);
		if (!match) return null;

		const [, title, month, day, hour, minute] = match;
		const parsed = {
			title,
			date: {
				month,
				day,
			},
			time: {
				hour,
				minute,
			},
		};

		return parsedEventKeySchema.parse(parsed);
	} catch {
		return null;
	}
}
