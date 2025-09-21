import fs from "node:fs";
import path from "node:path";
import { v5 as uuidv5 } from "uuid";

// サンリオVfesのための名前空間UUID
const NAMESPACE_UUID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

// scraped-events-summer.jsonを読み込み
const scrapedPath = path.join(process.cwd(), "scripts", "scraped-events-summer.json");
const scrapedData = JSON.parse(fs.readFileSync(scrapedPath, "utf-8"));

// タイトルからフロアを推定する関数
const getFloorFromTitle = (title: string): string => {
	// デフォルトは"その他"
	return "その他";
};

// 日付から年月日を抽出する関数
const parseDateString = (dateStr: string) => {
	// "0919" -> { month: "9", day: "19" }
	const month = dateStr.substring(1, 2) === "0"
		? dateStr.substring(2, 3)
		: dateStr.substring(1, 3);
	const day = dateStr.substring(2, 4);
	return { month, day };
};

// イベントごとにグループ化
const eventMap = new Map<string, any>();

for (const event of scrapedData.events) {
	const key = event.title;

	if (!eventMap.has(key)) {
		// UUIDを生成（タイトルベース）
		const uid = uuidv5(event.title, NAMESPACE_UUID);

		eventMap.set(key, {
			uid,
			floor: getFloorFromTitle(event.title),
			platform: event.platform || ["PC"],
			title: event.title,
			timeSlotMinutes: 30, // デフォルト30分
			image: event.imageUrl,
			schedules: []
		});
	}

	// スケジュールを追加
	const { month, day } = parseDateString(event.date);
	const timeMatch = event.time?.match(/(\d+):(\d+)/);

	if (timeMatch) {
		eventMap.get(key).schedules.push({
			year: "2025",
			date: { month, day },
			time: {
				hour: timeMatch[1],
				minute: timeMatch[2]
			}
		});
	}
}

// events.json形式に変換
const eventsJson = {
	events: Array.from(eventMap.values())
};

// server/events-summer.jsonとして保存
const outputPath = path.join(process.cwd(), "server", "events-summer.json");
fs.writeFileSync(outputPath, JSON.stringify(eventsJson, null, "\t"), "utf-8");

console.log(`サマーエディションのイベントを変換しました: ${eventsJson.events.length}件`);
console.log(`出力先: ${outputPath}`);