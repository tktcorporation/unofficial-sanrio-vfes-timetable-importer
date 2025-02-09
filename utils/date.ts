export const calculateEndTime = (schedule: {
	year: number;
	month: number;
	day: number;
	hour: number;
	minute: number;
}) => {
	const startDate = new Date(
		schedule.year,
		schedule.month - 1,
		schedule.day,
		schedule.hour,
		schedule.minute,
	);
	const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

	return {
		date: `${String(endDate.getMonth() + 1).padStart(2, "0")}/${String(endDate.getDate()).padStart(2, "0")}`,
		time: `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`,
	};
};
