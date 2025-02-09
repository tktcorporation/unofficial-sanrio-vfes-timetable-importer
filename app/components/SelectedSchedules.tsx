import type { Event, EventKey, SelectedSchedule } from "app/components/types";
import { createEventKey, type parseEventKey } from "app/components/types";
import type { DateInfo, TimeInfo } from "app/components/types";
import { useEffect, useMemo, useState } from "react";
import { calculateEndTime } from "utils/date";
import { getEvents } from "~/client";
import type { CalendarEvent, DateTime } from "../../server/controller";

interface SelectedSchedulesProps {
	selectedSchedules: SelectedSchedule[];
}

interface GroupedSchedules {
	event: Event;
	schedules: SelectedSchedule[];
}

const formatForDisplay = (
	schedule: SelectedSchedule,
): {
	date: string;
	time: string;
} => ({
	date: `${schedule.schedule.date.month}月${schedule.schedule.date.day}日`,
	time: `${schedule.schedule.time.hour.toString().padStart(2, "0")}:${schedule.schedule.time.minute.toString().padStart(2, "0")}`,
});

export function SelectedSchedules({
	selectedSchedules,
}: SelectedSchedulesProps) {
	const [events, setEvents] = useState<Event[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		getEvents()
			.then(setEvents)
			.finally(() => setIsLoading(false));
	}, []);

	const groupedSchedules = useMemo(() => {
		const groups = new Map<string, GroupedSchedules>();

		for (const schedule of selectedSchedules) {
			const event = events.find((e) => e.uid === schedule.uid);
			if (!event) continue;

			const group = groups.get(event.uid) || {
				event,
				schedules: [],
			};
			group.schedules.push(schedule);
			groups.set(event.uid, group);
		}

		return groups;
	}, [events, selectedSchedules]);

	return (
		<div className="mb-8">
			<h2 className="text-2xl font-bold mb-4 text-black">選択したイベント</h2>
			<p className="text-sm text-gray-500 mb-4">※ 日時はJSTです</p>
			{isLoading ? (
				<div className="text-gray-500">読み込み中...</div>
			) : (
				<div
					className="grid grid-cols-1 md:grid-cols-2 gap-4"
					data-testid="selected-schedules"
				>
					{Array.from(groupedSchedules.values()).map(({ event, schedules }) => (
						<div
							key={event.uid}
							className="bg-white p-4 rounded-lg flex gap-4 items-start"
							data-testid="selected-schedule-item"
						>
							<img
								src={event.image}
								alt={event.title}
								className="w-24 h-24 object-cover rounded-md"
							/>
							<div className="flex-1 flex flex-col gap-1">
								<span className="font-medium text-base">{event.title}</span>
								<div className="flex flex-wrap gap-1">
									{schedules
										.sort((a: SelectedSchedule, b: SelectedSchedule) => {
											const dateA = `${String(a.schedule.date.month).padStart(2, "0")}/${String(a.schedule.date.day).padStart(2, "0")}`;
											const dateB = `${String(b.schedule.date.month).padStart(2, "0")}/${String(b.schedule.date.day).padStart(2, "0")}`;
											if (dateA !== dateB) return dateA.localeCompare(dateB);

											const timeA = `${String(a.schedule.time.hour).padStart(2, "0")}:${String(a.schedule.time.minute).padStart(2, "0")}`;
											const timeB = `${String(b.schedule.time.hour).padStart(2, "0")}:${String(b.schedule.time.minute).padStart(2, "0")}`;
											return timeA.localeCompare(timeB);
										})
										.map((schedule) => {
											const formatted = formatForDisplay(schedule);
											return (
												<span
													key={`${schedule.schedule.date.month}-${schedule.schedule.date.day}-${schedule.schedule.time.hour}-${schedule.schedule.time.minute}`}
													className="text-gray-500 text-sm bg-gray-50 px-2 py-1 rounded-md"
												>
													{`${formatted.date} ${formatted.time}`}
												</span>
											);
										})}
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
