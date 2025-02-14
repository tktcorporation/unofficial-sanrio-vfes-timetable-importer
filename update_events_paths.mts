import { readFileSync, writeFileSync } from "node:fs";

interface Artist {
	name: string;
	href: string;
}

interface Schedule {
	year: string;
	date: {
		month: string;
		day: string;
	};
	time: {
		hour: string;
		minute: string;
	};
}

interface Event {
	uid: string;
	floor: string;
	platform: string[];
	title: string;
	timeSlotMinutes: number;
	image: string;
	schedules: Schedule[];
	path?: string;
	locationName?: string;
	description?: string;
}

interface EventsData {
	events: Event[];
}

// JSONファイルを読み込む
const artists: Artist[] = JSON.parse(
	readFileSync("scraped-artists.json", "utf-8"),
);

const eventsData: EventsData = JSON.parse(
	readFileSync("server/events.json", "utf-8"),
);

// イベントのpathを更新
for (const event of eventsData.events) {
	// タイトルに含まれるアーティストを探す
	const matchingArtist = artists.find((artist) =>
		event.title.includes(artist.name),
	);

	if (matchingArtist) {
		event.path = matchingArtist.href;
	}
}

// 更新したJSONを保存
writeFileSync(
	"server/events.json",
	JSON.stringify(eventsData, null, 2),
	"utf-8",
);

console.log("イベントのパスを更新しました");
