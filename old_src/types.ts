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
