import fs from "node:fs";
import { match } from "ts-pattern";
import { v5 as uuidv5 } from "uuid";
import { z } from "zod";
import scrapedEvents from "../scraped-events.json";

// {
// 	"events": [
// 		{
// 			"date": "0211",
// 			"time": "7:00",
// 			"title": "RYUGU - Generated Paradise",
// 			"platform": ["PC"],
// 			"height": 20
// 		},
// 	]
// }

// 定数
const NAMESPACE_UUID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const DEFAULT_YEAR = "2025";

// 型定義
const scrapedEventSchema = z.object({
	date: z.string(),
	time: z.string(),
	title: z.string(),
	platform: z.array(z.enum(["PC", "Android"])),
	height: z.number(),
	imageUrl: z.string().optional(),
});

const scrapedEventsSchema = z.object({
	events: z.array(scrapedEventSchema),
});

const eventSchema = z.array(
	z.object({
		uid: z.string().uuid(),
		floor: z.enum(["B4F", "unknown"]),
		platform: z.array(z.enum(["PC", "Android"])),
		title: z.string().min(1),
		image: z.string().optional(),
		// 人枠の時間(分)
		timeSlotMinutes: z.number(),
		schedules: z.array(
			z.object({
				year: z.string().regex(/^\d{4}$/),
				date: z.object({
					// 一文字 or 二文字
					month: z.string().regex(/^\d{1,2}$/),
					day: z.string().regex(/^\d{1,2}$/),
				}),
				time: z.object({
					hour: z.string().regex(/^\d{2}$/),
					minute: z.string().regex(/^\d{2}$/),
				}),
			}),
		),
	}),
);

type ScrapedEvent = z.infer<typeof scrapedEventSchema>;
type KakoEvent = z.infer<typeof eventSchema>[number];

// ユーティリティ関数
const parseDateTime = (date: string, time: string) => {
	const dateParts = date.match(/.{1,2}/g);
	if (!dateParts || dateParts.length < 2) return null;

	const [month, day] = dateParts;
	// `3/17 Sun 9:30` or `9:30` をparseする
	const timeParts = time.split(" ");
	let hour: string;
	let minute: string;

	if (timeParts.length === 3) {
		const [h, m] = timeParts[2].split(":");
		if (!h || !m) return null;
		hour = h.padStart(2, "0");
		minute = m.padStart(2, "0");
	} else {
		const [h, m] = time.split(":");
		if (!h || !m) return null;
		hour = h.padStart(2, "0");
		minute = m.padStart(2, "0");
	}

	return {
		month,
		day,
		hour,
		minute,
	};
};

const createSchedule = (dateTime: {
	month: string;
	day: string;
	hour: string;
	minute: string;
}) => ({
	year: DEFAULT_YEAR,
	date: {
		month: dateTime.month,
		day: dateTime.day,
	},
	time: {
		hour: dateTime.hour,
		minute: dateTime.minute,
	},
});

const convertToKakoEvent = (scrapedEvent: ScrapedEvent): KakoEvent | null => {
	const dateTime = parseDateTime(scrapedEvent.date, scrapedEvent.time);
	if (!dateTime) return null;

	return {
		uid: uuidv5(scrapedEvent.title, NAMESPACE_UUID),
		floor: "unknown",
		platform: scrapedEvent.platform,
		title: scrapedEvent.title,
		image: scrapedEvent.imageUrl,
		schedules: [createSchedule(dateTime)],
		timeSlotMinutes: match(scrapedEvent.height)
			.with(0, () => 0)
			.with(14, () => 10)
			.with(20, () => 20)
			.with(40, () => 30)
			.with(64, () => 110)
			.with(80, () => 60)
			.with(100, () => 80)
			.with(160, () => 120)
			.with(300, () => 240)
			.otherwise(() => {
				console.error(
					`Unknown height: ${scrapedEvent.height}, date: ${scrapedEvent.date}, time: ${scrapedEvent.time}`,
				);
				return 0;
			}),
	};
};

// メイン処理
const processEvents = () => {
	const scrapedEventData = scrapedEventsSchema.parse(scrapedEvents);
	const eventMap = new Map<string, KakoEvent>();

	for (const event of scrapedEventData.events) {
		const kakoEvent = convertToKakoEvent(event);
		if (!kakoEvent) continue;

		const existingEvent = eventMap.get(event.title);
		if (existingEvent) {
			const dateTime = parseDateTime(event.date, event.time);
			if (dateTime) {
				existingEvent.schedules.push(createSchedule(dateTime));
			}
		} else {
			eventMap.set(event.title, kakoEvent);
		}
	}

	return Array.from(eventMap.values());
};

// ファイル出力
const saveToFile = (events: KakoEvent[]) => {
	const validatedEvents = eventSchema.parse(events);
	const resultJson = { events: validatedEvents };
	fs.writeFileSync("kako.json", JSON.stringify(resultJson, null, 2));
};

// 実行
const events = processEvents();
saveToFile(events);
