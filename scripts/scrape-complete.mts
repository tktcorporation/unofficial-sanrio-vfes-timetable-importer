import fs from "node:fs";
import { chromium } from "playwright";
import type { Browser, Page } from "playwright";

// イベント情報の型定義
type EventInfo = {
	date: string;
	time: string;
	title: string;
	platform: string[];
	height: number;
	imageUrl: string | undefined;
	duration?: number; // イベントの時間長（分）
};

// 新しいページを作成する関数
async function createNewPage(browser: Browser): Promise<Page> {
	return await browser.newPage();
}

// 指定した日付のイベント情報を取得する関数
async function getEventFromDate(
	browser: Browser,
	date: string,
): Promise<EventInfo[]> {
	const page = await createNewPage(browser);
	const events: EventInfo[] = [];

	try {
		await page.goto(`https://v-fes.sanrio.co.jp/timetable/${date}`, {
			waitUntil: "domcontentloaded",
			timeout: 30000,
		});

		// 少し待機してコンテンツをロード
		await page.waitForTimeout(3000);

		// スクロールして全体を表示
		await page.evaluate(() => {
			window.scrollTo(0, document.body.scrollHeight);
		});
		await page.waitForTimeout(1000);

		// 時間軸の要素を取得してマッピングを作成（より広範囲に探す）
		console.log(`Getting time axis for ${date}...`);
		const timeMapping = await page.$$eval("*", (elements) => {
			const mapping: { [key: number]: string } = {};
			elements.forEach((el) => {
				const text = el.textContent?.trim();
				// 時間パターンを広く取得（0:00から28:00まで対応）
				if (text && /^\d{1,2}:00$/.test(text) && text.length <= 5) {
					const rect = el.getBoundingClientRect();
					// 左側にある時間軸のみ（x座標が100px以下）
					if (rect.left < 100) {
						mapping[Math.round(rect.top)] = text;
					}
				}
			});
			return mapping;
		});

		// 時間マッピングをソート
		const sortedTimes = Object.entries(timeMapping)
			.map(([top, time]) => ({ top: parseInt(top), time }))
			.sort((a, b) => a.top - b.top);

		console.log(`Time mapping for ${date}:`, sortedTimes);

		// 1時間あたりのピクセル数を計算
		let pixelsPerHour = 80; // デフォルト値
		if (sortedTimes.length >= 2) {
			const hourDiff = parseInt(sortedTimes[1].time) - parseInt(sortedTimes[0].time);
			pixelsPerHour = (sortedTimes[1].top - sortedTimes[0].top) / hourDiff;
		}

		// イベント要素を取得
		const elements = await page.$$("a.link.sd.appear, button.link.sd.appear");

		for (const element of elements) {
			try {
				// イベントの位置情報を取得
				const rect = await element.boundingBox();
				if (!rect) continue;

				const eventTop = Math.round(rect.y);
				const eventHeight = Math.round(rect.height);

				// 最も近い時間を計算（改善版）
				let closestTime = "";
				let minDiff = Number.MAX_VALUE;
				let closestIndex = -1;

				for (let i = 0; i < sortedTimes.length; i++) {
					const diff = Math.abs(eventTop - sortedTimes[i].top);
					if (diff < minDiff) {
						minDiff = diff;
						closestTime = sortedTimes[i].time;
						closestIndex = i;
					}
				}

				// より正確な時間計算
				if (closestTime && closestIndex >= 0) {
					const baseTime = sortedTimes[closestIndex];
					const pixelDiff = eventTop - baseTime.top;
					const hourOffset = pixelDiff / pixelsPerHour;

					// 時間を計算
					const [baseHour] = baseTime.time.split(":");
					const totalMinutes = parseInt(baseHour) * 60 + Math.round(hourOffset * 60);

					// 15分単位に丸める
					const roundedMinutes = Math.round(totalMinutes / 15) * 15;
					const hour = Math.floor(roundedMinutes / 60);
					const minute = roundedMinutes % 60;

					closestTime = `${hour}:${minute.toString().padStart(2, "0")}`;
				}

				// イベントの継続時間を計算（高さから）
				const durationHours = eventHeight / pixelsPerHour;
				const duration = Math.round(durationHours * 60); // 分単位

				// テキストを取得
				const texts = await element.$$eval("p", (ps) =>
					ps.map((p) => p.textContent?.trim() || "")
				);

				let title = "";
				const platformList: string[] = [];

				for (const text of texts) {
					if (text === "PC" || text === "Android") {
						platformList.push(text);
					} else if (text && !text.match(/^\d{1,2}:\d{2}/)) {
						if (!title) {
							title = text;
						}
					}
				}

				// 画像URLを取得
				let imageUrl: string | undefined;
				const styleElement = await element.$("div.image > style");
				if (styleElement) {
					const styleContent = await styleElement.textContent();
					const urlMatch = styleContent?.match(/url\("?([^")\s]+)"?\)/);
					if (urlMatch) {
						imageUrl = urlMatch[1].replace(/"/g, "");
					}
				}

				// ナビゲーション要素と日付ボタンを除外
				const navigationItems = new Set([
					"ホーム", "HOME", "アーティスト", "タイムテーブル",
					"イベント", "フロア", "グッズ", "Q&A",
					"初めての方へ", "はじめての方へ", "チケット"
				]);

				if (title && closestTime && !navigationItems.has(title) && !title.match(/^9\/\d{1,2}$/)) {
					events.push({
						date,
						time: closestTime,
						title,
						platform: platformList.length > 0 ? platformList : ["PC"],
						height: eventHeight,
						imageUrl,
						duration: duration > 30 ? duration : undefined, // 30分以上の場合のみ記録
					});
				}
			} catch (err) {
				console.error("Error processing element:", err);
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

// 複数の日付のイベント情報を取得する関数
async function scrapeMultipleDates(
	browser: Browser,
	dateList: string[],
): Promise<EventInfo[]> {
	const resultEvents: EventInfo[] = [];

	for (let i = 0; i < dateList.length; i++) {
		const date = dateList[i];
		console.log(`Processing ${i + 1}/${dateList.length}: ${date}`);
		const events = await getEventFromDate(browser, date);
		resultEvents.push(...events);
	}

	return resultEvents;
}

(async () => {
	// サマーエディションの日付リスト（9/19 - 9/28）
	const targetDateList = [
		"0919",
		"0920",
		"0921",
		"0922",
		"0923",
		"0924",
		"0925",
		"0926",
		"0927",
		"0928",
	];

	const browser = await chromium.launch({
		headless: true,
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	});

	try {
		const resultEvents = await scrapeMultipleDates(browser, targetDateList);

		// イベントを日付と時間でソート
		const sortedEvents = [...resultEvents].sort((a, b) => {
			if (a.date !== b.date) {
				return a.date.localeCompare(b.date);
			}
			// 時間を比較
			return a.time.localeCompare(b.time);
		});

		// JSONファイルとして保存
		fs.writeFileSync(
			"scripts/scraped-events-complete.json",
			JSON.stringify({ events: sortedEvents }, null, 2),
		);

		console.log(`Total events scraped: ${sortedEvents.length}`);
		console.log("Events saved to scripts/scraped-events-complete.json");
	} finally {
		await browser.close();
	}
})();