import fs from "node:fs";
// ファイル例: scrape.mts
import { chromium } from "playwright";

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
				(event) => event.platform.length > 0,
			);
			console.log(`Scraped ${filteredEvents.length} events for date: ${date}`);
			resultEvents.push(...filteredEvents);
		} catch (error) {
			console.error(`Error scraping date: ${date}`, error);
		}
	}
	// ネストされていても [object Object] にならないようにする
	fs.writeFileSync(
		"scraped-events.json",
		JSON.stringify(resultEvents, null, 2),
	);

	await browser.close();
})();
