import fs from "node:fs";
import { v5 as uuidv5 } from "uuid";

// スクレイプしたデータの型
interface ScrapedEvent {
	date: string;
	time: string;
	title: string;
	platform: string[];
	imageUrl: string | undefined;
	artistPath: string | undefined;
}

// 最終形式の型
interface FinalEvent {
	uid: string;
	floor: string;
	platform: string[];
	title: string;
	timeSlotMinutes: number;
	image?: string;
	schedules: {
		year: string;
		date: { month: string; day: string };
		time: { hour: string; minute: string };
	}[];
}

// UUIDを生成するための名前空間
const NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

// 日付を解析（MMDD形式 → 月/日）
function parseDate(dateStr: string): { month: string; day: string } {
	const month = dateStr.substring(0, 2).replace(/^0/, "");
	const day = dateStr.substring(2).replace(/^0/, "");
	return { month, day };
}

// 時間を解析
function parseTime(timeStr: string): { hour: string; minute: string } {
	const [hour, minute] = timeStr.split(":");
	return { hour, minute };
}

// メイン処理
const scrapedData = JSON.parse(
	fs.readFileSync("scripts/scraped-events-2026.json", "utf-8"),
) as { events: ScrapedEvent[] };

// アーティストごとにグループ化
const eventsByTitle = new Map<string, ScrapedEvent[]>();
for (const event of scrapedData.events) {
	const existing = eventsByTitle.get(event.title) || [];
	existing.push(event);
	eventsByTitle.set(event.title, existing);
}

// 最終形式に変換
const finalEvents: FinalEvent[] = [];

for (const [title, events] of eventsByTitle) {
	// UIDを生成（タイトルから）
	const uid = uuidv5(title, NAMESPACE);

	// 画像URL（最初に見つかったもの）
	const image = events.find((e) => e.imageUrl)?.imageUrl;

	// スケジュールを作成
	const schedules = events.map((e) => ({
		year: "2026",
		date: parseDate(e.date),
		time: parseTime(e.time),
	}));

	// 日付と時間でソート
	schedules.sort((a, b) => {
		const dateA = a.date.month.padStart(2, "0") + a.date.day.padStart(2, "0");
		const dateB = b.date.month.padStart(2, "0") + b.date.day.padStart(2, "0");
		if (dateA !== dateB) return dateA.localeCompare(dateB);
		const timeA = a.time.hour.padStart(2, "0") + a.time.minute.padStart(2, "0");
		const timeB = b.time.hour.padStart(2, "0") + b.time.minute.padStart(2, "0");
		return timeA.localeCompare(timeB);
	});

	finalEvents.push({
		uid,
		floor: "その他", // 2026年版は1フロアのみなので「その他」を使用
		platform: ["PC"], // プラットフォーム情報がないのでデフォルトでPC
		title,
		timeSlotMinutes: 30, // 30分枠
		image,
		schedules,
	});
}

// タイトルでソート
finalEvents.sort((a, b) => a.title.localeCompare(b.title));

// ファイルに保存
fs.writeFileSync(
	"server/events.json",
	JSON.stringify({ events: finalEvents }, null, "\t"),
);

console.log(`Converted ${finalEvents.length} unique events`);
console.log(
	`Total schedules: ${finalEvents.reduce((sum, e) => sum + e.schedules.length, 0)}`,
);
console.log("Saved to server/events.json");
