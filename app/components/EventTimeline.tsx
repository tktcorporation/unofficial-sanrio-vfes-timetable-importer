import type { EventApi, EventSourceInput } from "@fullcalendar/core";
import jaLocale from "@fullcalendar/core/locales/ja";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useEffect, useRef } from "react";
import type { Event, SelectedSchedule } from "./types";

interface EventTimelineProps {
	events: Event[];
	selectedSchedules: SelectedSchedule[];
	onScheduleToggle: (selectedSchedule: SelectedSchedule) => void;
	selectedDate: Date;
}

export const EventTimeline: React.FC<EventTimelineProps> = ({
	events,
	selectedSchedules,
	onScheduleToggle,
	selectedDate,
}) => {
	const calendarRef = useRef<FullCalendar>(null);

	useEffect(() => {
		if (calendarRef.current) {
			setTimeout(() => {
				calendarRef.current?.getApi().gotoDate(selectedDate);
			}, 0);
		}
	}, [selectedDate]);

	const calendarEvents: EventSourceInput = events.flatMap((event) =>
		event.schedules.map((schedule) => {
			const startDate = new Date(
				schedule.date.year,
				schedule.date.month - 1,
				schedule.date.day,
				schedule.time.hour,
				schedule.time.minute,
			);

			const endDate = new Date(startDate);
			endDate.setMinutes(endDate.getMinutes() + event.timeSlotMinutes);

			const isSelected = selectedSchedules.some(
				(s) =>
					s.uid === event.uid &&
					s.schedule.date.year === schedule.date.year &&
					s.schedule.date.month === schedule.date.month &&
					s.schedule.date.day === schedule.date.day &&
					s.schedule.time.hour === schedule.time.hour &&
					s.schedule.time.minute === schedule.time.minute,
			);

			return {
				title: event.title,
				start: startDate,
				end: endDate,
				extendedProps: {
					selectedSchedule: {
						uid: event.uid,
						schedule,
						start: startDate,
						end: endDate,
					},
					isSelected,
					location: event.locationName,
				},
				backgroundColor: isSelected ? "#FF6B9D" : "#FFF5F8",
				textColor: isSelected ? "#ffffff" : "#3D3043",
				borderColor: isSelected ? "#FF8AAF" : "#FF6B9D",
				classNames: [
					"modern-event",
					isSelected ? "selected-event" : "fc-border-dashed",
				],
			};
		}),
	);

	return (
		<div className="kawaii-card pr-3 py-3 overflow-hidden">
			<div
				style={{
					["--fc-border-color" as string]: "transparent",
					["--fc-page-bg-color" as string]: "transparent",
					["--fc-neutral-bg-color" as string]: "transparent",
					["--fc-today-bg-color" as string]: "transparent",
				}}
			>
				<FullCalendar
					ref={calendarRef}
					plugins={[timeGridPlugin]}
					initialView="timeGridDay"
					initialDate={selectedDate}
					locale={jaLocale}
					slotMinTime="06:00:00"
					slotMaxTime="25:00:00"
					allDaySlot={false}
					headerToolbar={{
						left: "",
						center: "",
						right: "",
						start: "",
						end: "",
					}}
					height="auto"
					slotDuration="00:10:00"
					slotLabelFormat={{
						hour: "numeric",
						minute: "2-digit",
						hour12: false,
					}}
					eventMinHeight={24}
					events={calendarEvents}
					eventClick={(info) => {
						onScheduleToggle(info.event.extendedProps.selectedSchedule);
					}}
					eventContent={(eventInfo) => {
						const isSelected = eventInfo.event.extendedProps.isSelected;
						return (
							<div className="event-content overflow-visible p-1">
								<div
									className={`event-title font-bold text-xs leading-tight ${isSelected ? "text-white" : "text-kawaii-text"}`}
								>
									{eventInfo.event.title}
								</div>
								{/* 開催時間 */}
								<div
									className={`text-[10px] ${isSelected ? "text-white/80" : "text-kawaii-text-muted"}`}
								>
									{eventInfo.event.extendedProps.selectedSchedule.start.getHours()}
									:
									{eventInfo.event.extendedProps.selectedSchedule.start
										.getMinutes()
										.toString()
										.padStart(2, "0")}
									-
									{eventInfo.event.extendedProps.selectedSchedule.end.getHours()}
									:
									{eventInfo.event.extendedProps.selectedSchedule.end
										.getMinutes()
										.toString()
										.padStart(2, "0")}
								</div>
								<div
									className={`event-location text-[10px] ${isSelected ? "text-white/70" : "text-kawaii-text-muted"}`}
								>
									{eventInfo.event.extendedProps.location}
								</div>
							</div>
						);
					}}
					nowIndicator={true}
				/>
			</div>
		</div>
	);
};
