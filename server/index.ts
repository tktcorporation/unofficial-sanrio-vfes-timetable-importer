import { zValidator } from "@hono/zod-validator";
import type { Context } from "hono";
// server/index.ts
import { Hono } from "hono";
import type { z } from "zod";
import {
	type CalendarValidatedContext,
	calendarEventSchema,
	generateCancelICS,
	generateICS,
	getEvents,
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

function createValidatedContext(
	c: Context,
	events: z.infer<typeof calendarEventSchema>,
): CalendarValidatedContext {
	return {
		...c,
		req: {
			...c.req,
			valid: <K extends "json">(target: K) => {
				if (target === "json") {
					return events;
				}
				throw new Error(`Invalid target: ${target}`);
			},
		},
	} as CalendarValidatedContext;
}

const routes = app
	.get("/api", (c) => {
		return c.json({
			message: "Hello",
			var: c.env.MY_VAR,
		});
	})
	.get("/events", getEvents)
	.post("/calendar/ics", zValidator("json", calendarEventSchema), (c) => {
		const events = c.req.valid("json");
		return generateICS(createValidatedContext(c, events));
	})
	.post(
		"/calendar/cancel-ics",
		zValidator("json", calendarEventSchema),
		(c) => {
			const events = c.req.valid("json");
			return generateCancelICS(createValidatedContext(c, events));
		},
	);

export type AppType = typeof routes;

export default app;
