import LZString from "lz-string";
import type { SelectedSchedule } from "../components/types";

const BASE_YEAR = 2024;
const BASE_JULIAN = Date.UTC(BASE_YEAR, 0, 1) / 86400000 + 2440587.5;

interface Date {
	year: number;
	month: number;
	day: number;
}

interface Time {
	hour: number;
	minute: number;
}

interface CompressedSchedule {
	uid: string;
	schedule: {
		date: Date;
		time: Time;
	};
}

export const dateToJulian = (date: Date): number => {
	const utcDate = Date.UTC(date.year, date.month - 1, date.day);
	return Math.floor(utcDate / 86400000 + 2440587.5 - BASE_JULIAN);
};

export const julianToDate = (julian: number): Date => {
	const utc = (julian + BASE_JULIAN - 2440587.5) * 86400000;
	const date = new Date(utc);
	return {
		year: date.getUTCFullYear(),
		month: date.getUTCMonth() + 1,
		day: date.getUTCDate(),
	};
};

export const encodeBinaryData = (schedules: number[][]): string => {
	const buffer = new Uint16Array(schedules.flat());
	return String.fromCharCode(...buffer);
};

export const decodeBinaryData = (binaryStr: string): number[][] => {
	const numbers: number[] = [];
	for (let i = 0; i < binaryStr.length; i++) {
		numbers.push(binaryStr.charCodeAt(i));
	}
	return Array.from({ length: numbers.length / 3 }, (_, i) =>
		numbers.slice(i * 3, i * 3 + 3),
	);
};

export const compressSchedules = ({
	schedules,
}: {
	schedules: SelectedSchedule[];
}): string => {
	const binaryData = schedules.map((schedule) => {
		const date = schedule.schedule.date;
		const time = schedule.schedule.time;
		return [
			Number.parseInt(schedule.uid.slice(0, 3), 36), // 3文字をbase36数値に変換
			dateToJulian(date),
			time.hour * 60 + time.minute, // 時間を分単位に変換
		];
	});

	const binaryString = encodeBinaryData(binaryData);
	return LZString.compressToEncodedURIComponent(binaryString);
};

export const decompressSchedules = ({
	compressed,
	events,
}: {
	compressed: string;
	events: { uid: string }[];
}): CompressedSchedule[] => {
	const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
	if (!decompressed) throw new Error("無効な圧縮データです");

	const decoded = decodeBinaryData(decompressed);
	return decoded.map(([uidNum, julianDay, totalMinutes]) => {
		const shortUid = uidNum.toString(36).padStart(3, "0");
		const fullEvents = events.filter((e) => e.uid.startsWith(shortUid));

		if (fullEvents.length === 0) {
			throw new Error(`該当するイベントが見つかりません: ${shortUid}`);
		}
		if (fullEvents.length > 1) {
			console.warn(`短縮IDが重複しています: ${shortUid}`);
		}

		const date = julianToDate(julianDay);
		return {
			uid: fullEvents[0].uid,
			schedule: {
				date,
				time: {
					hour: Math.floor(totalMinutes / 60),
					minute: totalMinutes % 60,
				},
			},
		};
	});
};

export const generateShareUrl = ({
	url,
	schedules,
}: {
	url: URL;
	schedules: SelectedSchedule[];
}): string => {
	const compressed = compressSchedules({ schedules });
	url.searchParams.set("schedules", compressed);
	return url.toString();
};
