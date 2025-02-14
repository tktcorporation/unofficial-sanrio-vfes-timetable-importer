import fs from "node:fs";
import { chromium } from "playwright";

interface ScrapedArtist {
	name: string | null;
	href: string | null;
}

(async () => {
	// Chromium ブラウザを headless モードで起動
	const browser = await chromium.launch({ headless: true });
	const page = await browser.newPage();

	const getArtistInfo = async (): Promise<ScrapedArtist[]> => {
		await page.goto("https://v-fes.sanrio.co.jp/artist/amoka", {
			waitUntil: "networkidle",
			timeout: 120000,
		});

		// アーティスト情報の取得
		const artistLinks = await page.$$eval("a.link", (elements) => {
			return elements.map((element) => ({
				href: element.getAttribute("href"),
				name: element.querySelector("p.text")?.textContent,
			}));
		});

		// データの整形とフィルタリング
		const filteredArtists = artistLinks
			.map((artist) => ({
				name: artist.name?.trim() ?? null,
				href: artist.href?.trim() ?? null,
			}))
			.filter(
				(artist) =>
					artist.name !== null &&
					artist.href !== null &&
					artist.href.includes("/artist/"),
			);

		console.log("取得したアーティスト:", filteredArtists);
		return filteredArtists;
	};

	// 結果をコンソールに出力 + ファイルに保存
	const resultArtists: ScrapedArtist[] = [];
	try {
		const artists = await getArtistInfo();
		console.log(`取得したアーティスト数: ${artists.length}`);
		resultArtists.push(...artists);
	} catch (error) {
		console.error("アーティスト情報取得中にエラーが発生:", error);
	}

	// 結果をJSONファイルに保存
	fs.writeFileSync(
		"scraped-artists.json",
		JSON.stringify(resultArtists, null, 2),
	);

	await browser.close();
})();
