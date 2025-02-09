import * as dateFns from "date-fns";
import type { Context } from "hono";
import { z } from "zod";
import { events as _events } from "./events.json";

export type ValidatedContext<T = unknown> = Context & {
	req: Context["req"] & {
		valid: <K extends keyof T>(target: K) => T[K];
	};
};

export type CalendarValidatedContext = ValidatedContext<{
	json: z.infer<typeof calendarEventSchema>;
}>;

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
const EVENTS: Event[] = eventSchema.parse(_events);
type Event = z.infer<typeof eventSchema>[number];

export const ICS_FILE_NAMES = {
	EVENTS: "sanrio-vfes-events.ics",
	CANCEL_EVENTS: "sanrio-vfes-events-cancel.ics",
} as const;

export type ICSFileNames = typeof ICS_FILE_NAMES;

const dateTimeSchema = z.object({
	year: z.string(),
	month: z.string(),
	day: z.string(),
	hour: z.string(),
	minute: z.string(),
});

export const calendarEventSchema = z
	.array(
		z.object({
			uid: z.string(),
			startDateTime: dateTimeSchema,
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
	const validatedEvents = eventSchema.parse(EVENTS);
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
	selectedEvent: z.infer<typeof calendarEventSchema>[number],
	dateTime: {
		startDateTime: string;
		endDateTime: string;
	},
) => {
	// events.jsonのイベントからUIDを探す
	const originalEvent = EVENTS.find((e: Event) => e.uid === selectedEvent.uid);
	if (!originalEvent) {
		throw new Error(`イベントが見つかりません: ${selectedEvent.uid}`);
	}
	return `${originalEvent.uid}-${dateTime.startDateTime}_${dateTime.endDateTime}@sanrio-vfes-timetable-importer`;
};

const generateICSContent = (
	selectedEvents: CalendarEvent[],
	options: ICSEventOptions = {},
) => {
	const events: {
		uid: string;
		title: string;
		platform: string[];
		startDateTime: {
			year: string;
			month: string;
			day: string;
			hour: string;
			minute: string;
		};
		endDateTime: {
			year: string;
			month: string;
			day: string;
			hour: string;
			minute: string;
		};
	}[] = [];
	for (const event of selectedEvents) {
		const originalEvent = EVENTS.find((e: Event) => e.uid === event.uid);
		if (!originalEvent) {
			throw new Error(`イベントが見つかりません: ${event.uid}`);
		}
		// イベントの終了時間は開始時間+30分
		const startDateTime = dateFns.parse(
			`${event.startDateTime.year}-${event.startDateTime.month}-${event.startDateTime.day}T${event.startDateTime.hour}:${event.startDateTime.minute}:00`,
			"yyyy-MM-dd'T'HH:mm:ss",
			new Date(),
		);
		const endDateTime = dateFns.addMinutes(startDateTime, 30);
		events.push({
			uid: originalEvent.uid,
			title: originalEvent.title,
			platform: originalEvent.platform,
			startDateTime: {
				year: startDateTime.getFullYear().toString(),
				month: (startDateTime.getMonth() + 1).toString().padStart(2, "0"),
				day: startDateTime.getDate().toString().padStart(2, "0"),
				hour: startDateTime.getHours().toString().padStart(2, "0"),
				minute: startDateTime.getMinutes().toString().padStart(2, "0"),
			},
			endDateTime: {
				year: endDateTime.getFullYear().toString(),
				month: (endDateTime.getMonth() + 1).toString().padStart(2, "0"),
				day: endDateTime.getDate().toString().padStart(2, "0"),
				hour: endDateTime.getHours().toString().padStart(2, "0"),
				minute: endDateTime.getMinutes().toString().padStart(2, "0"),
			},
		});
	}

	return [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//sanrio-vfes-timetable-importer//JP",
		"CALSCALE:GREGORIAN",
		...(options.isCancellation ? ["METHOD:CANCEL"] : ["METHOD:REQUEST"]),
		...events.map((event) => {
			const startDateStr = dateFns.format(
				dateFns.parse(
					`${event.startDateTime.year}-${event.startDateTime.month}-${event.startDateTime.day}T${event.startDateTime.hour}:${event.startDateTime.minute}:00`,
					"yyyy-MM-dd'T'HH:mm:ss",
					new Date(),
				),
				"yyyyMMdd'T'HHmmss'Z'",
			);
			const endDateStr = dateFns.format(
				dateFns.parse(
					`${event.endDateTime.year}-${event.endDateTime.month}-${event.endDateTime.day}T${event.endDateTime.hour}:${event.endDateTime.minute}:00`,
					"yyyy-MM-dd'T'HH:mm:ss",
					new Date(),
				),
				"yyyyMMdd'T'HHmmss'Z'",
			);
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

const generateICSResponse = (content: string, fileName: string) => {
	return new Response(content, {
		headers: {
			"Content-Type": "text/calendar",
			"Content-Disposition": `attachment; filename="${fileName}"`,
		},
	});
};

export const generateICS = async (c: CalendarValidatedContext) => {
	try {
		const events = c.req.valid("json");
		const validatedEvents = calendarEventSchema.parse(events);

		// イベントの存在確認を先に行う
		for (const event of validatedEvents) {
			const originalEvent = EVENTS.find((e: Event) => e.uid === event.uid);
			if (!originalEvent) {
				return c.json(
					{
						success: false,
						error: `イベントが見つかりません: ${event.uid}`,
					},
					404,
				);
			}
		}

		const icsContent = generateICSContent(validatedEvents);
		return generateICSResponse(icsContent, ICS_FILE_NAMES.EVENTS);
	} catch (error) {
		console.error("Generate ICS error:", error);
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
		if (error instanceof Error) {
			return c.json(
				{
					success: false,
					error: error.message,
				},
				500,
			);
		}
		return c.json(
			{ success: false, error: "ICSファイルの生成に失敗しました" },
			500,
		);
	}
};

export const generateCancelICS = async (c: CalendarValidatedContext) => {
	try {
		const events = c.req.valid("json");
		const validatedEvents = calendarEventSchema.parse(events);

		// イベントの存在確認を先に行う
		for (const event of validatedEvents) {
			const originalEvent = EVENTS.find((e: Event) => e.uid === event.uid);
			if (!originalEvent) {
				return c.json(
					{
						success: false,
						error: `イベントが見つかりません: ${event.uid}`,
					},
					404,
				);
			}
		}

		const icsContent = generateICSContent(validatedEvents, {
			isCancellation: true,
		});
		return generateICSResponse(icsContent, ICS_FILE_NAMES.CANCEL_EVENTS);
	} catch (error) {
		console.error("Generate Cancel ICS error:", error);
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
		if (error instanceof Error) {
			return c.json(
				{
					success: false,
					error: error.message,
				},
				500,
			);
		}
		return c.json(
			{ success: false, error: "キャンセル用ICSファイルの生成に失敗しました" },
			500,
		);
	}
};
