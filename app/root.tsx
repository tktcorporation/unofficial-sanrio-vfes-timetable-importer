import { type LinksFunction, Outlet, Scripts } from "react-router";
import stylesheet from "./app.css?url";

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
				<link rel="stylesheet" href={stylesheet} />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	);
}

export const links: LinksFunction = () => [
	{ rel: "stylesheet", href: stylesheet },
];

export default function App() {
	return <Outlet />;
}
