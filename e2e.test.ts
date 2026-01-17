import type { Readable } from "node:stream";
import { expect, test } from "@playwright/test";

test("トップページが正しく表示される", async ({ page }) => {
	const response = await page.goto("/");
	expect(response?.status()).toBe(200);

	const headers = response?.headers() ?? {};
	expect(headers["x-powered-by"]).toBe("React Router and Hono");

	const contentH1 = await page.textContent("h1");
	expect(contentH1).toBe("サンリオVfes 2026 をカレンダー登録！");
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

	// イベント一覧を表示
	await page.click("button:has-text('イベント一覧')");
	await page.click("label:has-text('未開催のみ')");

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
	// 2026/2/8 21:30 JST = 20260208T123000Z (UTC)
	// 2026/2/13 21:30 JST = 20260213T123000Z (UTC)
	const expectedIcsPattern = String.raw`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//sanrio-vfes-timetable-importer//JP
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:66525903-6fd3-5bab-a399-0731773e8cd7-20260208T123000Z_20260208T130000Z@sanrio-vfes-timetable-importer
DTSTAMP:\d{8}T\d{6}Z
STATUS:CONFIRMED
SUMMARY:\[サンリオVfes\] AMOKA \[PC\]
DTSTART:20260208T123000Z
DTEND:20260208T130000Z
DESCRIPTION:サンリオVfes2026\\nアーティスト名: AMOKA\\nフロア: その他\\nプラットフォーム: PC\\n\\n詳しくは: https://v-fes.sanrio.co.jp/artist/AMOKA
TRANSP:OPAQUE
END:VEVENT
BEGIN:VEVENT
UID:66525903-6fd3-5bab-a399-0731773e8cd7-20260213T123000Z_20260213T130000Z@sanrio-vfes-timetable-importer
DTSTAMP:\d{8}T\d{6}Z
STATUS:CONFIRMED
SUMMARY:\[サンリオVfes\] AMOKA \[PC\]
DTSTART:20260213T123000Z
DTEND:20260213T130000Z
DESCRIPTION:サンリオVfes2026\\nアーティスト名: AMOKA\\nフロア: その他\\nプラットフォーム: PC\\n\\n詳しくは: https://v-fes.sanrio.co.jp/artist/AMOKA
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;
	const pattern = new RegExp(expectedIcsPattern, "ms");
	await expect(contentString).toMatch(pattern);
});

test("イベント一覧から予定を選択してカレンダー登録画面に遷移できる", async ({
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

	// トップページにアクセス
	const response = await page.goto("/");
	expect(response?.status()).toBe(200);

	// イベント一覧を表示
	await page.click("button:has-text('イベント一覧')");
	await page.click("label:has-text('未開催のみ')");

	// イベントカードが表示されるのを待つ
	await page.waitForSelector('[data-testid="event-card"]');

	// 新しい予定を選択
	await page.click('[data-testid="schedule-button"]:nth-child(1)');

	// 選択した予定の確認画面に遷移する
	await page.click("button:has-text('カレンダーに登録')");

	// 選択された予定が表示されていることを確認
	await page.waitForSelector('[data-testid="selected-schedules"]');
	await page.waitForSelector('[data-testid="selected-schedule-item-date"]');
	const selectedSchedules = await page.$$(
		'[data-testid="selected-schedule-item"]',
	);
	expect(selectedSchedules.length).toBeGreaterThan(0);

	// ICSファイルのダウンロードボタンをクリック
	const downloadPromise = page.waitForEvent("download");
	await page.click("button:has-text('カレンダーに登録')");
	const download = await downloadPromise;

	// ダウンロードされたファイル名を確認
	expect(download.suggestedFilename()).toBe("sanrio-vfes-events.ics");
});

test("「すべて選択」ボタンをクリックすると表示中のすべての予定が選択される", async ({
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

	// トップページにアクセス
	const response = await page.goto("/");
	expect(response?.status()).toBe(200);

	// イベント一覧を表示
	await page.click("button:has-text('イベント一覧')");
	await page.click("label:has-text('未開催のみ')");

	// イベントカードが表示されるのを待つ
	await page.waitForSelector('[data-testid="event-card"]');

	// 「すべて選択」ボタンをクリック
	await page.click("button:has-text('すべて選択')");

	// 選択した予定の確認画面に遷移する
	await page.click("button:has-text('件をカレンダーに登録')");

	// 選択された予定が表示されることを確認
	await page.waitForSelector('[data-testid="selected-schedules"]');
	await page.waitForSelector('[data-testid="selected-schedule-item-date"]');
	const selectedSchedules = await page.$$(
		'[data-testid="selected-schedule-item"]',
	);
	// 2026年のイベントは27アーティスト
	expect(selectedSchedules.length).toBe(27);
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
