import type { Event, SelectedSchedule } from "./types";
import { Button } from "./ui/button";

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
		<Button
			type="button"
			onClick={handleBulkToggle}
			variant="outline"
			size="sm"
			className="border-custom-pink text-custom-pink hover:bg-pink-50 hover:text-custom-pink"
		>
			{isAllSelected ? "すべて解除" : "すべて選択"}
		</Button>
	);
}
