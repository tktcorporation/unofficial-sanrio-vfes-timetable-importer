import type { Event, SelectedSchedule } from "app/components/types";
import { createEventKey } from "app/components/types";
import { hc } from "hono/client";
import { useEffect, useState } from "react";
import type { AppType } from "../../server/index";

const client = hc<AppType>("/");

export function useEvents() {
	const [events, setEvents] = useState<Event[]>([]);
	const [selectedSchedules, setSelectedSchedules] = useState<
		SelectedSchedule[]
	>([]);

	useEffect(() => {
		client.events
			.$get()
			.then((data) => data.json())
			.then((data) =>
				setEvents(
					data.map((event) => ({
						...event,
						path: event.path ?? null,
						locationName: event.locationName ?? null,
						description: event.description ?? null,
						schedules: event.schedules.map((schedule) => ({
							...schedule,
							date: {
								year: Number.parseInt(schedule.year),
								month: Number.parseInt(schedule.date.month),
								day: Number.parseInt(schedule.date.day),
							},
							time: {
								hour: Number.parseInt(schedule.time.hour),
								minute: Number.parseInt(schedule.time.minute),
							},
						})),
					})),
				),
			);
	}, []);

	const handleScheduleToggle = (selectedSchedule: SelectedSchedule) => {
		const key = createEventKey({
			uid: selectedSchedule.uid,
			date: selectedSchedule.schedule.date,
			time: selectedSchedule.schedule.time,
		});
		setSelectedSchedules((prev) =>
			prev.some(
				(s) =>
					createEventKey({
						uid: s.uid,
						date: s.schedule.date,
						time: s.schedule.time,
					}) === key,
			)
				? prev.filter(
						(s) =>
							createEventKey({
								uid: s.uid,
								date: s.schedule.date,
								time: s.schedule.time,
							}) !== key,
					)
				: [...prev, selectedSchedule],
		);
	};

	const handleBulkToggle = (schedules: SelectedSchedule[]) => {
		const allKeys = schedules.map((schedule) =>
			createEventKey({
				uid: schedule.uid,
				date: schedule.schedule.date,
				time: schedule.schedule.time,
			}),
		);

		const allSelected = allKeys.every((key) =>
			selectedSchedules.some(
				(s) =>
					createEventKey({
						uid: s.uid,
						date: s.schedule.date,
						time: s.schedule.time,
					}) === key,
			),
		);

		if (allSelected) {
			setSelectedSchedules((prev) =>
				prev.filter(
					(s) =>
						!allKeys.includes(
							createEventKey({
								uid: s.uid,
								date: s.schedule.date,
								time: s.schedule.time,
							}),
						),
				),
			);
		} else {
			setSelectedSchedules((prev) => {
				const newSchedules = [...prev];
				for (const schedule of schedules) {
					const key = createEventKey({
						uid: schedule.uid,
						date: schedule.schedule.date,
						time: schedule.schedule.time,
					});
					if (
						!newSchedules.some(
							(s) =>
								createEventKey({
									uid: s.uid,
									date: s.schedule.date,
									time: s.schedule.time,
								}) === key,
						)
					) {
						newSchedules.push(schedule);
					}
				}
				return newSchedules;
			});
		}
	};

	const handleRemoveSchedule = (props: {
		uid: string;
		date: {
			year: number;
			month: number;
			day: number;
		};
		time: {
			hour: number;
			minute: number;
		};
	}) => {
		const key = createEventKey({
			uid: props.uid,
			date: props.date,
			time: props.time,
		});
		const prevKeys = selectedSchedules.map((s) =>
			createEventKey({
				uid: s.uid,
				date: s.schedule.date,
				time: s.schedule.time,
			}),
		);
		setSelectedSchedules((prev) => prev.filter((s) => !prevKeys.includes(key)));
	};

	return {
		events,
		selectedSchedules,
		setSelectedSchedules,
		handleScheduleToggle,
		handleBulkToggle,
		handleRemoveSchedule,
		isLoading: events.length === 0,
	};
}
