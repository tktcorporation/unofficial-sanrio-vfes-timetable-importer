import type { Context } from "hono";
import { z } from "zod";
import { events } from "./events.json";

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
		date: z.string(),
		time: z.string(),
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

export const generateICS = async (c: Context) => {
	try {
		const { events } = await c.req.json();
		const validatedEvents = calendarEventSchema.parse(events);

		// ICSファイルの生成
		const icsContent = [
			"BEGIN:VCALENDAR",
			"VERSION:2.0",
			"PRODID:-//sanrio-vfes-timetable-importer//JP",
			...validatedEvents.map((event) => {
				const [month, day] = event.date.split("/");
				const [hour, minute] = event.time.split(":");
				const dateStr = `2024${month.padStart(2, "0")}${day.padStart(2, "0")}T${hour.padStart(2, "0")}${minute.padStart(2, "0")}00`;

				return [
					"BEGIN:VEVENT",
					`SUMMARY:${event.title}`,
					`DTSTART:${dateStr}`,
					`DTEND:${dateStr}`,
					`DESCRIPTION:プラットフォーム: ${event.platform.join(", ")}`,
					"END:VEVENT",
				].join("\n");
			}),
			"END:VCALENDAR",
		].join("\n");

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
