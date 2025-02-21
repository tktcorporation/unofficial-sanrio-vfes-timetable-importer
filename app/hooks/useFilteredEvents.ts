import type { Event } from "../components/types";

type FilterOptions = {
	events: Event[];
	viewMode: "floor" | "today";
	selectedFloor: string;
	showAndroidOnly: boolean;
	selectedDate?: Date;
};

export const useFilteredEvents = () => {
	const getFilteredEvents = ({
		events,
		viewMode,
		selectedFloor,
		showAndroidOnly,
		selectedDate,
	}: FilterOptions) => {
		const targetDate = selectedDate || new Date();
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
				return event.floor === selectedFloor;
			})
			.filter((event) => !showAndroidOnly || event.platform.includes("Android"))
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
				return event;
			});
	};

	return { getFilteredEvents };
};
