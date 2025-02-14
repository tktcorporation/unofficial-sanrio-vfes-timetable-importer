import * as dateFns from "date-fns";
import type { Context } from "hono";
import { z } from "zod";
import { EVENTS } from "./constants";

export type ValidatedContext<T = unknown> = Context & {
	req: Context["req"] & {
		valid: <K extends keyof T>(target: K) => T[K];
	};
};

export type CalendarValidatedContext = ValidatedContext<{
	json: z.infer<typeof calendarEventSchema>;
}>;

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

export const getEvents = async (c: Context) => {
	const validatedEvents = EVENTS;
	return c.json(validatedEvents);
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
	const originalEvent = EVENTS.find((e) => e.uid === selectedEvent.uid);
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
		locationName: string | undefined;
		floor: string | undefined;
		description: string | undefined;
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
		const originalEvent = EVENTS.find((e) => e.uid === event.uid);
		if (!originalEvent) {
			throw new Error(`イベントが見つかりません: ${event.uid}`);
		}
		// JSTの日時を作成
		const jstStartDateTime = dateFns.parse(
			`${event.startDateTime.year}-${event.startDateTime.month}-${event.startDateTime.day}T${event.startDateTime.hour}:${event.startDateTime.minute}:00`,
			"yyyy-MM-dd'T'HH:mm:ss",
			new Date(),
		);
		// JSTからUTCに変換（9時間引く）
		const utcStartDateTime = dateFns.subHours(jstStartDateTime, 9);
		const utcEndDateTime = dateFns.addMinutes(
			utcStartDateTime,
			originalEvent.timeSlotMinutes,
		);

		events.push({
			uid: originalEvent.uid,
			title: originalEvent.title,
			platform: originalEvent.platform,
			locationName: originalEvent.locationName,
			description: originalEvent.description,
			floor: originalEvent.floor,
			startDateTime: {
				year: utcStartDateTime.getFullYear().toString(),
				month: (utcStartDateTime.getMonth() + 1).toString().padStart(2, "0"),
				day: utcStartDateTime.getDate().toString().padStart(2, "0"),
				hour: utcStartDateTime.getHours().toString().padStart(2, "0"),
				minute: utcStartDateTime.getMinutes().toString().padStart(2, "0"),
			},
			endDateTime: {
				year: utcEndDateTime.getFullYear().toString(),
				month: (utcEndDateTime.getMonth() + 1).toString().padStart(2, "0"),
				day: utcEndDateTime.getDate().toString().padStart(2, "0"),
				hour: utcEndDateTime.getHours().toString().padStart(2, "0"),
				minute: utcEndDateTime.getMinutes().toString().padStart(2, "0"),
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
			const eventData = EVENTS.find((e) => e.uid === event.uid);
			if (!eventData) {
				throw new Error(`イベントが見つかりません: ${event.uid}`);
			}
			const description = `サンリオVfes2025\nアーティスト名: ${event.title}${
				eventData.floor ? `\nフロア: ${eventData.floor}` : ""
			}${
				eventData.locationName ? ` ${eventData.locationName}` : ""
			}\nプラットフォーム: ${event.platform.join(", ")}${
				eventData.description ? `\n\n${eventData.description}` : ""
			}\n\n詳しくは: https://v-fes.sanrio.co.jp${eventData.path}`;
			const escapedDescription = description
				.replace(/\\/g, "\\\\")
				.replace(/;/g, "\\;")
				.replace(/,/g, "\\,")
				.replace(/\n/g, "\\n");

			return [
				"BEGIN:VEVENT",
				`UID:${uid}`,
				`DTSTAMP:${now}`,
				options.isCancellation ? "STATUS:CANCELLED" : "STATUS:CONFIRMED",
				`SUMMARY:[サンリオVfes] ${event.title} [${event.platform.join(", ")}]`,
				`DTSTART:${startDateStr}`,
				`DTEND:${endDateStr}`,
				`DESCRIPTION:${escapedDescription}`,
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
			const originalEvent = EVENTS.find((e) => e.uid === event.uid);
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
			const originalEvent = EVENTS.find((e) => e.uid === event.uid);
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
