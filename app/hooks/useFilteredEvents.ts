import type { Event } from "../components/types";

type FilterOptions = {
	events: Event[];
	viewMode: "floor" | "today";
	selectedFloors: string[];
	showAndroidOnly: boolean;
	selectedDate?: Date;
};

export const useFilteredEvents = () => {
	const getFilteredEvents = ({
		events,
		viewMode,
		selectedFloors,
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
				return (
					selectedFloors.length === 0 || selectedFloors.includes(event.floor)
				);
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
