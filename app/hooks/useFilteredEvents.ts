import type { Event } from "../components/types";

type FilterOptions = {
	events: Event[];
	viewMode: "floor" | "today";
	selectedFloor: string;
	showAndroidOnly: boolean;
};

export const useFilteredEvents = () => {
	const getFilteredEvents = ({
		events,
		viewMode,
		selectedFloor,
		showAndroidOnly,
	}: FilterOptions) => {
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
			.filter((event) => !showAndroidOnly || event.platform.includes("Android"))
			.map((event) => {
				if (viewMode === "today") {
					return {
						...event,
						schedules: event.schedules.filter((schedule) => {
							const today = new Date();
							return (
								schedule.date.year === today.getFullYear() &&
								schedule.date.month === today.getMonth() + 1 &&
								schedule.date.day === today.getDate()
							);
						}),
					};
				}
				return event;
			});
	};

	return { getFilteredEvents };
};
