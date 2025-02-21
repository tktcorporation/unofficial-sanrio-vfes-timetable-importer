import jaLocale from "@fullcalendar/core/locales/ja";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import type { Event, SelectedSchedule } from "./types";
import type { EventApi, EventSourceInput } from "@fullcalendar/core";

interface EventTimelineProps {
	events: Event[];
	selectedSchedules: SelectedSchedule[];
	onScheduleToggle: (selectedSchedule: SelectedSchedule) => void;
}

export const EventTimeline: React.FC<EventTimelineProps> = ({
	events,
	selectedSchedules,
	onScheduleToggle,
}) => {
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
				backgroundColor: isSelected ? "#FF69B4" : "#FFE7F3",
				textColor: isSelected ? "#ffffff" : "#1e293b",
				borderColor: isSelected ? "#fff" : "#FF69B4",
				classNames: ["modern-event", isSelected ? "selected-event" : "fc-border-dashed"],
			};
		}),
	);

	return (
		<div className="bg-white rounded-xl pr-3 py-1 shadow-lg">
			<div
				style={{
					["--fc-border-color" as string]: "transparent",
					["--fc-page-bg-color" as string]: "transparent",
					["--fc-neutral-bg-color" as string]: "transparent",
					["--fc-today-bg-color" as string]: "transparent",
				}}
			>
				<FullCalendar
					plugins={[timeGridPlugin]}
					initialView="timeGridDay"
					locale={jaLocale}
					slotMinTime="05:30:00"
					slotMaxTime="23:59:00"
					allDaySlot={false}
					headerToolbar={{
						start: "",
						center: "",
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
							<div className="event-content overflow-visible">
								<div className="flex gap-1 whitespace-nowrap">
									<div className="event-title font-bold">
										{eventInfo.event.title}
									</div>
								</div>
								{/* 開催時間 */}
								<div>
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
								<div className="event-location">
									{eventInfo.event.extendedProps.location}
								</div>
							</div>
						);
					}}
					nowIndicator={true}
					// dayCellClassNames="no-border"
					// slotLaneClassNames="no-border"
					// slotLabelClassNames="no-border"
				/>
			</div>
		</div>
	);
};
