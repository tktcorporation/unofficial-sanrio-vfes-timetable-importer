import { match } from "ts-pattern";
import { cn } from "../lib/utils";
import type { Event } from "./types";
import { Toggle } from "./ui/toggle";

type FilterOptionsProps = {
	viewMode: "floor" | "today";
	selectedFloors: string[];
	events: Event[];
	onViewModeChange: (mode: "floor" | "today") => void;
	onFloorToggle: (floor: string) => void;
};

const FLOOR_ORDER = ["B4F", "1F/2F", "4F", "B3F", "その他"];

export function FilterOptions({
	viewMode,
	selectedFloors,
	events,
	onViewModeChange,
	onFloorToggle,
}: FilterOptionsProps) {
	const uniqueFloors = Array.from(new Set(events.map((e) => e.floor))).sort(
		(a, b) => FLOOR_ORDER.indexOf(a) - FLOOR_ORDER.indexOf(b),
	);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex gap-2 overflow-x-auto pb-2">
				<div className="kawaii-toggle w-full flex">
					<Toggle
						pressed={viewMode === "today"}
						onPressedChange={() => onViewModeChange("today")}
						className={cn(
							"kawaii-toggle-item flex-1 data-[state=on]:bg-white data-[state=on]:text-kawaii-pink data-[state=on]:shadow-sm",
							viewMode === "today" ? "active" : "",
						)}
					>
						今日のイベント
					</Toggle>
					<Toggle
						pressed={viewMode === "floor"}
						onPressedChange={() => onViewModeChange("floor")}
						className={cn(
							"kawaii-toggle-item flex-1 data-[state=on]:bg-white data-[state=on]:text-kawaii-pink data-[state=on]:shadow-sm",
							viewMode === "floor" ? "active" : "",
						)}
					>
						イベント一覧
					</Toggle>
				</div>
			</div>

			{viewMode === "floor" && (
				<div className="flex flex-col gap-2">
					<div className="flex flex-wrap gap-2">
						{uniqueFloors.map((floor) => (
							<Toggle
								key={floor}
								pressed={selectedFloors.includes(floor)}
								onPressedChange={() => onFloorToggle(floor)}
								variant="outline"
								size="sm"
								className={cn(
									"kawaii-chip",
									selectedFloors.includes(floor)
										? "active data-[state=on]:bg-kawaii-pink-light data-[state=on]:text-kawaii-pink data-[state=on]:border-kawaii-pink"
										: "",
								)}
							>
								{match(floor)
									.with("B4F", () => "B4F(アーティスト)")
									.with("1F/2F", () => "1F/2F(パレード)")
									.with("4F", () => "4F")
									.with("B3F", () => "B3F")
									.with("その他", () => "その他")
									.exhaustive()}
							</Toggle>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
