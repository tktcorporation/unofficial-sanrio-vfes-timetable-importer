import { Check } from "lucide-react";
import type { Event, EventKey, Schedule } from "../../old_src/types";
import { createEventKey } from "../../old_src/types";

interface EventCardProps {
	event: Event;
	selectedSchedules: Map<EventKey, Event>;
	onScheduleToggle: (event: Event, schedule: Schedule) => void;
	onBulkToggle?: (event: Event, schedules: Schedule[]) => void;
}

export function EventCard({
	event,
	selectedSchedules,
	onScheduleToggle,
	onBulkToggle,
}: EventCardProps) {
	return (
		<div className="bg-white border border-pink-100 rounded-lg overflow-hidden transform transition-all duration-300 hover:border-pink-200">
			<div className="relative">
				<img
					loading="lazy"
					decoding="async"
					src={event.image}
					alt={event.title}
					className="w-full h-32 sm:h-40 object-cover"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent" />
			</div>

			<div className="p-4">
				<h2 className="text-lg font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
					{event.title}
				</h2>
				<div className="flex items-center justify-between text-gray-600 mb-2">
					<div className="flex items-center gap-1">
						{event.platform.map((platform) => (
							<span
								key={platform}
								className={`text-xs font-medium px-2 py-1 rounded-full ${
									platform === "PC"
										? "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800"
										: "bg-gradient-to-r from-green-100 to-green-200 text-green-800"
								}`}
							>
								{platform}
							</span>
						))}
					</div>
					<button
						type="button"
						onClick={() => {
							const allSchedules = event.schedules.flatMap((schedule) => {
								const times = Array.isArray(schedule.time)
									? schedule.time
									: [schedule.time];
								return times.map((time) => ({ ...schedule, time }));
							});

							// すべての予定が選択されているか確認
							const allSelected = allSchedules.every((schedule) => {
								const key = createEventKey(event, schedule.date, schedule.time);
								return selectedSchedules.has(key);
							});

							// すべて選択されている場合は解除、そうでない場合は全選択
							const schedulesToToggle = allSchedules.filter((schedule) => {
								const key = createEventKey(event, schedule.date, schedule.time);
								return allSelected
									? selectedSchedules.has(key)
									: !selectedSchedules.has(key);
							});

							// 一括で処理
							if (onBulkToggle) {
								onBulkToggle(event, schedulesToToggle);
							}
						}}
						className="text-xs font-medium px-2 py-1 rounded-full border border-pink-200 text-pink-600 hover:bg-pink-50"
					>
						{(() => {
							const allSchedules = event.schedules.flatMap((schedule) => {
								const times = Array.isArray(schedule.time)
									? schedule.time
									: [schedule.time];
								return times.map((time) => ({ ...schedule, time }));
							});
							return allSchedules.every((schedule) => {
								const key = createEventKey(event, schedule.date, schedule.time);
								return selectedSchedules.has(key);
							})
								? "すべて解除"
								: "すべて選択";
						})()}
					</button>
				</div>

				<div className="grid grid-cols-4 gap-1.5">
					{event.schedules.map((schedule) => {
						const times = Array.isArray(schedule.time)
							? schedule.time
							: [schedule.time];
						return times.map((time) => {
							const key = createEventKey(event, schedule.date, time);
							const isSelected = selectedSchedules.has(key);

							return (
								<button
									key={key}
									onClick={() => onScheduleToggle(event, { ...schedule, time })}
									type="button"
									className={`p-2 border rounded-md cursor-pointer transition-all duration-300 text-left text-xs sm:text-sm
                    ${
											isSelected
												? "border-pink-500 bg-gradient-to-r from-pink-50 to-purple-50"
												: "border-gray-200 hover:bg-gray-50"
										}`}
								>
									<div className="flex flex-col">
										<div className="flex items-center justify-between">
											<span className="font-medium text-lg">
												{`${schedule.date.month}/${schedule.date.day}`}
											</span>
											{isSelected && (
												<Check className="text-pink-500 w-3 h-3 sm:w-4 sm:h-4" />
											)}
										</div>
										<span className="text-gray-500 text-lg">
											{`${time.hour}:${time.minute}`}
										</span>
									</div>
								</button>
							);
						});
					})}
				</div>
			</div>
		</div>
	);
}
