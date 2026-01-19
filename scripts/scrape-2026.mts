import fs from "node:fs";
import type { Browser, Page } from "playwright";
import { chromium } from "playwright";

// イベント情報の型定義（2026年版）
type EventInfo = {
	date: string;
	time: string;
	title: string;
	platform: string[];
	imageUrl: string | undefined;
	artistPath: string | undefined;
};

async function createNewPage(browser: Browser): Promise<Page> {
	return await browser.newPage();
}

async function getEventFromDate(
	browser: Browser,
	date: string,
): Promise<EventInfo[]> {
	const page = await createNewPage(browser);
	const events: EventInfo[] = [];

	try {
		console.log(`Navigating to timetable for ${date}...`);
		await page.goto(`https://v-fes.sanrio.co.jp/timetable/${date}`, {
			waitUntil: "domcontentloaded",
			timeout: 60000,
		});

		await page.waitForTimeout(5000);
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
		await page.waitForTimeout(2000);

		// 時間要素を取得（Y位置でユニーク化）
		const timeElements = await page.$$eval("p", (elements) => {
			const timeMap = new Map<number, string>();
			for (const el of elements) {
				const text = el.textContent?.trim();
				if (text && /^\d{1,2}:\d{2}$/.test(text)) {
					const rect = el.getBoundingClientRect();
					const top = Math.round(rect.top);
					if (!timeMap.has(top)) {
						timeMap.set(top, text);
					}
				}
			}
			return Array.from(timeMap.entries()).map(([top, time]) => ({
				time,
				top,
			}));
		});

		console.log(`Found ${timeElements.length} time elements`);

		// アーティスト情報を取得
		const artistData = await page.$$eval('a[href*="/artist/"]', (elements) => {
			return elements
				.map((el) => {
					const rect = el.getBoundingClientRect();
					const titleEl = el.querySelector("p");
					const imgEl = el.querySelector("img");
					return {
						title: titleEl?.textContent?.trim() || "",
						href: el.getAttribute("href") || "",
						top: Math.round(rect.top),
						imageUrl: imgEl?.getAttribute("src") || undefined,
					};
				})
				.filter((item) => item.title && item.href);
		});

		console.log(`Found ${artistData.length} artist elements`);

		// Y位置でマッチング（許容誤差10px以内）
		for (const artist of artistData) {
			let matchedTime = "";
			let minDiff = Number.MAX_VALUE;

			for (const timeEl of timeElements) {
				const diff = Math.abs(artist.top - timeEl.top);
				if (diff < minDiff && diff < 10) {
					minDiff = diff;
					matchedTime = timeEl.time;
				}
			}

			if (matchedTime) {
				const artistPath = artist.href.startsWith("/")
					? artist.href
					: `/${artist.href}`;

				// プレースホルダー画像を除外
				let imageUrl = artist.imageUrl;
				if (imageUrl?.startsWith("data:image/svg+xml")) {
					imageUrl = undefined;
				}

				events.push({
					date,
					time: matchedTime,
					title: artist.title,
					platform: [],
					imageUrl,
					artistPath,
				});

				console.log(`  ${matchedTime} - ${artist.title}`);
			}
		}

		console.log(`Scraped ${events.length} events for date: ${date}`);
	} catch (error) {
		console.error(`Error scraping date: ${date}`, error);
	} finally {
		await page.close();
	}

	return events;
}

async function scrapeMultipleDates(
	browser: Browser,
	dateList: string[],
): Promise<EventInfo[]> {
	const resultEvents: EventInfo[] = [];
	for (let i = 0; i < dateList.length; i++) {
		const date = dateList[i];
		console.log(`\n=== Processing ${i + 1}/${dateList.length}: ${date} ===`);
		const events = await getEventFromDate(browser, date);
		resultEvents.push(...events);
	}
	return resultEvents;
}

(async () => {
	// 2026年 Vfes の日付リスト
	const targetDateList = [
		"0208",
		"0213",
		"0214",
		"0215",
		"0219",
		"0220",
		"0221",
		"0222",
		"0226",
		"0227",
		"0228",
		"0301",
		"0305",
		"0306",
		"0307",
		"0308",
		"0315",
		"0316",
	];

	const browser = await chromium.launch({
		headless: true,
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	});

	try {
		const resultEvents = await scrapeMultipleDates(browser, targetDateList);

		// 日付と時間でソート
		const sortedEvents = [...resultEvents].sort((a, b) => {
			if (a.date !== b.date) return a.date.localeCompare(b.date);
			const [h1, m1] = a.time.split(":").map(Number);
			const [h2, m2] = b.time.split(":").map(Number);
			return h1 * 60 + m1 - (h2 * 60 + m2);
		});

		const outputPath = "scripts/scraped-events-2026.json";
		fs.writeFileSync(
			outputPath,
			JSON.stringify({ events: sortedEvents }, null, 2),
		);

		console.log("\n========================================");
		console.log(`Total events scraped: ${sortedEvents.length}`);
		console.log(`Events saved to ${outputPath}`);
		console.log("========================================");

		const eventsByDate: { [key: string]: number } = {};
		for (const event of sortedEvents) {
			eventsByDate[event.date] = (eventsByDate[event.date] || 0) + 1;
		}
		console.log("\nEvents per date:");
		for (const [date, count] of Object.entries(eventsByDate).sort((a, b) =>
			a[0].localeCompare(b[0]),
		)) {
			console.log(`  ${date}: ${count} events`);
		}
	} finally {
		await browser.close();
	}
})();
