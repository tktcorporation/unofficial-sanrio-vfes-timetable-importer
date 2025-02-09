import { hc } from "hono/client";
import type { CalendarEvent } from "../server/controller";
import type { AppType } from "../server/index";
import type { Event, Platform } from "./components/types";

export const honoClient = hc<AppType>("/");

export type GetEventsResponse = {
	events: Event[];
};

export type AddToCalendarResponse = {
	success: boolean;
	error?: string;
};

export type ErrorResponse = {
	error: string;
	details?: string[];
};

export const getEvents = async () => {
	const res = await honoClient.events.$get();
	return res.json();
};

export const getAuthUrl = async () => {
	const res = await honoClient.auth.url.$get();
	return res.json();
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
	return res.json();
};

export const generateICS = async (events: CalendarEvent[]) => {
	const response = await honoClient.calendar.ics.$post({
		json: { events },
	});

	if (!response.ok) {
		const error = (await response.json()) as ErrorResponse;
		throw new Error(error.details ? error.details.join(", ") : error.error);
	}

	return await response.blob();
};

export const generateCancelICS = async (events: CalendarEvent[]) => {
	const res = await honoClient.calendar["cancel-ics"].$post({
		json: { events },
	});
	return res.blob();
};
