import { Calendar, Check, Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import type { Event, Schedule } from './types';

function App() {
	const [events, setEvents] = useState<Event[]>([]);
	const [selectedSchedules, setSelectedSchedules] = useState<
		Map<string, Event>
	>(new Map());
	const [isLoading, setIsLoading] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	useEffect(() => {
		fetch('http://localhost:3000/events')
			.then((response) => response.json())
			.then((data) => setEvents(data))
			.catch((error) => console.error('Failed to load events:', error));
	}, []);

	const handleScheduleToggle = (event: Event, schedule: Schedule) => {
		const times = Array.isArray(schedule.time)
			? schedule.time
			: [schedule.time];
		for (const time of times) {
			const key = `${schedule.date}-${time}`;
			const newSelected = new Map(selectedSchedules);
			if (newSelected.has(key)) {
				newSelected.delete(key);
			} else {
				newSelected.set(key, event);
			}
			setSelectedSchedules(newSelected);
		}
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
				alert('Events added to calendar successfully!');
				setSelectedSchedules(new Map());
			} else {
				throw new Error(result.error);
			}
		} catch (error) {
			console.error('Failed to add events:', error);
			alert('Failed to add events to calendar');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-100 py-8">
			<div className="max-w-4xl mx-auto px-4">
				<h1 className="text-3xl font-bold text-gray-900 mb-8">
					Event Calendar Registration
				</h1>

				<div className="grid gap-8 md:grid-cols-2">
					{events.map((event) => (
						<div
							key={`${event.title}-${event.platform.join('-')}`}
							className="bg-white rounded-lg shadow-md overflow-hidden"
						>
							<img
								src={event.image}
								alt={event.title}
								className="w-full h-48 object-cover"
							/>

							<div className="p-6">
								<h2 className="text-xl font-bold mb-2">{event.title}</h2>
								<div className="flex items-center text-gray-600 mb-4">
									<span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
										{event.platform.join(', ')}
									</span>
								</div>

								<div className="space-y-3">
									<h3 className="text-lg font-semibold">
										Available Schedules:
									</h3>
									{event.schedules.map((schedule, scheduleIndex) => {
										const times = Array.isArray(schedule.time)
											? schedule.time
											: [schedule.time];
										return times.map((time, timeIndex) => {
											const key = `${schedule.date}-${time}`;
											const isSelected = selectedSchedules.has(key);

											return (
												<button
													key={`${schedule.date}-${time}`}
													onClick={() =>
														handleScheduleToggle(event, { ...schedule, time })
													}
													type="button"
													className={`w-full p-3 border rounded-lg cursor-pointer transition-colors text-left
                            ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
												>
													<div className="flex items-center justify-between">
														<div>
															<span className="font-medium">
																{schedule.date}
															</span>
															<span className="mx-2">at</span>
															<span className="font-medium">{time}</span>
														</div>
														{isSelected && (
															<Check className="text-blue-500 w-5 h-5" />
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
