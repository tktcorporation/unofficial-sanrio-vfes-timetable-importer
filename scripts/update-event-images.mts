import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

interface ScrapedImage {
	alt: string;
	src: string;
}

interface Event {
	uid: string;
	title: string;
	image?: string;
	// その他のプロパティは省略
}

interface EventsData {
	events: Event[];
}

const main = async () => {
	// ファイルパスの設定
	const eventsPath = resolve(process.cwd(), "server/events.json");
	const scrapedImagePath = resolve(process.cwd(), "scraped-image.json");

	// ファイルの読み込み
	const eventsData = JSON.parse(
		readFileSync(eventsPath, "utf-8"),
	) as EventsData;
	const scrapedImages = JSON.parse(
		readFileSync(scrapedImagePath, "utf-8"),
	) as ScrapedImage[];

	// イベントデータの更新
	let updatedCount = 0;
	eventsData.events = eventsData.events.map((event) => {
		// すでに画像がある場合はスキップ
		if (event.image) return event;

		// タイトルが一致する画像を検索
		const matchedImage = scrapedImages.find((img) =>
			img.alt?.includes(event.title),
		);
		if (matchedImage) {
			updatedCount++;
			return {
				...event,
				image: matchedImage.src,
			};
		}

		return event;
	});

	// 更新されたデータを保存
	writeFileSync(eventsPath, JSON.stringify(eventsData, null, 2), "utf-8");
	console.log(`✅ ${updatedCount}件のイベント画像を更新しました`);
};

main().catch((error) => {
	console.error("エラーが発生しました:", error);
	process.exit(1);
});
