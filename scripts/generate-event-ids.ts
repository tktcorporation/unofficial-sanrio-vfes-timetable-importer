import fs from "fs";
import path from "path";
import { v5 as uuidv5, v4 as uuidv4 } from "uuid";

// サンリオVfesのための名前空間UUID（v4で生成）
const NAMESPACE_UUID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"; // RFC 4122 で定義されたURLの名前空間UUID

const eventsPath = path.join(process.cwd(), "server", "events.json");
const eventsData = JSON.parse(fs.readFileSync(eventsPath, "utf-8"));

// タイトルと日時からUUIDを生成する関数
const generateEventId = (event: any): string => {
	// タイトルと全ての公演日時を結合して一意の文字列を作成
	const uniqueString = `${event.title}-${event.schedules
		.map((s: any) => `${s.date.month}/${s.date.day}-${s.time.hour}:${s.time.minute}`)
		.join("-")}`;
	
	// UUIDv5を使用して、名前空間とユニークな文字列から一意のIDを生成
	return uuidv5(uniqueString, NAMESPACE_UUID);
};

// 各イベントにIDを追加
const eventsWithIds = {
	events: eventsData.events.map((event: any) => ({
		uid: generateEventId(event),
		...event,
	})),
};

// 生成したIDの一覧を表示
console.log("生成したイベントID一覧:");
eventsWithIds.events.forEach((event: any) => {
	console.log(`${event.title}:`);
	console.log(`  uid: ${event.uid}`);
	console.log("  schedules:");
	event.schedules.forEach((s: any) => {
		console.log(`    - ${s.date.month}/${s.date.day} ${s.time.hour}:${s.time.minute}`);
	});
	console.log("---");
});

// ファイルに書き戻す
fs.writeFileSync(
	eventsPath,
	JSON.stringify(eventsWithIds, null, "\t"),
	"utf-8",
);

console.log("\nイベントUIDを追加しました。events.jsonを更新しました。"); 