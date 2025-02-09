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

export type EventKey = `${string}-${number}/${number}-${number}:${number}`;

export function createEventKey(event: Event, date: { month: string | number; day: string | number }, time: { hour: string | number; minute: string | number }): EventKey {
	return `${event.title}-${Number(date.month)}/${Number(date.day)}-${Number(time.hour)}:${Number(time.minute)}`;
}
