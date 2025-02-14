import type { Event } from "./types";

type FloorTabsProps = {
	viewMode: "floor" | "today";
	selectedFloor: string;
	events: Event[];
	onViewModeChange: (mode: "floor" | "today") => void;
	onFloorSelect: (floor: string) => void;
};

const FLOOR_ORDER = ["B4F", "1F/2F", "4F", "B3F", "その他"];

export function FloorTabs({
	viewMode,
	selectedFloor,
	events,
	onViewModeChange,
	onFloorSelect,
}: FloorTabsProps) {
	const uniqueFloors = Array.from(new Set(events.map((e) => e.floor))).sort(
		(a, b) => FLOOR_ORDER.indexOf(a) - FLOOR_ORDER.indexOf(b),
	);

	return (
		<div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
			<button
				type="button"
				className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
					viewMode === "today"
						? "border-b-2 border-custom-pink text-custom-pink"
						: "text-gray-500"
				}`}
				onClick={() => onViewModeChange("today")}
			>
				今日のイベント
			</button>
			{uniqueFloors.map((floor) => (
				<button
					key={floor}
					type="button"
					className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
						viewMode === "floor" && selectedFloor === floor
							? "border-b-2 border-custom-pink text-custom-pink"
							: "text-gray-500"
					}`}
					onClick={() => {
						onViewModeChange("floor");
						onFloorSelect(floor);
					}}
				>
					{floor || "未設定"}
				</button>
			))}
		</div>
	);
}
