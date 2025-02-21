import type { Readable } from "node:stream";
import { expect, test } from "@playwright/test";

test("トップページが正しく表示される", async ({ page }) => {
	const response = await page.goto("/");
	expect(response?.status()).toBe(200);

	const headers = response?.headers() ?? {};
	expect(headers["x-powered-by"]).toBe("React Router and Hono");

	const contentH1 = await page.textContent("h1");
	expect(contentH1).toBe("サンリオVfes 2025 をカレンダー登録！");
});

test("APIエンドポイントが正しく動作する", async ({ page }) => {
	const response = await page.goto("/api");
	expect(response?.status()).toBe(200);
	expect(await response?.json()).toEqual({ message: "Hello", var: "My Value" });
});

test("イベントを選択してICSファイルをダウンロードできる", async ({ page }) => {
	// consoleにエラーが出ていればエラーを出力
	const errors: string[] = [];
	page.on("console", (msg) => {
		if (msg.type() === "error") {
			errors.push(`Console ${msg.type()}: ${msg.text()}`);
		}
		console.log(msg.text());
	});

	// トップページにアクセス
	const response = await page.goto("/");
	expect(response?.status()).toBe(200);

	// B4Fのタブへ移動
	await page.click("button:has-text('B4F')");

	// イベントカードが表示されるのを待つ
	await page.waitForSelector('[data-testid="event-card"]');

	// 最初のイベントの最初の予定を選択
	await page.click('[data-testid="schedule-button"]:first-child');
	// 最初のイベントの2つ目の予定を選択
	await page.click('[data-testid="schedule-button"]:nth-child(2)');

	// 選択した予定の確認画面に遷移する
	await page.click("button:has-text('2件をカレンダーに登録')");

	// 選択された予定が表示されることを確認
	await page.waitForSelector('[data-testid="selected-schedules"]');
	const selectedSchedules = await page.$$(
		'[data-testid="selected-schedule-item"]',
	);
	const selectedCount = selectedSchedules.length;
	expect(selectedCount).toBeGreaterThan(0);

	// 「カレンダーに登録」ボタンをクリック
	await page.click(`button:has-text('カレンダーに登録')`);

	// ICSファイルのダウンロードボタンをクリック
	const downloadPromise = page.waitForEvent("download");
	await page.click("button:has-text('カレンダーに登録')");
	const download = await downloadPromise;

	// ダウンロードされたファイル名を確認
	expect(download.suggestedFilename()).toBe("sanrio-vfes-events.ics");
	// ファイルの内容をsnapshot
	const content = await download.createReadStream();
	const contentString = await streamToString(content);
	// 特殊文字をエスケープしつつ、DTSTAMPのみパターンマッチングを行う
	const expectedIcsPattern = String.raw`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//sanrio-vfes-timetable-importer//JP
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:7396ef07-e6f5-5611-9a37-7f2a22233dc4-20250209T103000Z_20250209T110000Z@sanrio-vfes-timetable-importer
DTSTAMP:\d{8}T\d{6}Z
STATUS:CONFIRMED
SUMMARY:\[サンリオVfes\] AMOKA \[PC\]
DTSTART:20250209T103000Z
DTEND:20250209T110000Z
DESCRIPTION:サンリオVfes2025\\nアーティスト名: AMOKA\\nフロア: B4F\\nプラットフォーム: PC\\n\\n詳しくは: https://v-fes.sanrio.co.jp/artist/amoka
TRANSP:OPAQUE
END:VEVENT
BEGIN:VEVENT
UID:7396ef07-e6f5-5611-9a37-7f2a22233dc4-20250308T043000Z_20250308T050000Z@sanrio-vfes-timetable-importer
DTSTAMP:\d{8}T\d{6}Z
STATUS:CONFIRMED
SUMMARY:\[サンリオVfes\] AMOKA \[PC\]
DTSTART:20250308T043000Z
DTEND:20250308T050000Z
DESCRIPTION:サンリオVfes2025\\nアーティスト名: AMOKA\\nフロア: B4F\\nプラットフォーム: PC\\n\\n詳しくは: https://v-fes.sanrio.co.jp/artist/amoka
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;
	const pattern = new RegExp(expectedIcsPattern, "ms");
	await expect(contentString).toMatch(pattern);
});

test("共有URLから予定を読み込んだ後に予定を調整できる", async ({ page }) => {
	// consoleにエラーが出ていればエラーを出力
	const errors: string[] = [];
	page.on("console", (msg) => {
		if (msg.type() === "error") {
			errors.push(`Console ${msg.type()}: ${msg.text()}`);
		}
		console.log(msg.text());
	});

	// 共有URLにアクセス
	const response = await page.goto(
		"/?schedules=jz4lTARzIMgNgIZsDIHYCD-AQG%2BwkA0gTKAlgJdAHgEA",
	);
	expect(response?.status()).toBe(200);

	// 共有された予定が読み込まれたことを確認
	await page.waitForSelector('[data-testid="selected-schedules"]');
	await page.waitForSelector('[data-testid="selected-schedule-item-date"]');

	// タイトルでグループ化されている数
	const initialSelectedSchedules = await page.$$(
		'[data-testid="selected-schedule-item"]',
	);
	const initialSelectedCount = initialSelectedSchedules.length;
	expect(initialSelectedCount).toBe(2);

	// タイトル * 日付
	const initialSelectedDates = await page.$$(
		'[data-testid="selected-schedule-item-date"]',
	);
	const initialSelectedDatesCount = initialSelectedDates.length;
	expect(initialSelectedDatesCount).toBe(6);

	// 「戻る」ボタンをクリック
	await page.click("button:has-text('戻る')");

	// B4Fのタブへ移動
	await page.click("button:has-text('B4F')");

	// イベント選択画面に戻ることを確認
	await page.waitForSelector('[data-testid="event-card"]');

	// 新しい予定を追加で選択
	await page.click('[data-testid="schedule-button"]:nth-child(1)');

	// 選択した予定の確認画面に遷移する
	await page.click("button:has-text('カレンダーに登録')");

	// 選択された予定が更新されていることを確認
	await page.waitForSelector('[data-testid="selected-schedules"]');
	await page.waitForSelector('[data-testid="selected-schedule-item-date"]');
	const updatedSelectedSchedules = await page.$$(
		'[data-testid="selected-schedule-item"]',
	);
	const updatedSelectedCount = updatedSelectedSchedules.length;
	expect(updatedSelectedCount).toBe(initialSelectedCount + 1);

	// タイトル * 日付
	const updatedSelectedDates = await page.$$(
		'[data-testid="selected-schedule-item-date"]',
	);
	const updatedSelectedDatesCount = updatedSelectedDates.length;
	expect(updatedSelectedDatesCount).toBe(initialSelectedDatesCount + 1);

	// ICSファイルのダウンロードボタンをクリック
	const downloadPromise = page.waitForEvent("download");
	await page.click("button:has-text('カレンダーに登録')");
	const download = await downloadPromise;

	// ダウンロードされたファイル名を確認
	expect(download.suggestedFilename()).toBe("sanrio-vfes-events.ics");
	// ファイルに (UID:.+)の行が initialSelectedDatesCount + 1 個含まれていることを確認
	const content = await download.createReadStream();
	const contentString = await streamToString(content);
	const uidCount = (contentString.match(/UID:.+/g) || []).length;
	expect(uidCount).toBe(initialSelectedDatesCount + 1);
});

test("Android対応でフィルタした後に「すべて選択」ボタンをクリックすると、Android対応の予定のみが選択される", async ({
	page,
}) => {
	// consoleにエラーが出ていればエラーを出力
	const errors: string[] = [];
	page.on("console", (msg) => {
		if (msg.type() === "error") {
			errors.push(`Console ${msg.type()}: ${msg.text()}`);
		}
		console.log(msg.text());
	});

	// 共有URLにアクセス
	const response = await page.goto("/");
	expect(response?.status()).toBe(200);

	// B4Fのタブへ移動
	await page.click("button:has-text('B4F')");

	// イベントカードが表示されるのを待つ
	await page.waitForSelector('[data-testid="event-card"]');

	// Android対応のみにフィルタリング
	await page.click("label:has-text('Android対応')");

	// 「すべて選択」ボタンをクリック
	await page.click("button:has-text('すべて選択')");

	// 選択した予定の確認画面に遷移する
	await page.click("button:has-text('9件をカレンダーに登録')");

	// 選択された予定が表示されることを確認
	await page.waitForSelector('[data-testid="selected-schedules"]');
	await page.waitForSelector('[data-testid="selected-schedule-item-date"]');
	const selectedSchedules = await page.$$(
		'[data-testid="selected-schedule-item"]',
	);
	const selectedCount = selectedSchedules.length;
	expect(selectedCount).toBe(3);
});

const streamToString = async (stream: Readable): Promise<string> => {
	const chunks: Buffer[] = [];
	for await (const chunk of stream) {
		chunks.push(Buffer.from(chunk));
	}
	return Buffer.concat(chunks).toString("utf-8");
};

// test("イベントを選択してキャンセル用ICSファイルをダウンロードできる", async ({
// 	page,
// }) => {
// 	// トップページにアクセス
// 	const response = await page.goto("/");
// 	expect(response?.status()).toBe(200);

// 	// イベントカードが表示されるのを待つ
// 	await page.waitForSelector('[data-testid="event-card"]');

// 	// 最初のイベントの最初の予定を選択
// 	await page.click('[data-testid="schedule-button"]:first-child');

// 	// 選択した予定の確認画面に遷移する
// 	await page.click("button:has-text('カレンダーに登録')");

// 	// 選択された予定が表示されることを確認
// 	await page.waitForSelector('[data-testid="selected-schedules"]');
// 	const selectedSchedules = await page.$$(
// 		'[data-testid="selected-schedule-item"]',
// 	);
// 	const selectedCount = selectedSchedules.length;
// 	expect(selectedCount).toBeGreaterThan(0);

// 	// consoleにエラーが出ていればエラーを出力
// 	const errors: string[] = [];
// 	page.on("console", (msg) => {
// 		if (msg.type() === "error") {
// 			errors.push(`Console ${msg.type()}: ${msg.text()}`);
// 		}
// 	});
// 	if (errors.length > 0) {
// 		console.log("Console Errors:", errors.join("\n"));
// 	}

// 	// キャンセル用ICSファイルのダウンロードボタンをクリック
// 	const downloadPromise = page.waitForEvent("download");
// 	await page.click("button:has-text('キャンセル用ICS')");
// 	const download = await downloadPromise;

// 	// ダウンロードされたファイル名を確認
// 	expect(download.suggestedFilename()).toBe("sanrio-vfes-events-cancel.ics");
// });
