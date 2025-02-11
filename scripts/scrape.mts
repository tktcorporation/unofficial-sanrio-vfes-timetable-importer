// ファイル例: scrape.mts
import { chromium } from "playwright";
import fs from "node:fs";

(async () => {
	const targetDateList = [
		// 0211 - 0309 までは毎日
		"0211", "0212", "0213", "0214", "0215", "0216", "0217",
		"0218", "0219", "0220", "0221", "0222", "0223", "0224",
		"0225", "0226", "0227", "0228", "0301", "0302", "0303",
		"0304", "0305", "0306", "0307", "0308", "0309",
		// タイムシフトは 0316 - 0317
		"0316", "0317",
	];
	// const targetDateList = ["0215"];

	// Chromium ブラウザを headless モードで起動
	const browser = await chromium.launch({ headless: true });
	const page = await browser.newPage();

	// 対象の URL にアクセス

	const getEventFromDate = async (
		date: string,
	): Promise<
		{
			date: string;
			time: string;
			title: string;
			platform: string[];
			height: number;
		}[]
	> => {
		await page.goto(`https://v-fes.sanrio.co.jp/timetable/${date}`, {
			waitUntil: "networkidle",
			timeout: 120000,
        });


		// dateを第二引数として渡す
		const linkEvents = await page.$$eval(
			'a.link.sd.appear',
			(anchors, date) => {
				return anchors.map((anchor) => {
					// anchor 内の情報部分: class="sd appear" を持つ div を取得
					const infoDivs = anchor.querySelectorAll("p");
					const texts = [...infoDivs].map((p) => {
						return p.textContent?.trim();
					});
					const filteredTexts = texts.filter((t) => t !== undefined);

					const time = filteredTexts.find((t) => t.includes(":")) ?? "";
					const title =
						filteredTexts.find(
							(t) => !t.includes(":") && t !== "Android" && t !== "PC",
						) ?? "";
					const platform =
						filteredTexts.filter((t) => t === "Android" || t === "PC") ?? "";
					const height = anchor.getBoundingClientRect().height;

					const obj = { date, time, title, platform, height };
					console.log(obj);
					return obj;
				});
			},
			date,
		);

		// <button type="button" class="link sd appear" style="top: 880px;">
		// <button type="button" class="link sd appear" style="top: 880px;">
		const buttonEvents = await page.$$eval(
			"button.link.sd.appear",
			(buttons, date) => {
				const buttonTexts = buttons.map((b) => {
					const infoDivs = b.querySelectorAll("p");
					const texts = [...infoDivs].map((p) => {
						return p.textContent?.trim();
					});
					const filteredTexts = texts.filter((t) => t !== undefined);
					return {
						texts: filteredTexts,
						height: b.getBoundingClientRect().height,
					};
				}); // .texts => [
				//   [],
				//   [ '11:00', 'Musical Treasure Hunt', 'Android', 'PC' ],
				//   [ '20:00', 'Musical Treasure Hunt', 'Android', 'PC' ],
				//   [ '23:00', 'Musical Treasure Hunt', 'Android', 'PC' ]
				// ]
				return buttonTexts.map((button) => {
					const time = button.texts.find((t) => t.includes(":")) ?? "";
					const title =
						button.texts.find(
							(t) => !t.includes(":") && t !== "Android" && t !== "PC",
						) ?? "";
					const platform =
						button.texts.filter((t) => t === "Android" || t === "PC") ?? "";
					const height = button.height;

					const obj = { date, time, title, platform, height };
					console.log(obj);
					return obj;
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
			const filteredEvents = events.filter((event) => event.platform.length > 0);
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
