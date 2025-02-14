import type { Event, SelectedSchedule } from "./types";

type BulkSelectButtonProps = {
	filteredEvents: Event[];
	selectedSchedules: SelectedSchedule[];
	onBulkToggle: (schedules: SelectedSchedule[]) => void;
};

export function BulkSelectButton({
	filteredEvents,
	selectedSchedules,
	onBulkToggle,
}: BulkSelectButtonProps) {
	const getAllSchedulesCount = () => {
		return filteredEvents.flatMap((e) => e.schedules).length;
	};

	const handleBulkToggle = () => {
		const allSchedules = filteredEvents.flatMap((event) =>
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
