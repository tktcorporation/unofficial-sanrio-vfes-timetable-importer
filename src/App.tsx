import { Calendar, Check, Loader2, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import type { Event, Schedule } from './types';

function App() {
	const [events, setEvents] = useState<Event[]>([]);
	const [selectedSchedules, setSelectedSchedules] = useState<
		Map<string, Event>
	>(new Map());
	const [isLoading, setIsLoading] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [notification, setNotification] = useState<{
		type: 'success' | 'error';
		message: string;
	} | null>(null);

	useEffect(() => {
		fetch('http://localhost:3000/events')
			.then((response) => response.json())
			.then((data) => setEvents(data.events))
			.catch((error) => console.error('Failed to load events:', error));
	}, []);

	const handleScheduleToggle = (event: Event, schedule: Schedule) => {
		const time = Array.isArray(schedule.time) ? schedule.time[0] : schedule.time;
		const key = `${schedule.date.month}/${schedule.date.day}-${time.hour}:${time.minute}`;
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
			const response = await fetch('http://localhost:3000/auth/url');
			const { url } = await response.json();
			window.location.href = url;
		} catch (error) {
			console.error('Authentication error:', error);
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
					const [date, time] = key.split('-');
					return {
						...event,
						date,
						time,
					};
				},
			);

			const response = await fetch('http://localhost:3000/calendar/add', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ events: selectedEvents }),
			});

			const result = await response.json();
			if (result.success) {
				setNotification({
					type: 'success',
					message: 'イベントがカレンダーに追加されました！',
				});
				setSelectedSchedules(new Map());
			} else {
				throw new Error(result.error);
			}
		} catch (error) {
			console.error('Failed to add events:', error);
			setNotification({
				type: 'error',
				message: 'カレンダーへの追加に失敗しました。',
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-100 py-8">
			<div className="max-w-4xl mx-auto px-4">
				<h1 className="text-3xl font-bold text-gray-900 mb-8">
					イベントカレンダー登録
				</h1>

				{notification && (
					<div
						className={`mb-4 p-4 rounded-lg flex items-center justify-between ${
							notification.type === 'success'
								? 'bg-green-100 text-green-800'
								: 'bg-red-100 text-red-800'
						}`}
					>
						<span>{notification.message}</span>
						<button
							onClick={() => setNotification(null)}
							className="text-gray-500 hover:text-gray-700"
						>
							<X className="w-4 h-4" />
						</button>
					</div>
				)}

				<div className="mb-6">
					<button
						type="button"
						onClick={handleAddToCalendar}
						disabled={selectedSchedules.size === 0 || isLoading}
						className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white text-lg font-semibold
              ${
								selectedSchedules.size === 0
									? 'bg-gray-400 cursor-not-allowed'
									: 'bg-blue-600 hover:bg-blue-700'
							}`}
					>
						{isLoading ? (
							<Loader2 className="w-6 h-6 animate-spin" />
						) : (
							<Calendar className="w-6 h-6" />
						)}
						{isAuthenticated
							? 'Google Calendarに追加'
							: 'Googleアカウントでログイン'}
					</button>
				</div>

				{selectedSchedules.size > 0 && (
					<div className="mb-6 bg-white rounded-lg shadow-md p-4">
						<h2 className="text-lg font-semibold mb-3">選択中の予定</h2>
						<div className="space-y-2">
							{Array.from(selectedSchedules.entries()).map(([key, event]) => {
								const [date, time] = key.split('-');
								return (
									<div
										key={key}
										className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
									>
										<div>
											<span className="font-medium">{event.title}</span>
											<span className="text-gray-500 ml-2">
												{`${date.replace('/', '月')}日 ${time}:00`}
											</span>
										</div>
										<button
											onClick={() => {
												const newSelected = new Map(selectedSchedules);
												newSelected.delete(key);
												setSelectedSchedules(newSelected);
											}}
											className="text-gray-400 hover:text-red-500"
										>
											<X className="w-4 h-4" />
										</button>
									</div>
								);
							})}
						</div>
					</div>
				)}

				<div className="grid gap-4 md:grid-cols-3">
					{events.map((event) => (
						<div
							key={`${event.title}`}
							className="bg-white rounded-lg shadow-md overflow-hidden"
						>
							<img
								src={event.image}
								alt={event.title}
								className="w-full h-32 object-cover"
							/>

							<div className="p-4">
								<h2 className="text-lg font-bold mb-1">{event.title}</h2>
								<div className="flex items-center text-gray-600 mb-2 gap-1">
									{event.platform.map((platform) => (
										<span
											key={platform}
											className={`text-xs font-medium px-1.5 py-0.5 rounded ${
												platform === 'PC'
													? 'bg-blue-100 text-blue-800'
													: 'bg-green-100 text-green-800'
											}`}
										>
											{platform}
										</span>
									))}
								</div>

								<div className="space-y-2">
									{event.schedules.map((schedule, scheduleIndex) => {
										const times = Array.isArray(schedule.time)
											? schedule.time
											: [schedule.time];
										return times.map((time, timeIndex) => {
											const key = `${schedule.date.month}/${schedule.date.day}-${time.hour}:${time.minute}`;
											const isSelected = selectedSchedules.has(key);

											return (
												<button
													key={`${schedule.date}-${time}`}
													onClick={() =>
														handleScheduleToggle(event, { ...schedule, time })
													}
													type="button"
													className={`w-full p-2 border rounded-md cursor-pointer transition-colors text-left text-sm
                            ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
												>
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-1">
															<span className="font-medium">
																{`${schedule.date.month}/${schedule.date.day}`}
															</span>
															<span className="text-gray-500">
																{`${time.hour}:${time.minute}`}
															</span>
														</div>
														{isSelected && (
															<Check className="text-blue-500 w-4 h-4" />
														)}
													</div>
												</button>
											);
										});
									})}
								</div>
							</div>
						</div>
					))}
				</div>

				<div className="mt-8">
					<button
						type="button"
						onClick={handleAddToCalendar}
						disabled={selectedSchedules.size === 0 || isLoading}
						className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white text-lg font-semibold
              ${
								selectedSchedules.size === 0
									? 'bg-gray-400 cursor-not-allowed'
									: 'bg-blue-600 hover:bg-blue-700'
							}`}
					>
						{isLoading ? (
							<Loader2 className="w-6 h-6 animate-spin" />
						) : (
							<Calendar className="w-6 h-6" />
						)}
						{isAuthenticated
							? 'Add Selected Events to Google Calendar'
							: 'Sign in with Google'}
					</button>
				</div>
			</div>
		</div>
	);
}

export default App;
