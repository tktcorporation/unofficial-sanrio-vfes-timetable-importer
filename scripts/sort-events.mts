import fs from "node:fs";

// イベントの型定義
interface Event {
	date: string;
	time: string;
	title: string;
	platform: string[];
	height: number;
	imageUrl?: string;
}

interface EventsData {
	events: Event[];
}

// イベントデータを読み込む
const data = JSON.parse(
	fs.readFileSync("scripts/scraped-events.json", "utf8"),
) as EventsData;

// 時間を24時間形式に変換する関数
function convertTimeToComparable(timeStr: string): string {
	if (!timeStr) return "99:99"; // 時間が空の場合は最後に並べる

	// "3/17 Mon 14:00" のような形式の場合
	if (timeStr.includes("/")) {
		const timePart = timeStr.split(" ").pop();
		return timePart || "99:99";
	}

	return timeStr;
}

// イベントを日付と時間でソート
const sortedEvents = [...data.events].sort((a: Event, b: Event) => {
	// まず日付で比較
	if (a.date !== b.date) {
		return a.date.localeCompare(b.date);
	}

	// 日付が同じ場合は時間で比較
	const timeA = convertTimeToComparable(a.time);
	const timeB = convertTimeToComparable(b.time);
	return timeA.localeCompare(timeB);
});

// 結果を新しいファイルに書き出し
fs.writeFileSync(
	"sorted-events.json",
	JSON.stringify({ events: sortedEvents }, null, 2),
	"utf8",
);

console.log(
	"イベントの並び替えが完了しました。結果は sorted-events.json に保存されました。",
);
