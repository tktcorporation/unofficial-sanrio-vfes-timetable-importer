import fs from "node:fs";
// ファイル例: scrape.mts
import { chromium } from "playwright";

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
	const page = await browser.newPage();

	// getEventFromDate関数内の処理を更新
	const getEventFromDate = async (
		date: string,
	): Promise<
		{
			date: string;
			time: string;
			title: string;
			platform: string[];
			height: number;
			imageUrl: string | undefined;
		}[]
	> => {
		await page.goto(`https://v-fes.sanrio.co.jp/timetable/${date}`, {
			waitUntil: "networkidle",
			timeout: 120000,
		});

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

					return { date, time, title, platform, height, imageUrl };
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
					// <div class="image">::before<style>.sd[data-r-0_0_0_1_1_1_0_7_5e6cce75-3a8d-4908-80f9-5f025ca40bf6]:before { background-image: url("https://storage.googleapis.com/studio-cms-assets/projects/G3qbEkMgOJ/s-1920x1080_v-frms_webp_3de4dae8-1cd3-4c3e-aa04-af1f9c30bfb4_small.webp") }</style></div>
					const image = element.querySelector("div.image > style");
					const imageUrl = image?.textContent
						?.split("url(")?.[1]
						?.split(")")?.[0];
					// \" で囲まれている場合があるので除去
					const trimmedImageUrl = imageUrl?.replace(/^"|"$/g, "");

					return { date, time, title, platform, height, imageUrl };
				});
			},
			date,
		);

		return [...linkEvents, ...buttonEvents];
	};

	// 結果をコンソールに出力 + ファイルに保存
	const resultEvents: {
		date: string;
		time: string;
		title: string;
		platform: string[];
		height: number;
	}[] = [];
	for (const date of targetDateList) {
		try {
			const events = await getEventFromDate(date);
			const filteredEvents = events.filter(
				(event) => event.platform.length > 0 || event.imageUrl !== undefined,
			);
			console.log(`Scraped ${filteredEvents.length} events for date: ${date}`);
			resultEvents.push(...filteredEvents);
		} catch (error) {
			console.error(`Error scraping date: ${date}`, error);
		}
	}

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

	await browser.close();
})();
