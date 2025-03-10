import type { Event } from "../components/types";

type FilterOptions = {
	events: Event[];
	viewMode: "floor" | "today";
	selectedFloors: string[];
	showAndroidOnly: boolean;
	showUpcomingOnly: boolean;
	selectedDate?: Date;
};

export const useFilteredEvents = () => {
	const getFilteredEvents = ({
		events,
		viewMode,
		selectedFloors,
		showAndroidOnly,
		showUpcomingOnly,
		selectedDate,
	}: FilterOptions) => {
		const targetDate = selectedDate || new Date();
		const now = new Date();

		// 今日のイベントモードの場合は、showUpcomingOnlyを無視する
		const effectiveShowUpcomingOnly =
			viewMode === "today" ? false : showUpcomingOnly;

		return events
			.filter((event) => {
				if (viewMode === "today") {
					return event.schedules.some(
						(schedule) =>
							schedule.date.year === targetDate.getFullYear() &&
							schedule.date.month === targetDate.getMonth() + 1 &&
							schedule.date.day === targetDate.getDate(),
					);
				}
				return (
					selectedFloors.length === 0 || selectedFloors.includes(event.floor)
				);
			})
			.filter((event) => !showAndroidOnly || event.platform.includes("Android"))
			.filter((event) => {
				if (!effectiveShowUpcomingOnly) return true;

				// 少なくとも1つの未開催のスケジュールがあるイベントのみをフィルタリング
				return event.schedules.some((schedule) => {
					const scheduleDate = new Date(
						schedule.date.year,
						schedule.date.month - 1,
						schedule.date.day,
						schedule.time.hour,
						schedule.time.minute,
					);
					return scheduleDate > now;
				});
			})
			.map((event) => {
				if (viewMode === "today") {
					return {
						...event,
						schedules: event.schedules.filter((schedule) => {
							return (
								schedule.date.year === targetDate.getFullYear() &&
								schedule.date.month === targetDate.getMonth() + 1 &&
								schedule.date.day === targetDate.getDate()
							);
						}),
					};
				}

				if (effectiveShowUpcomingOnly) {
					return {
						...event,
						schedules: event.schedules.filter((schedule) => {
							const scheduleDate = new Date(
								schedule.date.year,
								schedule.date.month - 1,
								schedule.date.day,
								schedule.time.hour,
								schedule.time.minute,
							);
							return scheduleDate > now;
						}),
					};
				}

				return event;
			});
	};

	return { getFilteredEvents };
};
