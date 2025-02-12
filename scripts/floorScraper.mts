import { chromium } from "playwright";
import fs from "node:fs";
(async () => {
	const eventsPathList = [
		"/event/cheersforthechallengers",
		"/event/aoiroclub",
		"/event/ddd",
		"/event/showbyrook",
		"/event/twinkleguardians",
		"/event/chaosinbelcland",
	];
	// ブラウザ起動
	const browser = await chromium.launch();
	const page = await browser.newPage();

	const getEventDetail = async (path: string) => {
		await page.goto(`https://v-fes.sanrio.co.jp${path}`, {
			waitUntil: "networkidle",
			timeout: 120000,
		});

		// ★ 画像が入っているコンテナを取得
		// このコンテナは、_small.webp を含む画像が存在する div になります。
		const imageContainer = page.locator(
			'div.sd.appear:has(img[src*="_small.webp"])',
		);

		// ★ floor と locationName の取得
		const floorLocator = page.locator('img[src*="_small.webp"] + div p').nth(0);
		const locationNameLocator = page
			.locator('img[src*="_small.webp"] + div p')
			.nth(1);

		const floor = (await floorLocator.textContent())?.trim() || "";
		const locationName =
			(await locationNameLocator.textContent())?.trim() || "";

		// ★ description の取得（imageContainer から相対的に取得）
		// imageContainer の親（この場合、2 番目の子の div）の親が外側のラッパーとなり、
		// その直下にある p 要素のうち、Presented by など固有の文字列を含む要素を選択
		const descriptionLocator = imageContainer.locator("xpath=../../p");
		const descriptionElements = await descriptionLocator.all();
		const descriptionTexts = await Promise.all(
			descriptionElements.map((element) => element.textContent())
		);
		const description = descriptionTexts
			.filter((text): text is string => text !== null)
			.join("\n")
			.replace(/<br\s*\/?>/gi, "\n");
		const result = {
			floor,
			locationName,
			description,
		};
		return result;
	};

	const resultList: {
		floor: string;
		locationName: string;
		description: string;
	}[] = [];
	for (const path of eventsPathList) {
		try {
			const result = await getEventDetail(path);
			console.log(`${path} の取得に成功しました`);
			resultList.push(result);
		} catch (error) {
			console.error(`${path} の取得に失敗しました:`, error);
		}
	}

	console.log(`success: ${resultList.length}/${eventsPathList.length}件`);
	fs.writeFileSync("floor-scraper.json", JSON.stringify(resultList, null, 2));

	// ブラウザを閉じる処理をすべての処理の後に移動
	await browser.close();

	// 出力例:
	// {
	//   floor: "1F/2F",
	//   locationName: "VIRTUAL PURO VILLAGE",
	//   description: "シナモロールとはなまるおばけが繰り広げる、挑戦する全ての人を応援するミニショー！Presented by 株式会社NTTドコモ"
	// }
})();
