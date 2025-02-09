import { hc } from "hono/client";
import type { CalendarEvent } from "../server/controller";
import type { AppType } from "../server/index";
import type { Event, Schedule } from "./components/types";

export const honoClient = hc<AppType>("/");

type RawSchedule = {
	year: string;
	date: {
		month: string;
		day: string;
	};
	time: {
		hour: string;
		minute: string;
	};
};

type RawEvent = {
	uid: string;
	title: string;
	platform: ("PC" | "Android")[];
	image: string;
	schedules: RawSchedule[];
};

export const getEvents = async () => {
	const res = await honoClient.events.$get();
	const data = await res.json();
	const events = data.map((event: RawEvent) => ({
		...event,
		schedules: event.schedules.map((schedule: RawSchedule) => ({
			date: {
				year: Number(schedule.year),
				month: Number(schedule.date.month),
				day: Number(schedule.date.day),
			},
			time: {
				hour: Number(schedule.time.hour),
				minute: Number(schedule.time.minute),
			},
		})),
	}));
	return events as Event[];
};

export const getAuthUrl = async () => {
	const res = await honoClient.auth.url.$get();
	const data = await res.json();
	return data as { url: string };
};

export const sendAuthCallback = async (code: string) => {
	const res = await honoClient.auth.callback.$post({
		json: { code },
	});
	return res.json() as Promise<{ success: boolean }>;
};

export const addToCalendar = async (events: CalendarEvent[]) => {
	const res = await honoClient.calendar.add.$post({
		json: events,
	});
	return res.json();
};

export const generateICS = async (events: CalendarEvent[]) => {
	const res = await honoClient.calendar.ics.$post({
		json: events,
	});

	if (!res.ok) {
		const error = (await res.json()) as ErrorResponse;
		throw new Error(error.details ? error.details.join(", ") : error.error);
	}

	return await res.blob();
};

export const generateCancelICS = async (events: CalendarEvent[]) => {
	const res = await honoClient.calendar["cancel-ics"].$post({
		json: events,
	});

	if (!res.ok) {
		const error = (await res.json()) as ErrorResponse;
		throw new Error(error.details ? error.details.join(", ") : error.error);
	}

	return await res.blob();
};

type ErrorResponse = {
	success: false;
	error: string;
	details?: string[];
};
