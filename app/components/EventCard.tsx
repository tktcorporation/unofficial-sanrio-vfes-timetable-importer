import { ExternalLink } from "lucide-react";
import { cn } from "../lib/utils";
import {
	type Event,
	type SelectedSchedule,
	createEventKey,
} from "./../components/types";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "./ui/accordion";
import { Button } from "./ui/button";

interface EventCardProps {
	event: Event;
	selectedSchedules: SelectedSchedule[];
	onScheduleToggle: (schedule: SelectedSchedule) => void;
	onBulkToggle?: (schedules: SelectedSchedule[]) => void;
}

const getDayOfWeek = (year: number, month: number, day: number) => {
	const date = new Date(year, month - 1, day);
	const days = ["日", "月", "火", "水", "木", "金", "土"];
	return days[date.getDay()];
};

// 表示する予定の最大数（これ以上は畳む）
const MAX_VISIBLE_SCHEDULES = 12;

export function EventCard({
	event,
	selectedSchedules,
	onScheduleToggle,
	onBulkToggle,
}: EventCardProps) {
	const hasMultipleSchedules = event.schedules.length > MAX_VISIBLE_SCHEDULES;

	// Check if all schedules are selected
	const allSchedules = event.schedules.flatMap((schedule) => {
		const times = Array.isArray(schedule.time)
			? schedule.time
			: [schedule.time];
		return times.map((time) => ({ ...schedule, time }));
	});

	const allSelected = allSchedules.every((schedule) => {
		const key = createEventKey({
			uid: event.uid,
			date: schedule.date,
			time: schedule.time,
		});
		return selectedSchedules.some(
			(s) =>
				createEventKey({
					uid: s.uid,
					date: s.schedule.date,
					time: s.schedule.time,
				}) === key,
		);
	});

	const handleBulkSelect = () => {
		const schedulesToToggle = allSchedules.map((schedule) => ({
			uid: event.uid,
			schedule: {
				date: schedule.date,
				time: schedule.time,
			},
		}));

		if (onBulkToggle) {
			onBulkToggle(schedulesToToggle);
		}
	};

	const renderScheduleButton = (
		schedule: (typeof event.schedules)[0],
		key: string,
		isSelected: boolean,
	) => (
		<button
			key={key}
			data-testid="schedule-button"
			type="button"
			onClick={() =>
				onScheduleToggle({
					uid: event.uid,
					schedule: {
						date: schedule.date,
						time: schedule.time,
					},
				})
			}
			className={cn("kawaii-schedule-btn text-left", isSelected && "selected")}
		>
			<div className="flex flex-col">
				<span
					className={cn(
						"font-bold text-base",
						isSelected ? "text-white" : "text-kawaii-text",
					)}
				>
					{`${schedule.date.month}/${schedule.date.day}`}
					<span
						className={cn(
							"text-[10px] ml-0.5",
							isSelected ? "text-white/80" : "text-kawaii-text-muted",
						)}
					>
						{`(${getDayOfWeek(schedule.date.year, schedule.date.month, schedule.date.day)})`}
					</span>
				</span>
				<span
					className={cn(
						"font-semibold text-sm tabular-nums",
						isSelected ? "text-white/90" : "text-kawaii-text-muted",
					)}
				>
					{`${schedule.time.hour.toString().padStart(2, "0")}:${schedule.time.minute.toString().padStart(2, "0")}`}
				</span>
			</div>
		</button>
	);

	return (
		<div data-testid="event-card" className="kawaii-card overflow-hidden">
			<div className="relative">
				{event.path && (
					<a
						href={`https://v-fes.sanrio.co.jp${event.path}`}
						target="_blank"
						rel="noopener noreferrer"
						className="block"
						aria-label={`${event.title}の詳細を公式サイトで見る`}
					>
						<img
							loading="lazy"
							decoding="async"
							src={event.image}
							alt={event.title}
							className="w-full h-32 sm:h-40 object-cover"
						/>
						<div className="absolute top-3 right-3 bg-white/90 p-2 rounded-xl shadow-sm">
							<ExternalLink
								size={14}
								className="text-kawaii-pink"
								strokeWidth={2.5}
								aria-hidden="true"
							/>
						</div>
					</a>
				)}
				{!event.path && (
					<img
						loading="lazy"
						decoding="async"
						src={event.image}
						alt={event.title}
						className="w-full h-32 sm:h-40 object-cover"
					/>
				)}
			</div>

			<div className="p-4">
				{event.locationName && (
					<div className="flex items-center gap-1 mb-1">
						<span className="text-xs text-kawaii-text-muted font-medium">
							{event.locationName}
						</span>
					</div>
				)}
				{event.path ? (
					<a
						href={`https://v-fes.sanrio.co.jp${event.path}`}
						target="_blank"
						rel="noopener noreferrer"
						className="block hover:text-kawaii-pink transition-colors"
					>
						<h2 className="text-lg font-bold mb-2 text-kawaii-text text-balance leading-tight">
							{event.title}
						</h2>
					</a>
				) : (
					<h2 className="text-lg font-bold mb-2 text-kawaii-text text-balance leading-tight">
						{event.title}
					</h2>
				)}
				<div className="flex items-center justify-between text-gray-600 mb-3">
					<div className="flex flex-col gap-1.5">
						<div className="flex items-center gap-1.5 flex-wrap">
							{event.ticketLink && (
								<a
									href={event.ticketLink}
									target="_blank"
									rel="noopener noreferrer"
									className="kawaii-badge kawaii-badge-paid"
								>
									有料
								</a>
							)}
						</div>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleBulkSelect}
						className={cn(
							"rounded-xl font-semibold",
							allSelected
								? "border-kawaii-mint bg-kawaii-mint-light text-kawaii-mint"
								: "border-kawaii-pink-light text-kawaii-pink hover:bg-kawaii-pink-light hover:border-kawaii-pink",
						)}
					>
						{allSelected ? "すべて解除" : "すべて選択"}
					</Button>
				</div>

				{hasMultipleSchedules ? (
					<>
						{/* 最初の予定を表示 */}
						<div className="grid grid-cols-4 gap-2 mb-3">
							{event.schedules
								.slice(0, MAX_VISIBLE_SCHEDULES)
								.map((schedule) => {
									const key = createEventKey({
										uid: event.uid,
										date: schedule.date,
										time: schedule.time,
									});
									const isSelected = selectedSchedules.some(
										(s) =>
											createEventKey({
												uid: s.uid,
												date: s.schedule.date,
												time: s.schedule.time,
											}) === key,
									);
									return renderScheduleButton(schedule, key, isSelected);
								})}
						</div>

						{/* 残りの予定をアコーディオンで表示 */}
						<Accordion
							type="single"
							collapsible
							className="border-t-2 border-kawaii-pink-light/50 pt-2"
						>
							<AccordionItem value="more-schedules" className="border-none">
								<AccordionTrigger className="py-2 text-sm text-kawaii-pink hover:no-underline font-medium">
									他 {event.schedules.length - MAX_VISIBLE_SCHEDULES}{" "}
									件の予定を表示
								</AccordionTrigger>
								<AccordionContent>
									<div className="grid grid-cols-4 gap-2 pt-2">
										{event.schedules
											.slice(MAX_VISIBLE_SCHEDULES)
											.map((schedule) => {
												const key = createEventKey({
													uid: event.uid,
													date: schedule.date,
													time: schedule.time,
												});
												const isSelected = selectedSchedules.some(
													(s) =>
														createEventKey({
															uid: s.uid,
															date: s.schedule.date,
															time: s.schedule.time,
														}) === key,
												);
												return renderScheduleButton(schedule, key, isSelected);
											})}
									</div>
								</AccordionContent>
							</AccordionItem>
						</Accordion>
					</>
				) : (
					// 12個以下の場合は通常表示
					<div className="grid grid-cols-4 gap-2">
						{event.schedules.map((schedule) => {
							const key = createEventKey({
								uid: event.uid,
								date: schedule.date,
								time: schedule.time,
							});
							const isSelected = selectedSchedules.some(
								(s) =>
									createEventKey({
										uid: s.uid,
										date: s.schedule.date,
										time: s.schedule.time,
									}) === key,
							);
							return renderScheduleButton(schedule, key, isSelected);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
