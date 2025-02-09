import { expect, test } from "@playwright/test";

test("トップページが正しく表示される", async ({ page }) => {
	const response = await page.goto("/");
	expect(response?.status()).toBe(200);

	const headers = response?.headers() ?? {};
	expect(headers["x-powered-by"]).toBe("React Router and Hono");

	const contentH1 = await page.textContent("h1");
	expect(contentH1).toBe("イベントカレンダー登録");
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

	// イベントカードが表示されるのを待つ
	await page.waitForSelector('[data-testid="event-card"]');

	// 最初のイベントの最初の予定を選択
	await page.click('[data-testid="schedule-button"]:first-child');

	// 選択した予定の確認画面に遷移する
	await page.click("button:has-text('カレンダーに登録する')");

	// 選択された予定が表示されることを確認
	await page.waitForSelector('[data-testid="selected-schedules"]');
	const selectedSchedules = await page.$$(
		'[data-testid="selected-schedule-item"]',
	);
	const selectedCount = selectedSchedules.length;
	expect(selectedCount).toBeGreaterThan(0);

	// 「カレンダーに登録する」ボタンをクリック
	await page.click(`button:has-text('カレンダーに登録する')`);

	if (errors.length > 0) {
		console.log("Console Errors:", errors.join("\n"));
	}

	// ICSファイルのダウンロードボタンをクリック
	const downloadPromise = page.waitForEvent("download");
	await page.click("button:has-text('カレンダーに登録する')");
	const download = await downloadPromise;

	// ダウンロードされたファイル名を確認
	expect(download.suggestedFilename()).toBe("events.ics");
});

test("イベントを選択してキャンセル用ICSファイルをダウンロードできる", async ({
	page,
}) => {
	// トップページにアクセス
	const response = await page.goto("/");
	expect(response?.status()).toBe(200);

	// イベントカードが表示されるのを待つ
	await page.waitForSelector('[data-testid="event-card"]');

	// 最初のイベントの最初の予定を選択
	await page.click('[data-testid="schedule-button"]:first-child');

	// 選択した予定の確認画面に遷移する
	await page.click("button:has-text('カレンダーに登録する')");

	// 選択された予定が表示されることを確認
	await page.waitForSelector('[data-testid="selected-schedules"]');
	const selectedSchedules = await page.$$(
		'[data-testid="selected-schedule-item"]',
	);
	const selectedCount = selectedSchedules.length;
	expect(selectedCount).toBeGreaterThan(0);

	// 「カレンダーに登録する」ボタンをクリック
	await page.click(`button:has-text('カレンダーに登録する')`);

	// consoleにエラーが出ていればエラーを出力
	const errors: string[] = [];
	page.on("console", (msg) => {
		if (msg.type() === "error") {
			errors.push(`Console ${msg.type()}: ${msg.text()}`);
		}
	});
	if (errors.length > 0) {
		console.log("Console Errors:", errors.join("\n"));
	}

	// キャンセル用ICSファイルのダウンロードボタンをクリック
	const downloadPromise = page.waitForEvent("download");
	await page.click("button:has-text('キャンセル用ICSをダウンロード')");
	const download = await downloadPromise;

	// ダウンロードされたファイル名を確認
	expect(download.suggestedFilename()).toBe("cancel_events.ics");
});
