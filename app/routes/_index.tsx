import { useEvents } from "app/composables/useEvents";
import { useICSDownload } from "app/composables/useICSDownload";
import { useNotification } from "app/composables/useNotification";
import {
	decompressSchedules,
	generateShareUrl,
} from "app/composables/useScheduleShare";
import { useStepper } from "app/composables/useStepper";
import { ChevronLeft, ChevronRight, Clock, List } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { BulkSelectButton } from "../components/BulkSelectButton";
import { CancelGuide } from "../components/CancelGuide";
import { EventCard } from "../components/EventCard";
import { EventTimeline } from "../components/EventTimeline";
import { FilterOptions } from "../components/FilterOptions";
import { Notification } from "../components/Notification";
import { SelectedSchedules } from "../components/SelectedSchedules";
import { ShareModal } from "../components/ShareModal";
import { StepActions } from "../components/StepActions";
import { defaultSteps, Stepper } from "../components/Stepper";
import { useEventSorting } from "../hooks/useEventSorting";
import { useFilteredEvents } from "../hooks/useFilteredEvents";
import { cn } from "../lib/utils";
import type { Route } from "./+types/_index";

export const loader = (args: Route.LoaderArgs) => {
	const extra = args.context.extra;
	const cloudflare = args.context.cloudflare;
	const myVarInVariables = args.context.hono.context.get("MY_VAR_IN_VARIABLES");
	const isWaitUntilDefined = !!cloudflare.ctx.waitUntil;
	return { cloudflare, extra, myVarInVariables, isWaitUntilDefined };
};

// Empty state component
function EmptyState({
	title,
	description,
	action,
}: {
	title: string;
	description: string;
	action?: { label: string; onClick: () => void };
}) {
	return (
		<div className="kawaii-card p-8 text-center">
			<h3 className="text-lg font-bold text-kawaii-text mb-2 text-balance">
				{title}
			</h3>
			<p className="text-kawaii-text-muted text-sm mb-4 text-pretty">
				{description}
			</p>
			{action && (
				<button
					type="button"
					onClick={action.onClick}
					className="kawaii-btn-primary px-6 py-2 text-sm"
				>
					{action.label}
				</button>
			)}
		</div>
	);
}

