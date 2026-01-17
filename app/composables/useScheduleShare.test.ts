import { EVENTS } from "server/constants";
import { describe, expect, it } from "vitest";
import {
	compressSchedules,
	dateToJulian,
	decodeBinaryData,
	decompressSchedules,
	encodeBinaryData,
	julianToDate,
} from "./useScheduleShare";

function assertDefined<T>(value: T | undefined): asserts value is T {
	expect(value).toBeDefined();
}

describe("useScheduleShare", () => {
	describe("日付変換", () => {
		it("dateToJulian と julianToDate が相互に変換できること", () => {
			const testDate = {
				year: 2024,
				month: 3,
				day: 15,
			};

			const julian = dateToJulian(testDate);
			const convertedDate = julianToDate(julian);

			expect(convertedDate).toEqual(testDate);
		});

		it("異なる日付で正しく変換できること", () => {
			const testCases = [
				{ year: 2024, month: 1, day: 1 },
				{ year: 2024, month: 12, day: 31 },
				{ year: 2025, month: 6, day: 15 },
			];

			for (const date of testCases) {
				const julian = dateToJulian(date);
				const converted = julianToDate(julian);
				expect(converted).toEqual(date);
			}
		});
	});

	describe("バイナリデータ変換", () => {
		it("encodeBinaryData と decodeBinaryData が相互に変換できること", () => {
			const testData = [
				[1000, 74, 120],
				[2000, 75, 240],
			];

			const encoded = encodeBinaryData(testData);
			const decoded = decodeBinaryData(encoded);

			expect(decoded).toEqual(testData);
		});
	});

	describe("スケジュール圧縮", () => {
		const mockSchedules = [
			{
				uid: "abc123",
				schedule: {
					date: { year: 2024, month: 3, day: 15 },
					time: { hour: 13, minute: 30 },
				},
			},
		];

		it("スケジュールを圧縮できること", () => {
			const compressed = compressSchedules({ schedules: mockSchedules });
			expect(typeof compressed).toBe("string");
			expect(compressed.length).toBeGreaterThan(0);
		});

		it("圧縮したスケジュールを展開できること", () => {
			const compressed = compressSchedules({ schedules: mockSchedules });
			const mockEvents = [{ uid: "abc123" }];

			const decompressed = decompressSchedules({
				compressed,
				events: mockEvents,
			});

			expect(decompressed[0]).toEqual({
				uid: "abc123",
				schedule: {
					date: { year: 2024, month: 3, day: 15 },
					time: { hour: 13, minute: 30 },
				},
			});
		});

		it("無効な圧縮データでエラーを投げること", () => {
			const mockEvents = [{ uid: "abc123" }];
			expect(() => {
				decompressSchedules({ compressed: "invalid-data", events: mockEvents });
			}).toThrow("無効な圧縮データです");
		});

		it("存在しないイベントIDでエラーを投げること", () => {
			const compressed = compressSchedules({ schedules: mockSchedules });
			const mockEvents = [{ uid: "xyz789" }];

			expect(() => {
				decompressSchedules({ compressed, events: mockEvents });
			}).toThrow("該当するイベントが見つかりません");
		});
	});

	describe("実際のデータでテスト", () => {
		it("AMOKAのデータが正しく圧縮できること", () => {
			const events = EVENTS;
			const AMOKA = events.find(
				(e) => e.uid === "66525903-6fd3-5bab-a399-0731773e8cd7",
			);
			assertDefined(AMOKA);
			expect(AMOKA).toMatchSnapshot();

			const schedules = AMOKA.schedules.map((s) => ({
				uid: AMOKA.uid,
				schedule: {
					date: {
						year: Number(s.year),
						month: Number(s.date.month),
						day: Number(s.date.day),
					},
					time: {
						hour: Number(s.time.hour),
						minute: Number(s.time.minute),
					},
				},
			}));

			expect(schedules).toMatchSnapshot();

			const compressed = compressSchedules({ schedules });
			expect(compressed).toMatchSnapshot();

			const decompressed = decompressSchedules({ compressed, events });
			expect(decompressed).toMatchSnapshot();

			expect(decompressed.length).toBe(schedules.length);
			expect(decompressed).toEqual(schedules);
		});
	});
});
