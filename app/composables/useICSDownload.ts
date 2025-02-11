import { generateCancelICS, generateICS } from "app/client";
import type { SelectedSchedule } from "app/components/types";
import { useState } from "react";
import { ICS_FILE_NAMES } from "../../server/controller";

export function useICSDownload() {
	const [isLoading, setIsLoading] = useState(false);

	const downloadICS = async (selectedSchedules: SelectedSchedule[]) => {
		setIsLoading(true);
		try {
			const selectedEvents = selectedSchedules.map((schedule) => ({
				uid: schedule.uid,
				startDateTime: {
					year: String(schedule.schedule.date.year),
					month: String(schedule.schedule.date.month),
					day: String(schedule.schedule.date.day),
					hour: String(schedule.schedule.time.hour),
					minute: String(schedule.schedule.time.minute),
				},
			}));

			const blob = await generateICS(selectedEvents);
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = ICS_FILE_NAMES.EVENTS;

			document.body.appendChild(link);
			link.click();

			setTimeout(() => {
				window.URL.revokeObjectURL(url);
				document.body.removeChild(link);
			}, 100);

			return { success: true };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "ICSファイルの生成に失敗しました。",
			};
		} finally {
			setIsLoading(false);
		}
	};

	const downloadCancelICS = async (selectedSchedules: SelectedSchedule[]) => {
		setIsLoading(true);
		try {
			const selectedEvents = selectedSchedules.map((schedule) => ({
				uid: schedule.uid,
				startDateTime: {
					year: String(schedule.schedule.date.year),
					month: String(schedule.schedule.date.month),
					day: String(schedule.schedule.date.day),
					hour: String(schedule.schedule.time.hour),
					minute: String(schedule.schedule.time.minute),
				},
			}));

			const blob = await generateCancelICS(selectedEvents);
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = ICS_FILE_NAMES.CANCEL_EVENTS;

			document.body.appendChild(link);
			link.click();

			setTimeout(() => {
				window.URL.revokeObjectURL(url);
				document.body.removeChild(link);
			}, 100);

			return { success: true };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "キャンセル用ICSファイルの生成に失敗しました。",
			};
		} finally {
			setIsLoading(false);
		}
	};

	return {
		isLoading,
		downloadICS,
		downloadCancelICS,
	};
}
