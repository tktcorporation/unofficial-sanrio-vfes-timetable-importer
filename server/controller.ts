import type { Context } from "hono";
import { z } from "zod";
import { events as _events } from "./events.json";

const events: Event[] = _events;

interface Event {
	uid: string;
	platform: string[];
	title: string;
	image: string;
	schedules: {
		year: string;
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
		uid: z.string(),
		platform: z.array(z.enum(["PC", "Android"])),
		title: z.string(),
		image: z.string(),
		schedules: z.array(
			z.object({
				year: z.string(),
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

const dateTimeSchema = z.object({
	date: z.string().regex(/^\d{2}\/\d{2}$/, {
		message: "日付は'MM/DD'形式で入力してください（例: 03/08）",
	}),
	time: z.string().regex(/^\d{2}:\d{2}$/, {
		message: "時刻は'HH:mm'形式で入力してください（例: 14:30）",
	}),
});

export const calendarEventSchema = z
	.array(
		z.object({
			title: z.string().min(1),
			platform: z.array(z.enum(["PC", "Android"])).min(1),
			startDateTime: dateTimeSchema,
			endDateTime: dateTimeSchema,
		}),
	)
	.min(1);

export type CalendarEvent = z.infer<typeof calendarEventSchema>[number];
export type DateTime = z.infer<typeof dateTimeSchema>;

const parseDateTime = (date: string, time: string) => {
	const [month, day] = date.split("/").map((n) => n.padStart(2, "0"));
	const [hour, minute] = time.split(":").map((n) => n.padStart(2, "0"));
	return {
		month,
		day,
		hour,
		minute,
	};
};

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
	},
) => {
	try {
		// events.jsonのイベントからUIDを探す
		const originalEvent = events.find((e: Event) => e.title === event.title);
		if (!originalEvent?.uid) {
			// 新しいUID生成ロジック
			return `${`${event.title}-${dateTime.startDateTime}_${dateTime.endDateTime}`
				.replace(/[^a-zA-Z0-9-_@]/g, "")
				.toLowerCase()}@sanrio-vfes-timetable-importer`;
		}
		return originalEvent.uid;
	} catch (e) {
		// フォールバックUID生成
		return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@sanrio-vfes-timetable-importer`;
	}
};

const generateICSContent = (
	events: CalendarEvent[],
	options: ICSEventOptions = {},
) => {
	return [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//sanrio-vfes-timetable-importer//JP",
		"CALSCALE:GREGORIAN",
		...(options.isCancellation ? ["METHOD:CANCEL"] : ["METHOD:REQUEST"]),
		...events.map((event) => {
			const start = parseDateTime(
				event.startDateTime.date,
				event.startDateTime.time,
			);
			const end = parseDateTime(event.endDateTime.date, event.endDateTime.time);

			const startDateStr = `2025${start.month}${start.day}T${start.hour}${start.minute}00`;
			const endDateStr = `2025${end.month}${end.day}T${end.hour}${end.minute}00`;

			const uid = generateEventUID(event, {
				startDateTime: startDateStr,
				endDateTime: endDateStr,
			});
			const now = `${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;

			return [
				"BEGIN:VEVENT",
				`UID:${uid}`,
				`DTSTAMP:${now}`,
				options.isCancellation ? "STATUS:CANCELLED" : "STATUS:CONFIRMED",
				`SUMMARY:[サンリオVfes] ${event.title} [${event.platform.join(", ")}]`,
				`DTSTART:${startDateStr}`,
				`DTEND:${endDateStr}`,
				`DESCRIPTION:プラットフォーム: ${event.platform.join(", ")}`,
				"TRANSP:OPAQUE",
				"END:VEVENT",
			].join("\n");
		}),
		"END:VCALENDAR",
	].join("\n");
};

export const generateICS = async (c: Context) => {
	try {
		const body = await c.req.json();
		if (!body || !Array.isArray(body.events)) {
			return c.json({ success: false, error: "イベントデータが不正です" }, 400);
		}

		const validatedEvents = calendarEventSchema.parse(body.events);
		const icsContent = generateICSContent(validatedEvents);

		console.log("Validated events:", validatedEvents);
		console.log("Generated ICS content:", `${icsContent.slice(0, 500)}...`);

		return new Response(icsContent, {
			headers: {
				"Content-Type": "text/calendar",
				"Content-Disposition": "attachment; filename=events.ics",
			},
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return c.json(
				{
					success: false,
					error: "不正なイベントデータです",
					details: error.errors,
				},
				400,
			);
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

		const icsContent = generateICSContent(validatedEvents, {
			isCancellation: true,
		});

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
