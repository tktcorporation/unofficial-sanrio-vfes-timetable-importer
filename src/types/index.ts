export interface Schedule {
  date: string;
  time: string | string[];
}

export interface Event {
  platform: string[];
  title: string;
  image: string;
  schedules: Schedule[];
}