export default function Index(_props: Route.ComponentProps) {
	const [searchParams] = useSearchParams();
	const [isShareModalOpen, setIsShareModalOpen] = useState(false);
	const [shareUrl, setShareUrl] = useState("");
	const [hasInitialized, setHasInitialized] = useState(false);
	const [selectedFloors, setSelectedFloors] = useState<string[]>([]);
	const [showUpcomingOnly, setShowUpcomingOnly] = useState(true);
	const [viewMode, setViewMode] = useState<"floor" | "today">("today");
	const [todayViewMode, setTodayViewMode] = useState<"timeline" | "list">(
		"list",
	);
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [hasSetInitialDate, setHasSetInitialDate] = useState(false);

	const {
		isLoading: isEventsLoading,
		events,
		selectedSchedules,
		setSelectedSchedules,
		handleScheduleToggle,
		handleBulkToggle,
	} = useEvents();

	// イベントがない日の場合はイベント一覧タブに切り替え
	useEffect(() => {
		if (isEventsLoading || hasSetInitialDate || events.length === 0) return;

		const today = new Date();
		const hasEventsToday = events.some((event) =>
			event.schedules.some(
				(schedule) =>
					schedule.date.year === today.getFullYear() &&
					schedule.date.month === today.getMonth() + 1 &&
					schedule.date.day === today.getDate(),
			),
		);

		if (!hasEventsToday) {
			// 今日のイベントがない場合はイベント一覧タブに切り替えて全体感を把握できるようにする
			setViewMode("floor");
		}
		setHasSetInitialDate(true);
	}, [isEventsLoading, events, hasSetInitialDate]);
	const { notification, showNotification, clearNotification } =
		useNotification();
	const { isLoading, downloadICS, downloadCancelICS } = useICSDownload();
	const { currentStep, nextStep, backStep, setStep } = useStepper();
	const { sortEventsByEarliestSchedule } = useEventSorting();
	const { getFilteredEvents } = useFilteredEvents();

	// フィルタリング結果を計算
	const filteredEvents = !isEventsLoading
		? getFilteredEvents({
				events,
				viewMode,
				selectedFloors,
				showUpcomingOnly,
				selectedDate,
			}).sort((a, b) => {
				// schedulesの数が100件以上の場合は後ろにまわす
				const aScheduleCount = a.schedules.length;
				const bScheduleCount = b.schedules.length;

				// どちらかが100件以上の場合、少ない方を優先
				const THRESHOLD = 100;
				if (aScheduleCount >= THRESHOLD || bScheduleCount >= THRESHOLD) {
					if (aScheduleCount >= THRESHOLD && bScheduleCount < THRESHOLD)
						return 1;
					if (bScheduleCount >= THRESHOLD && aScheduleCount < THRESHOLD)
						return -1;
				}

				// それ以外は通常のソート
				const sorted = sortEventsByEarliestSchedule([a, b]);
				return sorted.indexOf(a) - sorted.indexOf(b);
			})
		: [];

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

	const formatDate = (date: Date) => {
		const month = date.getMonth() + 1;
		const day = date.getDate();
		const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
		return `${month}/${day}(${dayOfWeek})`;
	};

	const getDateHeaderTitle = (date: Date) => {
		if (isToday(date)) {
			return "今日のイベント";
		}
		const month = date.getMonth() + 1;
		const day = date.getDate();
		return `${month}月${day}日のイベント`;
	};

	const handleDateChange = (direction: "prev" | "next") => {
		const newDate = new Date(selectedDate);
		if (direction === "prev") {
			newDate.setDate(newDate.getDate() - 1);
		} else {
			newDate.setDate(newDate.getDate() + 1);
		}
		setSelectedDate(newDate);
	};

	const isToday = (date: Date) => {
		const today = new Date();
		return (
			date.getDate() === today.getDate() &&
			date.getMonth() === today.getMonth() &&
			date.getFullYear() === today.getFullYear()
		);
	};

	const handleFloorToggle = (floor: string) => {
		setSelectedFloors((prev) => {
			if (prev.includes(floor)) {
				return prev.filter((f) => f !== floor);
			}
			return [...prev, floor];
		});
	};

	const resetFilters = () => {
		setSelectedFloors([]);
		setShowUpcomingOnly(true);
	};

	return (
		<div className="min-h-dvh overflow-x-hidden bg-kawaii-bg py-6">
			<div className="max-w-6xl mx-auto px-2 pb-24 text-xs">
				<div className="text-kawaii-text-muted mb-8 flex justify-between items-center gap-4">
					<p className="text-pretty">
						これは非公式ツールです。イベントの詳細は
						<a
							href="https://v-fes.sanrio.co.jp/"
							target="_blank"
							rel="noopener noreferrer"
							className="text-kawaii-pink hover:underline"
						>
							サンリオVfes公式サイト
						</a>
						をご確認ください。
					</p>
					<a
						href="https://docs.google.com/forms/d/e/1FAIpQLSe78zLbRK8ZrP_cFeaoQMMmHMK6OFfFd1Ay63cfMCGa3TKMMA/viewform?usp=sharing"
						target="_blank"
						rel="noopener noreferrer"
						className="text-kawaii-lavender hover:text-kawaii-pink hover:underline whitespace-nowrap"
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
							<FilterOptions
								viewMode={viewMode}
								selectedFloors={selectedFloors}
								events={events}
								onViewModeChange={setViewMode}
								onFloorToggle={handleFloorToggle}
							/>

							<div className="flex justify-between items-center">
								<div className="flex items-center gap-4">
									{viewMode !== "today" && (
										<label className="flex items-center gap-1 text-sm text-gray-600">
											<input
												type="checkbox"
												checked={showUpcomingOnly}
												onChange={(e) => setShowUpcomingOnly(e.target.checked)}
												className="size-4 accent-gray-500 border-gray-300 rounded focus:ring-0"
											/>
											未開催のみ
										</label>
									)}
								</div>
								{!isEventsLoading && (
									<BulkSelectButton
										filteredEvents={filteredEvents}
										selectedSchedules={selectedSchedules}
										onBulkToggle={handleBulkToggle}
									/>
								)}
							</div>
						</div>

						{/* B4Fの場合はチケットの購入案内リンクを入れる */}
						{viewMode === "floor" && selectedFloors.includes("B4F") && (
							<div>
								<a
									href="https://v-fes.sanrio.co.jp/ticket/"
									target="_blank"
									rel="noopener noreferrer"
									className="text-kawaii-pink hover:underline"
								>
									アーティストライブチケットの購入はこちらから。
								</a>
							</div>
						)}
						{/* 4Fの場合はチケットの購入案内リンクを入れる */}
						{viewMode === "floor" && selectedFloors.includes("4F") && (
							<div>
								<a
									href="https://v-fes.sanrio.co.jp/pmgt"
									target="_blank"
									rel="noopener noreferrer"
									className="text-kawaii-pink hover:underline"
								>
									サンリオバーチャルグリーティングは有料イベントです。詳しくはこちら。
								</a>
							</div>
						)}

						{viewMode === "today" ? (
							<div className="space-y-3">
								<h2 className="text-lg font-bold text-kawaii-text text-center">
									{getDateHeaderTitle(selectedDate)}
								</h2>
								<div className="bg-white/80 backdrop-blur-sm px-4 rounded-2xl border-2 border-kawaii-pink-light/50">
									<div className="max-w-6xl mx-auto flex items-center justify-between">
										<div className="w-[80px]" />
										<div className="flex items-center gap-1">
											<button
												type="button"
												onClick={() => handleDateChange("prev")}
												className="p-2 rounded-xl text-kawaii-text hover:text-kawaii-pink transition-colors"
												aria-label="前日"
											>
												<ChevronLeft size={18} />
											</button>
											<div className="flex items-center gap-1">
												{isToday(selectedDate) ? (
													<div className="inline-flex items-center gap-2 px-1 py-1 font-medium min-w-[80px] justify-center">
														<span className="px-3 py-1 bg-kawaii-pink-light rounded-xl text-kawaii-pink font-semibold tabular-nums">
															{formatDate(selectedDate)}
														</span>
													</div>
												) : (
													<button
														type="button"
														onClick={() => setSelectedDate(new Date())}
														className="inline-flex items-center gap-2 px-3 py-2 text-kawaii-text hover:text-kawaii-pink rounded-xl transition-colors min-w-[80px] justify-center font-medium tabular-nums"
													>
														<span>{formatDate(selectedDate)}</span>
													</button>
												)}
											</div>
											<button
												type="button"
												onClick={() => handleDateChange("next")}
												className="p-2 rounded-xl text-kawaii-text hover:text-kawaii-pink transition-colors"
												aria-label="翌日"
											>
												<ChevronRight size={18} />
											</button>
										</div>
										<div className="inline-flex rounded-xl bg-kawaii-pink-light/30 p-1 w-[80px]">
											<button
												type="button"
												onClick={() => setTodayViewMode("timeline")}
												className={cn(
													"p-2 rounded-lg transition-colors",
													todayViewMode === "timeline"
														? "bg-white text-kawaii-pink shadow-sm"
														: "text-kawaii-text-muted hover:text-kawaii-pink",
												)}
												aria-label="タイムライン表示"
											>
												<Clock size={18} />
											</button>
											<button
												type="button"
												onClick={() => setTodayViewMode("list")}
												className={cn(
													"p-2 rounded-lg transition-colors",
													todayViewMode === "list"
														? "bg-white text-kawaii-pink shadow-sm"
														: "text-kawaii-text-muted hover:text-kawaii-pink",
												)}
												aria-label="リスト表示"
											>
												<List size={18} />
											</button>
										</div>
									</div>
								</div>

								{/* Empty state for today view */}
								{!isEventsLoading && filteredEvents.length === 0 && (
									<EmptyState
										title="この日のイベントはありません"
										description="他の日付を選択するか、フィルターを変更してください。"
										action={{
											label: "今日に戻る",
											onClick: () => setSelectedDate(new Date()),
										}}
									/>
								)}

								{filteredEvents.length > 0 &&
									(todayViewMode === "timeline" ? (
										<EventTimeline
											events={filteredEvents}
											selectedSchedules={selectedSchedules}
											onScheduleToggle={handleScheduleToggle}
											selectedDate={selectedDate}
										/>
									) : (
										<div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
											{filteredEvents.map((event) => (
												<EventCard
													key={event.title}
													event={event}
													selectedSchedules={selectedSchedules}
													onScheduleToggle={handleScheduleToggle}
													onBulkToggle={handleBulkToggle}
												/>
											))}
										</div>
									))}
							</div>
						) : (
							<div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
								{isEventsLoading ? (
									[
										"top",
										"middle-1",
										"middle-2",
										"middle-3",
										"middle-4",
										"bottom",
									].map((id) => (
										<div key={id} className="kawaii-card p-4 animate-pulse">
											<div className="h-4 bg-kawaii-pink-light rounded-lg w-3/4 mb-4" />
											<div className="space-y-3">
												<div className="h-3 bg-kawaii-lavender-light rounded-lg" />
												<div className="h-3 bg-kawaii-pink-light rounded-lg w-5/6" />
												<div className="h-3 bg-kawaii-mint-light rounded-lg w-4/6" />
											</div>
										</div>
									))
								) : filteredEvents.length === 0 ? (
									<div className="col-span-full">
										<EmptyState
											title="条件に合うイベントがありません"
											description="フィルターを変更して、もう一度お試しください。"
											action={{
												label: "フィルターをリセット",
												onClick: resetFilters,
											}}
										/>
									</div>
								) : (
									filteredEvents.map((event) => (
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
						)}
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
