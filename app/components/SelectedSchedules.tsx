import type { Event, EventKey, SelectedSchedule } from "app/components/types";
import { createEventKey, type parseEventKey } from "app/components/types";
import type { DateInfo, TimeInfo } from "app/components/types";
import { useEffect, useState, useMemo } from "react";
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
	time: `${schedule.schedule.time.hour}:${schedule.schedule.time.minute}`,
});

export function SelectedSchedules({
	selectedSchedules,
}: SelectedSchedulesProps) {
	const [events, setEvents] = useState<Event[]>([]);

	useEffect(() => {
		getEvents().then((events) =>
			setEvents(
				events.map((event) => ({
					...event,
					schedules: event.schedules.map((schedule) => ({
						...schedule,
						date: {
							...schedule.date,
							year: Number(schedule.year),
							month: Number(schedule.date.month),
							day: Number(schedule.date.day),
						},
						time: {
							...schedule.time,
							hour: Number(schedule.time.hour),
							minute: Number(schedule.time.minute),
						},
					})),
				})),
			),
		);
	}, []);

	// イベントごとにスケジュールをグループ化
	const groupedSchedules = useMemo(() => {
		return selectedSchedules.reduce((groups, schedule) => {
			const eventKey = schedule.uid
			const event = events.find((e) => e.uid === eventKey);

			if (!event) return groups;

			if (!groups.has(eventKey)) {
				groups.set(eventKey, { event, schedules: [] });
			}
			groups.get(eventKey)?.schedules.push(schedule);
			return groups;
		}, new Map<string, GroupedSchedules>());
	}, [events, selectedSchedules]);

	return (
		<div
			data-testid="selected-schedules"
			className="mb-6 bg-white border border-gray-100 rounded-lg p-4 min-h-[120px]"
		>
			<h2 className="text-lg font-semibold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
				選択中の予定
			</h2>
			{selectedSchedules.length === 0 ? (
				<p className="text-gray-500 text-sm text-center py-2">
					参加したいイベントを選択してください
				</p>
			) : (
				<div className="space-y-2">
					{Array.from(groupedSchedules.values()).map(({ event, schedules }) => (
						<div
							key={event.title}
							data-testid="selected-schedule-item"
							className="flex items-center justify-start p-3 bg-white rounded-md border border-pink-100 hover:border-pink-200 gap-2"
						>
							<div className="w-16 h-16 rounded-md overflow-hidden">
								<img
									src={event.image}
									alt={event.title}
									className="w-full h-full object-cover"
								/>
							</div>
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
