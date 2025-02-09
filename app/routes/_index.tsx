import { hc } from "hono/client";
import { useEffect, useState } from "react";
import {
	addToCalendar,
	generateCancelICS,
	generateICS,
	getAuthUrl,
	getEvents,
} from "../../old_src/api/client";
import type { Event, Schedule, EventKey } from "../../old_src/types";
import type { AppType } from "../../server/index";
import { ActionButtons } from "../components/ActionButtons";
import { CancelGuide } from "../components/CancelGuide";
import { EventCard } from "../components/EventCard";
import { Notification } from "../components/Notification";
import { SelectedSchedules } from "../components/SelectedSchedules";
import { StepActions } from "../components/StepActions";
import { Stepper, defaultSteps } from "../components/Stepper";
import type { Route } from "./+types/_index";
import { createEventKey } from "../../old_src/types";

const client = hc<AppType>("/");

export const loader = (args: Route.LoaderArgs) => {
	const extra = args.context.extra;
	const cloudflare = args.context.cloudflare;
	const myVarInVariables = args.context.hono.context.get("MY_VAR_IN_VARIABLES");
	const isWaitUntilDefined = !!cloudflare.ctx.waitUntil;
	return { cloudflare, extra, myVarInVariables, isWaitUntilDefined };
};

export default function Index({ loaderData }: Route.ComponentProps) {
	const [events, setEvents] = useState<Event[]>([]);
	const [selectedSchedules, setSelectedSchedules] = useState<Map<EventKey, Event>>(
		new Map(),
	);
	const [isLoading, setIsLoading] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [notification, setNotification] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	// 現在のステップを管理
	const [currentStep, setCurrentStep] = useState(0);

	useEffect(() => {
		client.events
			.$get()
			.then((data) => data.json())
			.then((data) => setEvents(data));
	}, []);

	const handleScheduleToggle = (event: Event, schedule: Schedule) => {
		const time = Array.isArray(schedule.time)
			? schedule.time[0]
			: schedule.time;
		const key = createEventKey(event, schedule.date, time);
		const newSelected = new Map(selectedSchedules);

		if (newSelected.has(key)) {
			newSelected.delete(key);
		} else {
			newSelected.set(key, event);
		}
		setSelectedSchedules(newSelected);
	};

	const handleAuth = async () => {
		try {
			const data = await getAuthUrl();
			window.location.href = data.url;
		} catch (error) {
			console.error("Authentication error:", error);
		}
	};

	const handleAddToCalendar = async () => {
		if (!isAuthenticated) {
			handleAuth();
			return;
		}

		setIsLoading(true);
		try {
			const selectedEvents = Array.from(selectedSchedules.entries()).map(
				([key, event]) => {
					const [date, time] = key.split("-");
					const [hour, minute] = time.split(":");
					const endHour = Number.parseInt(hour);
					const endMinute = Number.parseInt(minute) + 30;
					let endDate = date;
					let endTime = `${endHour}:${endMinute}`;

					if (endMinute >= 60) {
						endTime = `${endHour + 1}:${endMinute - 60}`;
						if (endHour + 1 >= 24) {
							const [month, day] = date.split("/");
							const nextDay = new Date(
								2024,
								Number.parseInt(month) - 1,
								Number.parseInt(day) + 1,
							);
							endTime = `${0}:${endMinute - 60}`;
							endDate = `${nextDay.getMonth() + 1}/${nextDay.getDate()}`;
						}
					}

					return {
						title: event.title,
						startDate: date,
						startTime: time,
						endDate: endDate,
						endTime: endTime,
						platform: event.platform,
					};
				},
			);

			const data = await addToCalendar(selectedEvents);
			if (data.success) {
				setNotification({
					type: "success",
					message: "イベントがカレンダーに追加されました！",
				});
				setSelectedSchedules(new Map());
			} else {
				throw new Error(data.error);
			}
		} catch (error) {
			console.error("Failed to add events:", error);
			setNotification({
				type: "error",
				message: "カレンダーへの追加に失敗しました。",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleDownloadICS = async () => {
		setIsLoading(true);
		try {
			const selectedEvents = Array.from(selectedSchedules.entries()).map(
				([key, event]) => {
					const [date, time] = key.split("-");
					const [hour, minute] = time.split(":");
					const endHour = Number.parseInt(hour);
					const endMinute = Number.parseInt(minute) + 30;
					let endDate = date;
					let endTime = `${endHour}:${endMinute}`;

					if (endMinute >= 60) {
						endTime = `${endHour + 1}:${endMinute - 60}`;
						if (endHour + 1 >= 24) {
							const [month, day] = date.split("/");
							const nextDay = new Date(
								2024,
								Number.parseInt(month) - 1,
								Number.parseInt(day) + 1,
							);
							endTime = `${0}:${endMinute - 60}`;
							endDate = `${nextDay.getMonth() + 1}/${nextDay.getDate()}`;
						}
					}

					return {
						title: event.title,
						startDate: date,
						startTime: time,
						endDate: endDate,
						endTime: endTime,
						platform: event.platform,
					};
				},
			);

			const blob = await generateICS(selectedEvents);
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "events.ics";
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);

			setNotification({
				type: "success",
				message: "ICSファイルがダウンロードされました！",
			});
			setCurrentStep(1);
		} catch (error) {
			console.error("Failed to download ICS file:", error);
			setNotification({
				type: "error",
				message: "ICSファイルの生成に失敗しました。",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancelEvents = async () => {
		setIsLoading(true);
		try {
			const selectedEvents = Array.from(selectedSchedules.entries()).map(
				([key, event]) => {
					const [date, time] = key.split("-");
					const [hour, minute] = time.split(":");
					const endHour = Number.parseInt(hour);
					const endMinute = Number.parseInt(minute) + 30;
					let endDate = date;
					let endTime = `${endHour}:${endMinute}`;

					if (endMinute >= 60) {
						endTime = `${endHour + 1}:${endMinute - 60}`;
						if (endHour + 1 >= 24) {
							const [month, day] = date.split("/");
							const nextDay = new Date(
								2024,
								Number.parseInt(month) - 1,
								Number.parseInt(day) + 1,
							);
							endTime = `${0}:${endMinute - 60}`;
							endDate = `${nextDay.getMonth() + 1}/${nextDay.getDate()}`;
						}
					}

					return {
						title: event.title,
						startDate: date,
						startTime: time,
						endDate: endDate,
						endTime: endTime,
						platform: event.platform,
					};
				},
			);

			const blob = await generateCancelICS(selectedEvents);
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "cancel-events.ics";
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);

			setNotification({
				type: "success",
				message: "キャンセル用ICSファイルがダウンロードされました！",
			});
		} catch (error) {
			console.error("Failed to download cancel ICS file:", error);
			setNotification({
				type: "error",
				message: "キャンセル用ICSファイルの生成に失敗しました。",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleRemoveSchedule = (key: EventKey) => {
		const newSelected = new Map(selectedSchedules);
		newSelected.delete(key);
		setSelectedSchedules(newSelected);
	};

	const handleNextStep = () => {
		if (currentStep < 1) {
			setCurrentStep(currentStep + 1);
		}
	};

	const handleBackStep = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	return (
		<div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-pink-50 to-purple-50 py-8">
			<div className="max-w-4xl mx-auto px-4 pb-24">
				<h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-8">
					イベントカレンダー登録
				</h1>

				<Stepper currentStep={currentStep} steps={defaultSteps} />

				{notification && (
					<Notification
						type={notification.type}
						message={notification.message}
						onClose={() => setNotification(null)}
					/>
				)}

				<StepActions
					currentStep={currentStep}
					onNext={handleNextStep}
					onBack={handleBackStep}
					isNextDisabled={selectedSchedules.size === 0}
					nextLabel={currentStep === 0 ? undefined : "カレンダーに登録する"}
					selectedCount={selectedSchedules.size}
					isLoading={isLoading}
					onDownloadICS={handleDownloadICS}
					onCancelEvents={handleCancelEvents}
				/>

				{currentStep === 1 && (
					<>
						<SelectedSchedules
							selectedSchedules={selectedSchedules}
							onRemoveSchedule={handleRemoveSchedule}
						/>
						<CancelGuide
							onCancelEvents={handleCancelEvents}
							isLoading={isLoading}
							isDisabled={selectedSchedules.size === 0}
						/>
					</>
				)}

				{currentStep === 0 && (
					<div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
						{events.map((event) => (
							<EventCard
								key={event.title}
								event={event}
								selectedSchedules={selectedSchedules}
								onScheduleToggle={handleScheduleToggle}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
