import { X } from "lucide-react";
import type { Event, EventKey } from "../../old_src/types";
import { parseEventKey } from "../../old_src/types";
import type { CalendarEvent, DateTime } from "../../server/controller";

interface SelectedSchedulesProps {
	selectedSchedules: Map<EventKey, Event>;
	onRemoveSchedule: (key: EventKey) => void;
}

const formatForDisplay = (
	schedule: NonNullable<ReturnType<typeof parseEventKey>>,
) => {
	return {
		date: `${schedule.date.month}月${schedule.date.day}日`,
		time: `${String(schedule.time.hour).padStart(2, "0")}:${String(schedule.time.minute).padStart(2, "0")}`,
	};
};

const formatForAPI = (
	event: Event,
	schedule: NonNullable<ReturnType<typeof parseEventKey>>,
): CalendarEvent => {
	const date = `${String(schedule.date.month).padStart(2, "0")}/${String(schedule.date.day).padStart(2, "0")}`;
	const startTime = `${String(schedule.time.hour).padStart(2, "0")}:${String(schedule.time.minute).padStart(2, "0")}`;
	const endTime = `${String(schedule.time.hour + 1).padStart(2, "0")}:${String(schedule.time.minute).padStart(2, "0")}`;

	return {
		title: event.title,
		platform: event.platform as ("PC" | "Android")[],
		startDateTime: {
			date,
			time: startTime,
		},
		endDateTime: {
			date,
			time: endTime,
		},
	};
};

export function SelectedSchedules({
	selectedSchedules,
	onRemoveSchedule,
}: SelectedSchedulesProps) {
	// 同じタイトルの予定をグループ化
	const groupedSchedules = Array.from(selectedSchedules.entries()).reduce(
		(acc, [key, event]) => {
			const parsed = parseEventKey(key);
			if (!parsed) return acc;

			if (!acc.has(event.title)) {
				acc.set(event.title, { event, schedules: [] });
			}
			const group = acc.get(event.title);
			if (!group) return acc;

			group.schedules.push(parsed);
			return acc;
		},
		new Map<
			string,
			{
				event: Event;
				schedules: NonNullable<ReturnType<typeof parseEventKey>>[];
			}
		>(),
	);

	// APIに送信するデータを生成
	const calendarEvents = Array.from(groupedSchedules.values()).flatMap(
		({ event, schedules }) =>
			schedules.map((schedule) => formatForAPI(event, schedule)),
	);

	return (
		<div data-testid="selected-schedules" className="mb-6 bg-white border border-gray-100 rounded-lg p-4 min-h-[120px]">
			<h2 className="text-lg font-semibold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
				選択中の予定
			</h2>
			{selectedSchedules.size === 0 ? (
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
							{/* イベントイメージ画像 1:1 */}
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
										.sort((a, b) => {
											// 日付でソート
											const dateA = `${String(a.date.month).padStart(2, "0")}/${String(a.date.day).padStart(2, "0")}`;
											const dateB = `${String(b.date.month).padStart(2, "0")}/${String(b.date.day).padStart(2, "0")}`;
											if (dateA !== dateB) return dateA.localeCompare(dateB);
											// 時間でソート
											const timeA = `${String(a.time.hour).padStart(2, "0")}:${String(a.time.minute).padStart(2, "0")}`;
											const timeB = `${String(b.time.hour).padStart(2, "0")}:${String(b.time.minute).padStart(2, "0")}`;
											return timeA.localeCompare(timeB);
										})
										.map((schedule) => {
											const formatted = formatForDisplay(schedule);
											return (
												<span
													key={`${schedule.date.month}-${schedule.date.day}-${schedule.time.hour}-${schedule.time.minute}`}
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
