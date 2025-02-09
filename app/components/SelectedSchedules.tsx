import { X } from "lucide-react";
import type { Event } from "../../old_src/types";

interface SelectedSchedulesProps {
	selectedSchedules: Map<string, Event>;
	onRemoveSchedule: (key: string) => void;
}

export function SelectedSchedules({
	selectedSchedules,
	onRemoveSchedule,
}: SelectedSchedulesProps) {
	if (selectedSchedules.size === 0) return null;

	return (
		<div className="mb-6 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-4">
			<h2 className="text-lg font-semibold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
				選択中の予定
			</h2>
			<div className="space-y-2">
				{Array.from(selectedSchedules.entries()).map(([key, event]) => {
					const [date, time] = key.split("-");
					return (
						<div
							key={key}
							className="flex items-center justify-between p-2 bg-white/50 rounded-md backdrop-blur-sm border border-pink-100"
						>
							<div>
								<span className="font-medium">{event.title}</span>
								<span className="text-gray-500 ml-2">
									{`${date.replace("/", "月")}日 ${time}:00`}
								</span>
							</div>
							<button
								type="button"
								onClick={() => onRemoveSchedule(key)}
								className="text-gray-400 hover:text-red-500"
							>
								<X className="w-4 h-4" />
							</button>
						</div>
					);
				})}
			</div>
		</div>
	);
}
