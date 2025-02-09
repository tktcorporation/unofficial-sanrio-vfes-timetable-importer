import {
	addToCalendar,
	generateCancelICS,
	generateICS,
	getAuthUrl,
	getEvents,
} from "app/client";
import type { Event, Schedule } from "app/components/types";
import { type SelectedSchedule, createEventKey } from "app/components/types";
import { hc } from "hono/client";
import { useEffect, useState } from "react";
import { ICS_FILE_NAMES } from "../../server/controller";
import type { AppType } from "../../server/index";
import { calculateEndTime } from "../../utils/date";
import { ActionButtons } from "../components/ActionButtons";
import { CancelGuide } from "../components/CancelGuide";
import { EventCard } from "../components/EventCard";
import { Notification } from "../components/Notification";
import { SelectedSchedules } from "../components/SelectedSchedules";
import { StepActions } from "../components/StepActions";
import { Stepper, defaultSteps } from "../components/Stepper";
import type { Route } from "./+types/_index";

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
	const [selectedSchedules, setSelectedSchedules] = useState<
		SelectedSchedule[]
	>([]);
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
			.then((data) =>
				setEvents(
					data.map((event) => ({
						...event,
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

		// すべてのスケジュールが選択されているか確認
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

		// すべて選択されている場合は解除、そうでない場合は全選択
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
			const selectedEvents = selectedSchedules.map((schedule) => {
				const event = events.find((e) => e.uid === schedule.uid);
				if (!event) {
					throw new Error("Event not found");
				}
				return {
					uid: schedule.uid,
					startDateTime: {
						year: String(schedule.schedule.date.year),
						month: String(schedule.schedule.date.month),
						day: String(schedule.schedule.date.day),
						hour: String(schedule.schedule.time.hour),
						minute: String(schedule.schedule.time.minute),
					},
				};
			});

			const data = await addToCalendar(selectedEvents);
			if (data.success) {
				setNotification({
					type: "success",
					message: "イベントがカレンダーに追加されました！",
				});
				setSelectedSchedules([]);
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
			const selectedEvents = selectedSchedules.map((schedule) => ({
				uid: schedule.uid,
				startDateTime: {
					year: String(schedule.schedule.date.year),
					month: String(schedule.schedule.date.month),
					day: String(schedule.schedule.date.day),
					hour: String(schedule.schedule.time.hour),
					minute: String(schedule.schedule.time.minute),
				},
			}));

			const blob = await generateICS(selectedEvents);
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = ICS_FILE_NAMES.EVENTS;

			document.body.appendChild(link);
			link.click();

			setTimeout(() => {
				window.URL.revokeObjectURL(url);
				document.body.removeChild(link);
			}, 100);

			setNotification({
				type: "success",
				message: "ICSファイルがダウンロードされました！",
			});
		} catch (error) {
			console.error("Failed to download ICS file:", error);
			setNotification({
				type: "error",
				message:
					error instanceof Error
						? error.message
						: "ICSファイルの生成に失敗しました。",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancelEvents = async () => {
		setIsLoading(true);
		try {
			const selectedEvents = selectedSchedules.map((schedule) => ({
				uid: schedule.uid,
				startDateTime: {
					year: String(schedule.schedule.date.year),
					month: String(schedule.schedule.date.month),
					day: String(schedule.schedule.date.day),
					hour: String(schedule.schedule.time.hour),
					minute: String(schedule.schedule.time.minute),
				},
			}));

			const blob = await generateCancelICS(selectedEvents);
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = ICS_FILE_NAMES.CANCEL_EVENTS;

			document.body.appendChild(link);
			link.click();

			setTimeout(() => {
				window.URL.revokeObjectURL(url);
				document.body.removeChild(link);
			}, 100);

			setNotification({
				type: "success",
				message: "キャンセル用ICSファイルがダウンロードされました！",
			});
		} catch (error) {
			console.error("Failed to download cancel ICS file:", error);
			setNotification({
				type: "error",
				message:
					error instanceof Error
						? error.message
						: "キャンセル用ICSファイルの生成に失敗しました。",
			});
		} finally {
			setIsLoading(false);
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
		<div className="min-h-screen overflow-x-hidden bg-[#E4F2EE] py-6">
			<div className="max-w-6xl mx-auto px-2 pb-24">
				<p className="text-gray-500 mb-8">
					これは非公式ツールです。イベントの詳細は<a href="https://v-fes.sanrio.co.jp/" target="_blank" rel="noopener noreferrer">サンリオVfes公式サイト</a>をご確認ください。
				</p>

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
					isNextDisabled={selectedSchedules.length === 0}
					nextLabel={currentStep === 0 ? undefined : "カレンダーに登録する"}
					selectedCount={selectedSchedules.length}
					isLoading={isLoading}
					onDownloadICS={handleDownloadICS}
					onCancelEvents={handleCancelEvents}
				/>

				{currentStep === 1 && (
					<>
						<SelectedSchedules selectedSchedules={selectedSchedules} />
						<CancelGuide
							onCancelEvents={handleCancelEvents}
							isLoading={isLoading}
							isDisabled={selectedSchedules.length === 0}
						/>
					</>
				)}

				{currentStep === 0 && (
					<div className="flex flex-col gap-4">
					<span className="text-sm text-gray-500">※ 日時はすべてJSTです</span>
					<div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
						{events.map((event) => (
							<EventCard
								key={event.title}
								event={event}
								selectedSchedules={selectedSchedules}
								onScheduleToggle={handleScheduleToggle}
								onBulkToggle={handleBulkToggle}
							/>
						))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
