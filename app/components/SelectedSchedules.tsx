import { X } from "lucide-react";
import type { Event, EventKey } from "../../old_src/types";
import { parseEventKey } from "../../old_src/types";

interface SelectedSchedulesProps {
	selectedSchedules: Map<EventKey, Event>;
	onRemoveSchedule: (key: EventKey) => void;
}

export function SelectedSchedules({
	selectedSchedules,
	onRemoveSchedule,
}: SelectedSchedulesProps) {
	return (
		<div className="mb-6 bg-white border border-gray-100 rounded-lg p-4 min-h-[120px]">
			<h2 className="text-lg font-semibold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
				選択中の予定
			</h2>
			{selectedSchedules.size === 0 ? (
				<p className="text-gray-500 text-sm text-center py-2">
					参加したいイベントを選択してください
				</p>
			) : (
				<div className="space-y-2">
					{Array.from(selectedSchedules.entries()).map(([key, event]) => {
						const parsed = parseEventKey(key);
						if (!parsed) return null;

						return (
							<div
								key={key}
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
								<div className="flex flex-col gap-1">
									<span className="font-medium text-base">{event.title}</span>
									<span className="text-gray-500 text-sm">
										{`${parsed.date.month}月${parsed.date.day}日 ${parsed.time.hour}:${parsed.time.minute}`}
									</span>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
