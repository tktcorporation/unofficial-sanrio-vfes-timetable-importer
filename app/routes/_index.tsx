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
import { BulkSelectButton } from "../components/BulkSelectButton";
import { CancelGuide } from "../components/CancelGuide";
import { EventCard } from "../components/EventCard";
import { FloorTabs } from "../components/FloorTabs";
import { Notification } from "../components/Notification";
import { SelectedSchedules } from "../components/SelectedSchedules";
import { ShareModal } from "../components/ShareModal";
import { StepActions } from "../components/StepActions";
import { Stepper, defaultSteps } from "../components/Stepper";
import type { Schedule } from "../components/types";
import { useEventSorting } from "../hooks/useEventSorting";
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
	const [viewMode, setViewMode] = useState<"floor" | "today">("today");

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
	const { sortEventsByEarliestSchedule } = useEventSorting();

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
				<div className="mb-5">
					<Stepper currentStep={currentStep} steps={defaultSteps} />
				</div>

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
						<div className="flex flex-col gap-3">
							<FloorTabs
								viewMode={viewMode}
								selectedFloor={selectedFloor}
								events={events}
								onViewModeChange={setViewMode}
								onFloorSelect={setSelectedFloor}
							/>

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
									<BulkSelectButton
										events={events}
										selectedSchedules={selectedSchedules}
										viewMode={viewMode}
										selectedFloor={selectedFloor}
										showAndroidOnly={showAndroidOnly}
										onBulkToggle={handleBulkToggle}
									/>
								)}
							</div>
						</div>

						{/* B4Fの場合はチケットの購入案内リンクを入れる */}
						{viewMode === "floor" && selectedFloor === "B4F" && (
							<div>
								<a
									href="https://v-fes.sanrio.co.jp/ticket/"
									target="_blank"
									rel="noopener noreferrer"
									className="text-custom-pink/80 hover:text-custom-pink/70 hover:underline"
								>
									このフロアは有料です。チケットの購入はこちらから。
								</a>
							</div>
						)}
						{/* 4Fの場合はチケットの購入案内リンクを入れる */}
						{viewMode === "floor" && selectedFloor === "4F" && (
							<div>
								<a
									href="https://v-fes.sanrio.co.jp/pmgt"
									target="_blank"
									rel="noopener noreferrer"
									className="text-custom-pink/80 hover:text-custom-pink/70 hover:underline"
								>
									サンリオバーチャルグリーティングは有料イベントです。詳しくはこちら。
								</a>
							</div>
						)}
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
									.filter((event) => {
										if (viewMode === "today") {
											const today = new Date();
											return event.schedules.some(
												(schedule) =>
													schedule.date.year === today.getFullYear() &&
													schedule.date.month === today.getMonth() + 1 &&
													schedule.date.day === today.getDate(),
											);
										}
										return event.floor === selectedFloor;
									})
									.filter(
										(event) =>
											!showAndroidOnly || event.platform.includes("Android"),
									)
									.map((event) => {
										// 今日のイベントモードの場合、今日のスケジュールのみをフィルタリング
										const filteredEvent =
											viewMode === "today"
												? {
														...event,
														schedules: event.schedules.filter((schedule) => {
															const today = new Date();
															return (
																schedule.date.year === today.getFullYear() &&
																schedule.date.month === today.getMonth() + 1 &&
																schedule.date.day === today.getDate()
															);
														}),
													}
												: event;
										return filteredEvent;
									})
									// フィルタリング後のスケジュールの中で最も早いものを比較
									.sort((a, b) => {
										const sorted = sortEventsByEarliestSchedule([a, b]);
										return sorted.indexOf(a) - sorted.indexOf(b);
									})
									.map((event) => {
										return (
											<EventCard
												key={event.title}
												event={event}
												selectedSchedules={selectedSchedules}
												onScheduleToggle={handleScheduleToggle}
												onBulkToggle={handleBulkToggle}
											/>
										);
									})
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
