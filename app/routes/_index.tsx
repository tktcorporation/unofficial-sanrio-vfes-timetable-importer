import { useEvents } from "app/composables/useEvents";
import { useICSDownload } from "app/composables/useICSDownload";
import { useNotification } from "app/composables/useNotification";
import {
	decompressSchedules,
	generateShareUrl,
} from "app/composables/useScheduleShare";
import { useStepper } from "app/composables/useStepper";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { CancelGuide } from "../components/CancelGuide";
import { EventCard } from "../components/EventCard";
import { Notification } from "../components/Notification";
import { SelectedSchedules } from "../components/SelectedSchedules";
import { ShareModal } from "../components/ShareModal";
import { StepActions } from "../components/StepActions";
import { Stepper, defaultSteps } from "../components/Stepper";
import type { Route } from "./+types/_index";

export const loader = (args: Route.LoaderArgs) => {
	const extra = args.context.extra;
	const cloudflare = args.context.cloudflare;
	const myVarInVariables = args.context.hono.context.get("MY_VAR_IN_VARIABLES");
	const isWaitUntilDefined = !!cloudflare.ctx.waitUntil;
	return { cloudflare, extra, myVarInVariables, isWaitUntilDefined };
};

export default function Index({ loaderData }: Route.ComponentProps) {
	const [searchParams] = useSearchParams();
	const [isShareModalOpen, setIsShareModalOpen] = useState(false);
	const [shareUrl, setShareUrl] = useState("");
	const [hasInitialized, setHasInitialized] = useState(false);
	const [selectedFloor, setSelectedFloor] = useState<string>("B4F");
	const [showAndroidOnly, setShowAndroidOnly] = useState(false);

	const {
		isLoading: isEventsLoading,
		events,
		selectedSchedules,
		setSelectedSchedules,
		handleScheduleToggle,
		handleBulkToggle,
	} = useEvents();
	const { notification, showNotification, clearNotification } =
		useNotification();
	const { isLoading, downloadICS, downloadCancelICS } = useICSDownload();
	const { currentStep, nextStep, backStep, setStep } = useStepper();

	// URLパラメータから選択された予定を復元
	useEffect(() => {
		const sharedSchedules = searchParams.get("schedules");
		if (sharedSchedules && !hasInitialized && !isEventsLoading) {
			try {
				const decompressed = decompressSchedules({
					compressed: sharedSchedules,
					events,
				});
				const expandedSchedules = decompressed.map((event) => ({
					uid: event.uid,
					schedule: {
						date: event.schedule.date,
						time: event.schedule.time,
					},
				}));

				setSelectedSchedules(expandedSchedules);
				setStep(1);
				setHasInitialized(true);
				showNotification("success", "共有された予定を読み込みました！");
			} catch (error) {
				console.error("Failed to parse shared schedules:", error);
				showNotification(
					"error",
					`共有された予定の読み込みに失敗しました: ${
						error instanceof Error ? error.message : "不明なエラー"
					}`,
				);
			}
		}
	}, [
		searchParams,
		events,
		setSelectedSchedules,
		setStep,
		showNotification,
		hasInitialized,
		isEventsLoading,
	]);

	const handleDownloadICS = async () => {
		const result = await downloadICS(selectedSchedules);
		if (result.success) {
			showNotification("success", "ICSファイルがダウンロードされました！");
		} else {
			showNotification(
				"error",
				result.error ?? "ICSファイルの生成に失敗しました。",
			);
		}
	};

	const handleCancelEvents = async () => {
		const result = await downloadCancelICS(selectedSchedules);
		if (result.success) {
			showNotification(
				"success",
				"キャンセル用ICSファイルがダウンロードされました！",
			);
		} else {
			showNotification(
				"error",
				result.error ?? "キャンセル用ICSファイルの生成に失敗しました。",
			);
		}
	};

	const handleShare = () => {
		if (selectedSchedules.length === 0) {
			showNotification("error", "共有する予定を選択してください。");
			return;
		}

		const url = generateShareUrl({
			url: new URL(window.location.href),
			schedules: selectedSchedules,
		});
		setShareUrl(url);
		setIsShareModalOpen(true);
	};

	return (
		<div className="min-h-screen overflow-x-hidden bg-[#E4F2EE] py-6">
			<div className="max-w-6xl mx-auto px-2 pb-24 text-xs">
				<div className="text-gray-500 mb-8 flex justify-between items-center gap-4">
					<p>
						これは非公式ツールです。イベントの詳細は
						<a
							href="https://v-fes.sanrio.co.jp/"
							target="_blank"
							rel="noopener noreferrer"
							className="text-gray-600 hover:text-gray-800 hover:underline"
						>
							サンリオVfes公式サイト
						</a>
						をご確認ください。
					</p>
					<a
						href="https://docs.google.com/forms/d/e/1FAIpQLSe78zLbRK8ZrP_cFeaoQMMmHMK6OFfFd1Ay63cfMCGa3TKMMA/viewform?usp=sharing"
						target="_blank"
						rel="noopener noreferrer"
						className="text-gray-600 hover:text-gray-800 hover:underline"
					>
						ご要望・不具合報告
					</a>
				</div>

				<Stepper currentStep={currentStep} steps={defaultSteps} />

				{notification && (
					<Notification
						type={notification.type}
						message={notification.message}
						onClose={clearNotification}
					/>
				)}

				<StepActions
					currentStep={currentStep}
					onNext={nextStep}
					onBack={backStep}
					isNextDisabled={selectedSchedules.length === 0}
					nextLabel={currentStep === 0 ? undefined : "カレンダーに登録"}
					selectedCount={selectedSchedules.length}
					isLoading={isLoading}
					onDownloadICS={handleDownloadICS}
					onCancelEvents={handleCancelEvents}
					onShare={handleShare}
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
						<div className="flex flex-col gap-2">
							<div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
								{Array.from(new Set(events.map((event) => event.floor)))
									.sort((a, b) => {
										const order = ["B4F", "1F/2F", "4F", "B3F", "other"];
										return order.indexOf(a) - order.indexOf(b);
									})
									.map((floor) => (
										<button
											key={floor}
											type="button"
											className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
												selectedFloor === floor
													? "border-b-2 border-custom-pink text-custom-pink"
													: "text-gray-500"
											}`}
											onClick={() => setSelectedFloor(floor)}
										>
											{floor || "未設定"}
										</button>
									))}
							</div>
							<div className="flex justify-between items-center">
								<div className="flex items-center gap-4">
									<label className="flex items-center gap-1 text-sm text-gray-600">
										<input
											type="checkbox"
											checked={showAndroidOnly}
											onChange={(e) => setShowAndroidOnly(e.target.checked)}
											className="w-4 h-4 accent-gray-500 border-gray-300 rounded focus:ring-0"
										/>
										Android対応
									</label>
								</div>
								{!isEventsLoading && (
									<button
										type="button"
										onClick={() => {
											const floorEvents = events.filter(
												(event) => event.floor === selectedFloor,
											);
											const allSchedules = floorEvents.flatMap((event) =>
												event.schedules.map((schedule) => ({
													uid: event.uid,
													schedule: {
														date: schedule.date,
														time: schedule.time,
													},
												})),
											);
											handleBulkToggle(allSchedules);
										}}
										className="border border-custom-pink text-xs px-3 py-1 bg-white text-custom-pink rounded-md transition-colors"
									>
										{selectedSchedules.length ===
										events
											.filter((e) => e.floor === selectedFloor)
											.flatMap((e) => e.schedules).length
											? "すべて解除"
											: "すべて選択"}
									</button>
								)}
							</div>
						</div>
						<div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
							{isEventsLoading ? (
								<>
									{[
										"top",
										"middle-1",
										"middle-2",
										"middle-3",
										"middle-4",
										"bottom",
									].map((id) => (
										<div
											key={id}
											className="bg-white rounded-lg p-4 shadow-sm animate-pulse"
										>
											<div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
											<div className="space-y-3">
												<div className="h-3 bg-gray-200 rounded" />
												<div className="h-3 bg-gray-200 rounded w-5/6" />
												<div className="h-3 bg-gray-200 rounded w-4/6" />
											</div>
										</div>
									))}
								</>
							) : (
								events
									.filter((event) => event.floor === selectedFloor)
									.filter(
										(event) =>
											!showAndroidOnly || event.platform.includes("Android"),
									)
									.map((event) => (
										<EventCard
											key={event.title}
											event={event}
											selectedSchedules={selectedSchedules}
											onScheduleToggle={handleScheduleToggle}
											onBulkToggle={handleBulkToggle}
										/>
									))
							)}
						</div>
					</div>
				)}

				<ShareModal
					isOpen={isShareModalOpen}
					onClose={() => setIsShareModalOpen(false)}
					shareUrl={shareUrl}
					selectedCount={selectedSchedules.length}
					selectedSchedules={selectedSchedules}
				/>
			</div>
		</div>
	);
}
