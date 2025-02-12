import fs from "node:fs";
import { chromium } from "playwright";

interface ScrapedImage {
	alt: string | null;
	src: string | null;
	href: string | null;
}

interface FloorInfo {
	floor: string;
	locationName: string;
	description: string;
}

interface CombinedEventInfo extends Omit<ScrapedImage, "href"> {
	path: string | null;
	floor: string;
	locationName: string;
	description: string;
}

(async () => {
	// 画像情報の読み込み
	const scrapedImages: ScrapedImage[] = JSON.parse(
		fs.readFileSync("scraped-image.json", "utf-8"),
	);

	console.log("読み込んだイメージ情報:", scrapedImages);

	// ブラウザ起動
	const browser = await chromium.launch({ headless: true });
	const page = await browser.newPage();

	const getEventDetail = async (path: string) => {
		const url = `https://v-fes.sanrio.co.jp${path}`;
		console.log(`アクセス中: ${url}`);

		await page.goto(url, {
			waitUntil: "networkidle",
			timeout: 120000,
		});

		// ページの読み込みを待機
		await page.waitForLoadState("domcontentloaded");
		console.log("ページ読み込み完了");

		const imageContainer = page.locator(
			'div.sd.appear:has(img[src*="_small.webp"])',
		);

		// 要素の存在確認
		const containerExists = (await imageContainer.count()) > 0;
		console.log("imageContainer exists:", containerExists);

		const floorLocator = page.locator('img[src*="_small.webp"] + div p').nth(0);
		const locationNameLocator = page
			.locator('img[src*="_small.webp"] + div p')
			.nth(1);

		const floor = (await floorLocator.textContent())?.trim() || "";
		const locationName =
			(await locationNameLocator.textContent())?.trim() || "";

		console.log("取得した情報:", { floor, locationName });

		const descriptionLocator = imageContainer.locator("xpath=../../p");
		const descriptionElements = await descriptionLocator.all();
		const descriptionTexts = await Promise.all(
			descriptionElements.map((element) => element.textContent()),
		);
		const description = descriptionTexts
			.filter((text): text is string => text !== null)
			.join("\n")
			.replace(/<br\s*\/?>/gi, "\n");

		console.log("取得した説明:", description);

		return {
			floor,
			locationName,
			description,
		};
	};

	const combinedResults: CombinedEventInfo[] = [];

	for (const imageInfo of scrapedImages) {
		if (!imageInfo.href) {
			console.log("パスが存在しません:", imageInfo);
			continue;
		}

		try {
			const floorInfo = await getEventDetail(imageInfo.href);
			const combinedInfo: CombinedEventInfo = {
				alt: imageInfo.alt,
				src: imageInfo.src,
				path: imageInfo.href,
				...floorInfo,
			};
			console.log(`${imageInfo.href} の情報を結合しました:`, combinedInfo);
			combinedResults.push(combinedInfo);
		} catch (error) {
			console.error(`${imageInfo.href} の取得に失敗しました:`, error);
		}
	}

	console.log(`成功: ${combinedResults.length}/${scrapedImages.length}件`);
	fs.writeFileSync(
		"combined-events.json",
		JSON.stringify(combinedResults, null, 2),
	);

	await browser.close();
})();
