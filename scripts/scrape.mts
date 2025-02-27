import fs from "node:fs";
// ファイル例: scrape.mts
import { chromium } from "playwright";
import type { Browser, Page } from "playwright";

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

// イベント情報の型定義
type EventInfo = {
	date: string;
	time: string;
	title: string;
	platform: string[];
	height: number;
	imageUrl: string | undefined;
};

// 新しいページを作成する関数
async function createNewPage(browser: Browser): Promise<Page> {
	return await browser.newPage();
}

// タイムアウト時に再試行する関数
async function withRetry<T>(
	fn: () => Promise<T>,
	browser: Browser,
): Promise<T> {
	// 最初のページを作成
	const page = await createNewPage(browser);

	try {
		// 最初の試行
		return await fn();
	} catch (error: unknown) {
		// エラー発生時は必ずページを閉じる
		await page.close();

		const err = error as { name?: string };
		if (err.name === "TimeoutError") {
			console.log("タイムアウトが発生しました。新しいページで再試行します。");
			// 新しいページを作成して再試行
			const newPage = await createNewPage(browser);
			try {
				// 再試行用の関数を実行
				return await fn();
			} finally {
				// 再試行用のページも必ず閉じる
				await newPage.close();
			}
		}
		// タイムアウト以外のエラーはそのまま投げる
		throw error;
	} finally {
		// 正常終了時もページを閉じる
		await page.close().catch(() => {
			/* すでに閉じられている可能性があるため例外を無視 */
		});
	}
}

// 指定した日付のイベント情報を取得する関数
async function getEventFromDate(
	browser: Browser,
	date: string,
): Promise<EventInfo[]> {
	return await withRetry(async () => {
		// 毎回新しいページを作成
		const page = await createNewPage(browser);

		try {
			await page.goto(`https://v-fes.sanrio.co.jp/timetable/${date}`, {
				waitUntil: "networkidle",
				timeout: 300000,
			});

			// "a.link.sd.appear", "button.link.sd.appear" どちらかが見つかるまで待機
			await page.waitForSelector("a.link.sd.appear, button.link.sd.appear");
			// 追加で5秒待機
			await new Promise((resolve) => setTimeout(resolve, 5000));

			const linkEvents = await page.$$eval(
				"a.link.sd.appear",
				(anchors, date) => {
					return anchors.map((anchor) => {
						const element = anchor;
						const infoDivs = element.querySelectorAll("p");
						const texts = [...infoDivs].map((p) => p.textContent?.trim());
						const filteredTexts = texts.filter((t) => t !== undefined);

						const time = filteredTexts.find((t) => t.includes(":")) ?? "";
						const title =
							filteredTexts.find(
								(t) => !t.includes(":") && t !== "Android" && t !== "PC",
							) ?? "";
						const platform =
							filteredTexts.filter((t) => t === "Android" || t === "PC") ?? "";
						const height = element.getBoundingClientRect().height;

						// image があれば取得
						const image = element.querySelector("div.image > style");
						const imageUrl = image?.textContent
							?.split("url(")?.[1]
							?.split(")")?.[0];

						// \" で囲まれている場合があるので除去
						const trimmedImageUrl = imageUrl?.replaceAll('"', "");

						return {
							date,
							time,
							title,
							platform,
							height,
							imageUrl: trimmedImageUrl,
						};
					});
				},
				date,
			);

			const buttonEvents = await page.$$eval(
				"button.link.sd.appear",
				(buttons, date) => {
					return buttons.map((button) => {
						const element = button;
						const infoDivs = element.querySelectorAll("p");
						const texts = [...infoDivs].map((p) => p.textContent?.trim());
						const filteredTexts = texts.filter((t) => t !== undefined);

						const time = filteredTexts.find((t) => t.includes(":")) ?? "";
						const title =
							filteredTexts.find(
								(t) => !t.includes(":") && t !== "Android" && t !== "PC",
							) ?? "";
						const platform =
							filteredTexts.filter((t) => t === "Android" || t === "PC") ?? "";
						const height = element.getBoundingClientRect().height;

						// image があれば取得
						const image = element.querySelector("div.image > style");
						const imageUrl = image?.textContent
							?.split("url(")?.[1]
							?.split(")")?.[0];
						// \" で囲まれている場合があるので除去
						const trimmedImageUrl = imageUrl?.replaceAll('"', "");

						return {
							date,
							time,
							title,
							platform,
							height,
							imageUrl: trimmedImageUrl,
						};
					});
				},
				date,
			);

			return [...linkEvents, ...buttonEvents];
		} finally {
			// 処理が終わったらページを閉じる
			await page.close().catch(() => {
				/* すでに閉じられている可能性があるため例外を無視 */
			});
		}
	}, browser);
}

// 複数の日付のイベント情報を取得する関数
async function scrapeMultipleDates(
	browser: Browser,
	dateList: string[],
): Promise<EventInfo[]> {
	const resultEvents: EventInfo[] = [];

	for (const date of dateList) {
		try {
			const events = await getEventFromDate(browser, date);
			const filteredEvents = events.filter(
				(event) => event.platform.length > 0 || event.imageUrl !== undefined,
			);
			console.log(`Scraped ${filteredEvents.length} events for date: ${date}`);
			resultEvents.push(...filteredEvents);
		} catch (error) {
			console.error(`Error scraping date: ${date}`, error);
		}
	}

	return resultEvents;
}

(async () => {
	const targetDateList = [
		// 0211 - 0309 までは毎日
		"0211",
		"0212",
		"0213",
		"0214",
		"0215",
		"0216",
		"0217",
		"0218",
		"0219",
		"0220",
		"0221",
		"0222",
		"0223",
		"0224",
		"0225",
		"0226",
		"0227",
		"0228",
		"0301",
		"0302",
		"0303",
		"0304",
		"0305",
		"0306",
		"0307",
		"0308",
		"0309",
		// タイムシフトは 0316 - 0317
		"0316",
		"0317",
	];
	// const targetDateList = ["0215"];

	// Chromium ブラウザを headless モードで起動
	const browser = await chromium.launch({ headless: true });

	try {
		// 複数の日付をスクレイピング
		const resultEvents = await scrapeMultipleDates(browser, targetDateList);

		// イベントを日付と時間でソート
		const sortedEvents = [...resultEvents].sort((a, b) => {
			// まず日付で比較
			if (a.date !== b.date) {
				return a.date.localeCompare(b.date);
			}

			// 日付が同じ場合は時間で比較
			const timeA = convertTimeToComparable(a.time);
			const timeB = convertTimeToComparable(b.time);
			return timeA.localeCompare(timeB);
		});

		// ネストされていても [object Object] にならないようにする
		fs.writeFileSync(
			"scripts/scraped-events.json",
			JSON.stringify({ events: sortedEvents }, null, 2),
		);
	} finally {
		// 必ずブラウザを閉じる
		await browser.close();
	}
})();
