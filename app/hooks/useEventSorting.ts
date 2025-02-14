import { useCallback } from "react";
import type { Event, Schedule } from "../components/types";

const getScheduleDate = (schedule: Schedule) => {
	const time = Array.isArray(schedule.time) ? schedule.time[0] : schedule.time;
	return new Date(
		schedule.date.year,
		schedule.date.month - 1,
		schedule.date.day,
		time.hour,
		time.minute,
	);
};

const getEarliestSchedule = (event: Event): Schedule | null => {
	if (event.schedules.length === 0) return null;
	return event.schedules.reduce((earliest, current) => {
		const currentDate = getScheduleDate(current);
		if (!earliest) return current;
		return currentDate < getScheduleDate(earliest) ? current : earliest;
	}, event.schedules[0]);
};

export const useEventSorting = () => {
	const sortEventsByEarliestSchedule = useCallback((events: Event[]) => {
		return [...events].sort((a, b) => {
			const aEarliest = getEarliestSchedule(a);
			const bEarliest = getEarliestSchedule(b);

			// スケジュールが空の場合は最後に
			if (!aEarliest || !bEarliest) {
				if (!aEarliest && !bEarliest) return 0;
				if (!aEarliest) return 1;
				if (!bEarliest) return -1;
			}

			// この時点でaEarliestとbEarliestは非null
			const aTime = getScheduleDate(aEarliest).getTime();
			const bTime = getScheduleDate(bEarliest).getTime();
			return aTime - bTime;
		});
	}, []);

	return { sortEventsByEarliestSchedule };
};
