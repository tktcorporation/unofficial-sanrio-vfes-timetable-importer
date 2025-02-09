import { z } from "zod";

export type Platform = "PC" | "Android";

export interface DateInfo {
	year: number;
	month: number;
	day: number;
}

export interface TimeInfo {
	hour: number;
	minute: number;
}

export interface Schedule {
	date: DateInfo;
	time: TimeInfo;
}

export interface Event {
	title: string;
	uid: string;
	platform: Platform[];
	image: string;
	schedules: Schedule[];
}

export interface SelectedSchedule {
	uid: string;
	schedule: Schedule;
}

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
			m >= 1 &&
			m <= 12 &&
			d >= 1 &&
			d <= 31 &&
			h >= 0 &&
			h <= 23 &&
			min >= 0 &&
			min <= 59
		);
	},
	{
		message: "Invalid event key format. Expected: title-MM/DD-HH:mm",
	},
);

export const parsedEventKeySchema = z.object({
	uid: z.string(),
	date: z.object({
		year: z.string().regex(/^\d+$/).transform(Number),
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

export const createEventKey = ({
	uid,
	date,
	time,
}: {
	uid: string;
	date: DateInfo;
	time: TimeInfo;
}): string => {
	return `${uid}_${date.year}-${date.month}-${date.day}_${time.hour}-${time.minute}`;
};

export const parseEventKey = (key: string): ParsedEventKey => {
	const parsed = parsedEventKeySchema.safeParse(key);
	if (!parsed.success) {
		throw new Error("Invalid event key format. Expected: uid-MM/DD-HH:mm");
	}
	return parsed.data;
};
