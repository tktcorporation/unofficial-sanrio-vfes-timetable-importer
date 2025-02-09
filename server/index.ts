import { zValidator } from "@hono/zod-validator";
// server/index.ts
import { Hono } from "hono";
import {
	addToCalendar,
	calendarEventSchema,
	generateCancelICS,
	generateICS,
	getAuthUrl,
	getEvents,
	handleAuthCallback,
} from "./controller";

const app = new Hono<{
	Bindings: {
		MY_VAR: string;
		GOOGLE_CLIENT_ID: string;
		GOOGLE_CLIENT_SECRET: string;
	};
	Variables: {
		MY_VAR_IN_VARIABLES: string;
	};
}>();

app.use(async (c, next) => {
	c.set("MY_VAR_IN_VARIABLES", "My variable set in c.set");
	await next();
	c.header("X-Powered-By", "React Router and Hono");
});

const routes = app
	.get("/api", (c) => {
		return c.json({
			message: "Hello",
			var: c.env.MY_VAR,
		});
	})
	.get("/events", getEvents)
	.get("/auth/url", getAuthUrl)
	.post("/auth/callback", handleAuthCallback)
	.post("/calendar/add", addToCalendar)
	.post("/calendar/ics", generateICS)
	.post(
		"/calendar/cancel-ics",
		zValidator("json", calendarEventSchema),
		(c) => {
			const events = c.req.valid("json");
			return generateCancelICS(c, events);
		},
	);

export type AppType = typeof routes;

export default app;
