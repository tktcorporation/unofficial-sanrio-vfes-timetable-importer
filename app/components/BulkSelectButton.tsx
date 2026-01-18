import { cn } from "../lib/utils";
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
			className={cn(
				"rounded-xl font-semibold",
				isAllSelected
					? "border-kawaii-mint bg-kawaii-mint-light text-kawaii-mint"
					: "border-kawaii-pink-light text-kawaii-pink hover:bg-kawaii-pink-light hover:border-kawaii-pink",
			)}
		>
			{isAllSelected ? "すべて解除" : "すべて選択"}
		</Button>
	);
}
