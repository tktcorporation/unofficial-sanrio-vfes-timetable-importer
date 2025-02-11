import fs from "node:fs";
// ファイル例: scrape.mts
import { chromium } from "playwright";

(async () => {
	// Chromium ブラウザを headless モードで起動
	const browser = await chromium.launch({ headless: true });
	const page = await browser.newPage();

	// getEventFromDate関数内の処理を更新
	const getEventFromDate = async (): Promise<
		{
			alt: string | null | undefined;
			src: string | null | undefined;
		}[]
	> => {
		await page.goto("https://v-fes.sanrio.co.jp/#events", {
			waitUntil: "networkidle",
			timeout: 120000,
		});

		const linkEvents = await page.$$eval("img.sd", (anchors) => {
			return anchors.map((anchor) => {
				const element = anchor;
				return {
					alt: element.getAttribute("alt")?.trim(),
					src: element.getAttribute("src")?.trim(),
				};
			});
		});

		return linkEvents
			.filter((event) => event.alt && event.src)
			.filter((event) => event.src?.includes("https://"));
	};

	// 結果をコンソールに出力 + ファイルに保存
	const resultEvents: {
		alt: string | null | undefined;
		src: string | null | undefined;
	}[] = [];
	try {
		const events = await getEventFromDate();
		console.log(`Scraped ${events.length} events`);
		resultEvents.push(...events);
	} catch (error) {
		console.error("Error scraping date:", error);
	}
	// ネストされていても [object Object] にならないようにする
	fs.writeFileSync("scraped-image.json", JSON.stringify(resultEvents, null, 2));

	await browser.close();
})();
