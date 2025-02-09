import { hc } from "hono/client";
import type { CalendarEvent } from "../../server/controller";
import type { AppType } from "../../server/index";
import type { Event, Platform } from "../types";

export const honoClient = hc<AppType>("/");

export type GetEventsResponse = {
	events: Event[];
};

export type AddToCalendarResponse = {
	success: boolean;
	error?: string;
};

export type ErrorResponse = {
	success: false;
	error: string;
	details?: unknown;
};

export const getEvents = async () => {
	const res = await honoClient.events.$get();
	if (!res.ok) {
		throw new Error("Failed to fetch events");
	}
	const data = await res.json();
	return [];
};

export const getAuthUrl = async () => {
	const res = await honoClient.auth.url.$get();
	return res.json() as Promise<{ url: string }>;
};

export const sendAuthCallback = async (code: string) => {
	const res = await honoClient.auth.callback.$post({
		json: { code },
	});
	return res.json() as Promise<{ success: boolean }>;
};

export const addToCalendar = async (events: CalendarEvent[]) => {
	const res = await honoClient.calendar.add.$post({
		json: { events },
	});
	return res.json() as Promise<AddToCalendarResponse>;
};

export const generateICS = async (events: CalendarEvent[]) => {
	const res = await honoClient.calendar.ics.$post({
		json: { events },
	});
	if (!res.ok) {
		const error = (await res.json()) as ErrorResponse;
		throw new Error(error.error);
	}
	return res.blob();
};

export const generateCancelICS = async (events: CalendarEvent[]) => {
	const res = await honoClient.calendar["cancel-ics"].$post({
		json: { events },
	});
	if (!res.ok) {
		const error = (await res.json()) as ErrorResponse;
		throw new Error(error.error);
	}
	return res.blob();
};
