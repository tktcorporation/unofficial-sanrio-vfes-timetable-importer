import type { Event, SelectedSchedule } from "./types";

type BulkSelectButtonProps = {
	events: Event[];
	selectedSchedules: SelectedSchedule[];
	viewMode: "floor" | "today";
	selectedFloor: string;
	showAndroidOnly: boolean;
	onBulkToggle: (schedules: SelectedSchedule[]) => void;
};

export function BulkSelectButton({
	events,
	selectedSchedules,
	viewMode,
	selectedFloor,
	showAndroidOnly,
	onBulkToggle,
}: BulkSelectButtonProps) {
	const getFilteredEvents = () => {
		const today = new Date();
		return events
			.filter((event) => {
				if (viewMode === "today") {
					return event.schedules.some(
						(schedule) =>
							schedule.date.year === today.getFullYear() &&
							schedule.date.month === today.getMonth() + 1 &&
							schedule.date.day === today.getDate(),
					);
				}
				return event.floor === selectedFloor;
			})
			.filter(
				(event) => !showAndroidOnly || event.platform.includes("Android"),
			);
	};

	const getAllSchedulesCount = () => {
		return getFilteredEvents().flatMap((e) => e.schedules).length;
	};

	const handleBulkToggle = () => {
		const allSchedules = getFilteredEvents().flatMap((event) =>
			event.schedules.map((schedule) => ({
				uid: event.uid,
				schedule: {
					date: schedule.date,
					time: schedule.time,
				},
			})),
		);
		onBulkToggle(allSchedules);
	};

	const isAllSelected = selectedSchedules.length === getAllSchedulesCount();

	return (
		<button
			type="button"
			onClick={handleBulkToggle}
			className="border border-custom-pink text-xs px-3 py-1 bg-white text-custom-pink rounded-md transition-colors"
		>
			{isAllSelected ? "すべて解除" : "すべて選択"}
		</button>
	);
}
