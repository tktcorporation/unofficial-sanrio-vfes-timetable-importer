export interface Schedule {
	date: {
		day: string;
		month: string;
	};
	time: {
		hour: string;
		minute: string;
	};
}

export type Platform = "PC" | "Android";

export interface Event {
	platform: Platform[];
	title: string;
	image: string;
	schedules: Schedule[];
}
