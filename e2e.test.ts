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
	// ファイルの内容を検証
	const content = await download.createReadStream();
	const contentString = await streamToString(content);
	// ICS形式の基本構造を検証
	expect(contentString).toContain("BEGIN:VCALENDAR");
	expect(contentString).toContain("VERSION:2.0");
	expect(contentString).toContain("PRODID:-//sanrio-vfes-timetable-importer//JP");
	expect(contentString).toContain("BEGIN:VEVENT");
	expect(contentString).toContain("SUMMARY:[サンリオVfes]");
	expect(contentString).toContain("DESCRIPTION:サンリオVfes2026");
	expect(contentString).toContain("END:VEVENT");
	expect(contentString).toContain("END:VCALENDAR");
	// 2つのイベントが含まれていることを確認
	const eventCount = (contentString.match(/BEGIN:VEVENT/g) || []).length;
	expect(eventCount).toBe(2);
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
