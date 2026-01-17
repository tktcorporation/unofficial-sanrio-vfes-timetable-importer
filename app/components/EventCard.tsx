import { ChevronDown, ExternalLink } from "lucide-react";
import { useState } from "react";
import {
	type Event,
	type Schedule,
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

const handleTimeClick = (schedule: Schedule) => {
	const times = Array.isArray(schedule.time) ? schedule.time : [schedule.time];
	return times.map((time) => ({
		date: schedule.date,
		time,
	}));
};

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

	return (
		<div
			data-testid="event-card"
			className="bg-white rounded-lg overflow-hidden transform transition-transform duration-200 hover:border-pink-200"
		>
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
							className="w-full h-32 sm:h-40 object-cover hover:opacity-90 transition-opacity"
						/>
						<div className="absolute top-2 right-2 bg-black/10 backdrop-blur-sm p-1.5 rounded-lg hover:bg-black/20 transition-colors">
							<ExternalLink
								size={16}
								className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
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
					<div className="flex items-center gap-1">
						<span className="text-xs text-gray-500">{event.locationName}</span>
					</div>
				)}
				{event.path ? (
					<a
						href={`https://v-fes.sanrio.co.jp${event.path}`}
						target="_blank"
						rel="noopener noreferrer"
						className="block hover:text-custom-pink transition-colors"
					>
						<h2 className="text-lg font-bold mb-1 text-black text-balance">
							{event.title}
						</h2>
					</a>
				) : (
					<h2 className="text-lg font-bold mb-1 text-black text-balance">
						{event.title}
					</h2>
				)}
				<div className="flex items-center justify-between text-gray-600 mb-2">
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-1">
							{event.ticketLink && (
								<a
									href={event.ticketLink}
									target="_blank"
									rel="noopener noreferrer"
									className="text-xs font-medium px-1.5 py-0.5 cursor-pointer bg-pink-600 text-white"
								>
									有料
								</a>
							)}
							{event.platform.map((platform) => (
								<span
									key={platform}
									className={`text-xs font-medium px-2 py-1 rounded-full ${
										platform === "PC"
											? "bg-blue-100 text-blue-800"
											: "bg-green-100 text-green-800"
									}`}
								>
									{platform}
								</span>
							))}
						</div>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => {
							const allSchedules = event.schedules.flatMap((schedule) => {
								const times = Array.isArray(schedule.time)
									? schedule.time
									: [schedule.time];
								return times.map((time) => ({ ...schedule, time }));
							});

							// すべての予定が選択されているか確認
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

							// すべて選択されている場合は解除、そうでない場合は全選択
							const schedulesToToggle = allSchedules.map((schedule) => ({
								uid: event.uid,
								schedule: {
									date: schedule.date,
									time: schedule.time,
								},
							}));

							// 一括で処理
							if (onBulkToggle) {
								onBulkToggle(schedulesToToggle);
							}
						}}
						className="text-pink-600 border-pink-200 hover:bg-pink-50 hover:text-pink-600"
					>
						{(() => {
							const allSchedules = event.schedules.flatMap((schedule) => {
								const times = Array.isArray(schedule.time)
									? schedule.time
									: [schedule.time];
								return times.map((time) => ({ ...schedule, time }));
							});
							return allSchedules.every((schedule) => {
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
							})
								? "すべて解除"
								: "すべて選択";
						})()}
					</Button>
				</div>

				{hasMultipleSchedules ? (
					<>
						{/* 最初の3つの予定を表示 */}
						<div className="grid grid-cols-4 gap-1.5 mb-2">
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

									return (
										<Button
											key={key}
											data-testid="schedule-button"
											onClick={() =>
												onScheduleToggle({
													uid: event.uid,
													schedule: {
														date: schedule.date,
														time: schedule.time,
													},
												})
											}
											type="button"
											variant="outline"
											className={`h-auto p-2 justify-start text-left text-xs sm:text-sm
											${
												isSelected
													? "border-pink-500 bg-pink-50"
													: "border-gray-200 hover:bg-gray-50"
											}`}
										>
											<div className="flex flex-col">
												<div className="flex items-center justify-between">
													<span className="font-medium text-lg">
														{`${schedule.date.month.toString()}/${schedule.date.day.toString()}`}
														<span className="text-xs">{`(${getDayOfWeek(schedule.date.year, schedule.date.month, schedule.date.day)})`}</span>
													</span>
												</div>
												<span className="text-gray-500 text-lg">
													{`${schedule.time.hour.toString().padStart(2, "0")}:${schedule.time.minute.toString().padStart(2, "0")}`}
												</span>
											</div>
										</Button>
									);
								})}
						</div>

						{/* 残りの予定をアコーディオンで表示 */}
						<Accordion
							type="single"
							collapsible
							className="border-t border-gray-100 pt-2"
						>
							<AccordionItem value="more-schedules" className="border-none">
								<AccordionTrigger className="py-2 text-sm text-gray-600 hover:no-underline">
									他 {event.schedules.length - MAX_VISIBLE_SCHEDULES}{" "}
									件の予定を表示
								</AccordionTrigger>
								<AccordionContent>
									<div className="grid grid-cols-4 gap-1.5 pt-2">
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

												return (
													<Button
														key={key}
														data-testid="schedule-button"
														onClick={() =>
															onScheduleToggle({
																uid: event.uid,
																schedule: {
																	date: schedule.date,
																	time: schedule.time,
																},
															})
														}
														type="button"
														variant="outline"
														className={`h-auto p-2 justify-start text-left text-xs sm:text-sm
														${
															isSelected
																? "border-pink-500 bg-pink-50"
																: "border-gray-200 hover:bg-gray-50"
														}`}
													>
														<div className="flex flex-col">
															<div className="flex items-center justify-between">
																<span className="font-medium text-lg">
																	{`${schedule.date.month.toString()}/${schedule.date.day.toString()}`}
																	<span className="text-xs">{`(${getDayOfWeek(schedule.date.year, schedule.date.month, schedule.date.day)})`}</span>
																</span>
															</div>
															<span className="text-gray-500 text-lg">
																{`${schedule.time.hour.toString().padStart(2, "0")}:${schedule.time.minute.toString().padStart(2, "0")}`}
															</span>
														</div>
													</Button>
												);
											})}
									</div>
								</AccordionContent>
							</AccordionItem>
						</Accordion>
					</>
				) : (
					// 3つ以下の場合は通常表示
					<div className="grid grid-cols-4 gap-1.5">
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

							return (
								<Button
									key={key}
									data-testid="schedule-button"
									onClick={() =>
										onScheduleToggle({
											uid: event.uid,
											schedule: {
												date: schedule.date,
												time: schedule.time,
											},
										})
									}
									type="button"
									variant="outline"
									className={`h-auto p-2 justify-start text-left text-xs sm:text-sm
										${
											isSelected
												? "border-pink-500 bg-pink-50"
												: "border-gray-200 hover:bg-gray-50"
										}`}
								>
									<div className="flex flex-col">
										<div className="flex items-center justify-between">
											<span className="font-medium text-lg">
												{`${schedule.date.month.toString()}/${schedule.date.day.toString()}`}
												<span className="text-xs">{`(${getDayOfWeek(schedule.date.year, schedule.date.month, schedule.date.day)})`}</span>
											</span>
										</div>
										<span className="text-gray-500 text-lg">
											{`${schedule.time.hour.toString().padStart(2, "0")}:${schedule.time.minute.toString().padStart(2, "0")}`}
										</span>
									</div>
								</Button>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
