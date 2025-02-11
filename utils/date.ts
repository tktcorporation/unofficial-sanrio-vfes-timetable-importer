export const calculateEndTime = (schedule: {
	startDateTime: {
		year: number;
		month: number;
		day: number;
		hour: number;
		minute: number;
	};
	timeSlotMinutes: number;
}) => {
	const startDate = new Date(
		schedule.startDateTime.year,
		schedule.startDateTime.month - 1,
		schedule.startDateTime.day,
		schedule.startDateTime.hour,
		schedule.startDateTime.minute,
	);
	const endDate = new Date(
		startDate.getTime() + schedule.timeSlotMinutes * 60 * 1000,
	);

	return {
		date: `${String(endDate.getMonth() + 1).padStart(2, "0")}/${String(endDate.getDate()).padStart(2, "0")}`,
		time: `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`,
	};
};
