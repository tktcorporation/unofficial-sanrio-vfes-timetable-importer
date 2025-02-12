import fs from "node:fs";
// ファイル例: scrape.mts
import { chromium } from "playwright";

interface ScrapedEvent {
	alt: string | null;
	src: string | null;
	path: string | null;
}

(async () => {
	// Chromium ブラウザを headless モードで起動
	const browser = await chromium.launch({ headless: true });
	const page = await browser.newPage();

	// getEventFromDate関数内の処理を更新
	const getEventFromDate = async (): Promise<ScrapedEvent[]> => {
		await page.goto("https://v-fes.sanrio.co.jp/#events", {
			waitUntil: "networkidle",
			timeout: 120000,
		});

		// 要素の取得とデータの抽出を分離
		const linkEvents = await page.$$eval("a.link", (elements) => {
			return elements.map((element) => ({
				path: element.getAttribute("href"),
				imgSrc: element.querySelector("img")?.getAttribute("src"),
				imgAlt: element.querySelector("img")?.getAttribute("alt"),
			}));
		});

		// 取得したデータを整形
		const filteredEvents = linkEvents
			.map((event) => ({
				alt: event.imgAlt?.trim() ?? null,
				src: event.imgSrc?.trim() ?? null,
				path: event.path?.trim() ?? null,
			}))
			.filter(
				(event) =>
					event.alt !== undefined &&
					event.src !== undefined &&
					event.src !== null &&
					event.src.includes("https://"),
			);
		console.log("取得した要素:", filteredEvents);
		return filteredEvents;
	};

	// 結果をコンソールに出力 + ファイルに保存
	const resultEvents: ScrapedEvent[] = [];
	try {
		const events = await getEventFromDate();
		console.log(`取得したイベント数: ${events.length}`);
		resultEvents.push(...events);
	} catch (error) {
		console.error("イベント取得中にエラーが発生:", error);
	}
	// ネストされていても [object Object] にならないようにする
	fs.writeFileSync("scraped-image.json", JSON.stringify(resultEvents, null, 2));

	await browser.close();
})();
