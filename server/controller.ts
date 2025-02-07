import type { Context } from "hono";
import { z } from "zod";
import {events} from "./events.json";

interface Event {
	uid: string;
	platform: string[];
	title: string;
	image: string;
	schedules: {
		date: {
			month: string;
			day: string;
		};
		time: {
			hour: string;
			minute: string;
		};
	}[];
}

const eventSchema = z.array(
	z.object({
		platform: z.array(z.enum(["PC", "Android"])),
		title: z.string(),
		image: z.string(),
		schedules: z.array(
			z.object({
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

const calendarEventSchema = z.array(
	z.object({
		title: z.string(),
		startDate: z.string(),
		startTime: z.string(),
		endDate: z.string(),
		endTime: z.string(),
		platform: z.array(z.enum(["PC", "Android"])),
	}),
);

export const getEvents = async (c: Context) => {
	const validatedEvents = eventSchema.parse(events);
	return c.json(validatedEvents);
};

export const getAuthUrl = async (c: Context) => {
	// TODO: 実際のOAuth設定に応じて変更する必要があります
	const clientId = c.env.GOOGLE_CLIENT_ID;
	const origin = new URL(c.req.url).origin;
	const redirectUri = `${origin}/auth/callback`;
	const scope = "https://www.googleapis.com/auth/calendar";

	const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code`;

	return c.json({ url: authUrl });
};

export const handleAuthCallback = async (c: Context) => {
	try {
		const { code } = await c.req.json();
		if (!code) {
			return c.json(
				{ success: false, error: "認証コードが見つかりません" },
				400,
			);
		}

		// TODO: 実際のOAuth設定に応じて変更する必要があります
		const clientId = c.env.GOOGLE_CLIENT_ID;
		const clientSecret = c.env.GOOGLE_CLIENT_SECRET;
		const origin = new URL(c.req.url).origin;
		const redirectUri = `${origin}/auth/callback`;

		const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				code,
				client_id: clientId,
				client_secret: clientSecret,
				redirect_uri: redirectUri,
				grant_type: "authorization_code",
			}),
		});

		if (!tokenResponse.ok) {
			return c.json(
				{ success: false, error: "トークンの取得に失敗しました" },
				400,
			);
		}

		const tokenData = await tokenResponse.json();
		// TODO: トークンを保存する処理を追加

		return c.json({ success: true });
	} catch (error) {
		console.error("Auth callback error:", error);
		return c.json({ success: false, error: "認証処理に失敗しました" }, 500);
	}
};

export const addToCalendar = async (c: Context) => {
	try {
		const { events } = await c.req.json();
		const validatedEvents = calendarEventSchema.parse(events);

		// TODO: 実際のGoogle Calendar APIを使用してイベントを追加
		// この例では成功レスポンスを返すだけです
		return c.json({ success: true });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return c.json({ success: false, error: "不正なイベントデータです" }, 400);
		}
		console.error("Add to calendar error:", error);
		return c.json(
			{ success: false, error: "カレンダーへの追加に失敗しました" },
			500,
		);
	}
};

type ICSEventOptions = {
	isCancellation?: boolean;
};

const generateEventUID = (
	event: z.infer<typeof calendarEventSchema>[number],
	dateTime: {
		startDateTime: string;
		endDateTime: string;
	}
) => {
	// events.jsonのイベントからUIDを探す
	const originalEvent = events.find((e: Event) => e.title === event.title);
	if (!originalEvent?.uid) {
		// UIDが見つからない場合は、以前の方法でUIDを生成
		throw new Error("UIDが見つかりません");
	}
	// イベントのuidと日時を組み合わせて一意のUIDを生成
	return `${originalEvent.uid}-${dateTime.startDateTime}_${dateTime.endDateTime}@sanrio-vfes-timetable-importer`;
};

const generateICSContent = (events: z.infer<typeof calendarEventSchema>, options: ICSEventOptions = {}) => {
	return [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//sanrio-vfes-timetable-importer//JP",
		...(options.isCancellation ? ["METHOD:CANCEL"] : []),
		...events.map((event) => {
			const [startMonth, startDay] = event.startDate.split("/");
			const [startHour, startMinute] = event.startTime.split(":");
			const [endMonth, endDay] = event.endDate.split("/");
			const [endHour, endMinute] = event.endTime.split(":");
			const startDateStr = `2025${startMonth.padStart(2, "0")}${startDay.padStart(2, "0")}T${startHour.padStart(2, "0")}${startMinute.padStart(2, "0")}00`;
			const endDateStr = `2025${endMonth.padStart(2, "0")}${endDay.padStart(2, "0")}T${endHour.padStart(2, "0")}${endMinute.padStart(2, "0")}00`;
			const uid = generateEventUID(event, { startDateTime: startDateStr, endDateTime: endDateStr });

			return [
				"BEGIN:VEVENT",
				`UID:${uid}`,
				...(options.isCancellation ? [
					"STATUS:CANCELLED",
					"SEQUENCE:1",
				] : [
					"SEQUENCE:0",
				]),
				`SUMMARY:[サンリオVfes] ${event.title} [${event.platform.join(", ")}]`,
				`DTSTART:${startDateStr}`,
				`DTEND:${endDateStr}`,
				`DESCRIPTION:プラットフォーム: ${event.platform.join(", ")}`,
				"END:VEVENT",
			].join("\n");
		}),
		"END:VCALENDAR",
	].join("\n");
};

export const generateICS = async (c: Context) => {
	try {
		const { events } = await c.req.json();
		const validatedEvents = calendarEventSchema.parse(events);

		const icsContent = generateICSContent(validatedEvents);

		return new Response(icsContent, {
			headers: {
				"Content-Type": "text/calendar",
				"Content-Disposition": "attachment; filename=events.ics",
			},
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return c.json({ success: false, error: "不正なイベントデータです" }, 400);
		}
		console.error("Generate ICS error:", error);
		return c.json(
			{ success: false, error: "ICSファイルの生成に失敗しました" },
			500,
		);
	}
};

export const generateCancelICS = async (c: Context) => {
	try {
		const { events } = await c.req.json();
		const validatedEvents = calendarEventSchema.parse(events);

		const icsContent = generateICSContent(validatedEvents, { isCancellation: true });

		return new Response(icsContent, {
			headers: {
				"Content-Type": "text/calendar",
				"Content-Disposition": "attachment; filename=cancel_events.ics",
			},
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return c.json({ success: false, error: "不正なイベントデータです" }, 400);
		}
		console.error("Generate Cancel ICS error:", error);
		return c.json(
			{ success: false, error: "キャンセル用ICSファイルの生成に失敗しました" },
			500,
		);
	}
};
