import fs from "node:fs";
import path from "node:path";
import { v5 as uuidv5 } from "uuid";

// サンリオVfesのための名前空間UUID
const NAMESPACE_UUID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

// scraped-events-complete.jsonを読み込み
const scrapedPath = path.join(
	process.cwd(),
	"scripts",
	"scraped-events-complete.json",
);
const scrapedData = JSON.parse(fs.readFileSync(scrapedPath, "utf-8"));

// 日付から年月日を抽出する関数
const parseDateString = (dateStr: string) => {
	// "0919" -> month: "9", day: "19"
	const month =
		dateStr.substring(0, 2) === "09" ? "9" : dateStr.substring(0, 2);
	const day = dateStr.substring(2, 4);
	return { month, day };
};

// ナビゲーション要素を除外
const navigationItems = new Set([
	"ホーム",
	"HOME",
	"アーティスト",
	"タイムテーブル",
	"イベント",
	"フロア",
	"グッズ",
	"Q&A",
	"初めての方へ",
	"はじめての方へ",
	"チケット",
]);

// イベントの型定義
type EventData = {
	uid: string;
	floor: string;
	platform: string[];
	title: string;
	timeSlotMinutes: number;
	image: string | undefined;
	schedules: Array<{
		year: string;
		date: { month: string; day: string };
		time: { hour: string; minute: string };
	}>;
};

// イベントごとにグループ化
const eventMap = new Map<string, EventData>();

for (const event of scrapedData.events) {
	// ナビゲーション要素を除外
	if (navigationItems.has(event.title)) {
		continue;
	}

	// タイトルが空の場合はスキップ
	if (!event.title || event.title === "") {
		continue;
	}

	// イベントキーを生成（タイトルベース）
	const key = event.title;

	if (!eventMap.has(key)) {
		// UUIDを生成（タイトルベース）
		const uid = uuidv5(event.title, NAMESPACE_UUID);

		// durationから時間スロットを決定
		const timeSlotMinutes =
			event.duration && event.duration >= 60 ? event.duration : 30;

		eventMap.set(key, {
			uid,
			floor: "その他",
			platform: event.platform || ["PC"],
			title: event.title,
			timeSlotMinutes,
			image: event.imageUrl,
			schedules: [],
		});
	}

	// スケジュールを追加
	const { month, day } = parseDateString(event.date);

	// 時間を分解
	const [hour, minute] = event.time.split(":");

	eventMap.get(key).schedules.push({
		year: "2025",
		date: { month, day },
		time: { hour, minute },
	});

	// imageUrlがある場合は更新
	if (event.imageUrl && !eventMap.get(key).image) {
		eventMap.get(key).image = event.imageUrl;
	}

	// durationが長い場合は時間スロットを更新
	if (event.duration && event.duration > eventMap.get(key).timeSlotMinutes) {
		eventMap.get(key).timeSlotMinutes = event.duration;
	}
}

// events.json形式に変換
const eventsJson = {
	events: Array.from(eventMap.values()).filter(
		(e) => e.title && e.title.length > 0,
	),
};

// 統計情報を出力
console.log(`変換前のイベント数: ${scrapedData.events.length}`);
console.log(
	`ナビゲーション要素を除外: ${scrapedData.events.filter((e: { title: string }) => navigationItems.has(e.title)).length}`,
);
console.log(`変換後のユニークイベント数: ${eventsJson.events.length}`);

// 長時間イベントの確認
const longEvents = eventsJson.events.filter((e) => e.timeSlotMinutes > 30);
if (longEvents.length > 0) {
	console.log("\n長時間イベント (30分以上):");
	for (const e of longEvents) {
		console.log(`  - ${e.title}: ${e.timeSlotMinutes}分`);
	}
}

// server/events.jsonとして保存
const outputPath = path.join(process.cwd(), "server", "events.json");
fs.writeFileSync(outputPath, JSON.stringify(eventsJson, null, "\t"), "utf-8");

console.log(
	`\n✅ サマーエディションのイベントデータを保存しました: ${outputPath}`,
);
