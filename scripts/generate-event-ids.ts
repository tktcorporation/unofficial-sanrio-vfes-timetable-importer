import fs from "node:fs";
import path from "node:path";
import { v4 as uuidv4, v5 as uuidv5 } from "uuid";

// サンリオVfesのための名前空間UUID（v4で生成）
const NAMESPACE_UUID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"; // RFC 4122 で定義されたURLの名前空間UUID

const eventsPath = path.join(process.cwd(), "server", "events.json");
const eventsData = JSON.parse(fs.readFileSync(eventsPath, "utf-8"));

// タイトルと日時からUUIDを生成する関数
export const generateEventId = (event: {
	title: string;
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
}): string => {
	const uniqueString = event.schedules
		.map(
			(s: {
				date: {
					month: string;
					day: string;
				};
				time: {
					hour: string;
					minute: string;
				};
			}) => `${s.date.month}/${s.date.day}-${s.time.hour}:${s.time.minute}`,
		)
		.join("-");

	// UUIDv5を使用して、名前空間とユニークな文字列から一意のIDを生成
	return uuidv5(uniqueString, NAMESPACE_UUID);
};

// 各イベントにIDが付いてなければ追加
const eventsWithIds = {
	events: eventsData.events.map(
		(event: {
			title: string;
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
		}) => ({
			uid: generateEventId(event),
			...event,
		}),
	),
};

// 生成したIDの一覧を表示
console.log("生成したイベントID一覧:");
for (const event of eventsWithIds.events) {
	console.log(`${event.title}:`);
	console.log(`  uid: ${event.uid}`);
	console.log("  schedules:");
	for (const s of event.schedules) {
		console.log(
			`    - ${s.date.month}/${s.date.day} ${s.time.hour}:${s.time.minute}`,
		);
	}
	console.log("---");
}

// ファイルに書き戻す
fs.writeFileSync(
	eventsPath,
	JSON.stringify(eventsWithIds, null, "\t"),
	"utf-8",
);

console.log("\nイベントUIDを追加しました。events.jsonを更新しました。");
