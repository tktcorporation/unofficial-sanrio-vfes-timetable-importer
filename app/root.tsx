import { Links, type LinksFunction, Outlet, Scripts } from "react-router";
import stylesheet from "./app.css?url";

const GoogleAnalytics = ({ measurementId }: { measurementId: string }) => {
	return (
		<>
			<script
				async
				src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
				suppressHydrationWarning
			/>
			<script
				suppressHydrationWarning
				// biome-ignore lint/security/noDangerouslySetInnerHtml: Google Analytics の初期化コードのため許容
				dangerouslySetInnerHTML={{
					__html: `
						window.dataLayer = window.dataLayer || [];
						function gtag(){dataLayer.push(arguments);}
						gtag('js', new Date());
						gtag('config', '${measurementId}');
					`,
				}}
			/>
		</>
	);
};

export const links: LinksFunction = () => [
	{ rel: "icon", href: "/favicon.ico" },
	{ rel: "manifest", href: "/site.webmanifest" },
	{ rel: "stylesheet", href: stylesheet },
];

export function Layout({ children }: { children: React.ReactNode }) {
	const GA_MEASUREMENT_ID = "G-P4KGN8TR8C";

	return (
		<html lang="ja">
			<head>
				<meta charSet="utf-8" />
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1.0, maximum-scale=5.0"
				/>
				<meta
					name="description"
					content="サンリオVfesのタイムテーブルをカレンダーに簡単にインポートできる非公式ツール。アーティストライブのスケジュールを簡単にカレンダー登録できます。"
				/>
				<meta
					property="og:title"
					content="サンリオVfes 2025 非公式カレンダー登録ツール"
				/>
				<meta property="og:type" content="website" />
				<meta
					property="og:url"
					content="https://sanrio-vfes-events.btb.workers.dev/"
				/>
				<meta
					property="og:image"
					content="https://sanrio-vfes-events.btb.workers.dev/ogp.png"
				/>
				<meta
					property="og:image:alt"
					content="サンリオVfes2025 カレンダー登録ツールのプレビュー画像"
				/>
				<meta property="og:image:type" content="image/png" />
				<meta property="og:image:width" content="1200" />
				<meta property="og:image:height" content="630" />
				<meta property="og:locale" content="ja_JP" />
				<meta
					property="og:description"
					content="サンリオVfes2025のタイムテーブルを簡単にカレンダー登録できる非公式ツール"
				/>
				<meta
					property="og:site_name"
					content="サンリオVfes 非公式カレンダーツール"
				/>
				<meta name="twitter:card" content="summary_large_image" />
				<meta name="twitter:site" content="@tktcorporation" />
				<meta
					name="twitter:image:alt"
					content="サンリオVfes2025 カレンダー登録ツールのプレビュー画像"
				/>
				<meta name="theme-color" content="#4464EF" />

				<GoogleAnalytics measurementId={GA_MEASUREMENT_ID} />
				<Links />
			</head>
			<body>
				<header className="bg-white shadow-sm">
					<div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
						<h1 className="text-lg font-semibold text-gray-900">
							サンリオVfes 2025 をカレンダー登録！
						</h1>
						<div className="flex items-center gap-2">
							<a
								href="https://github.com/tktcorporation/unofficial-sanrio-vfes-timetable-importer"
								target="_blank"
								rel="noopener noreferrer"
								className="text-gray-600 hover:text-gray-900"
							>
								<svg
									className="h-6 w-6"
									fill="currentColor"
									viewBox="0 0 24 24"
									aria-labelledby="github-title"
								>
									<title id="github-title">GitHub</title>
									<path
										fillRule="evenodd"
										d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
										clipRule="evenodd"
									/>
								</svg>
							</a>
							<a
								href="https://twitter.com/tktcorporation"
								target="_blank"
								rel="noopener noreferrer"
								className="text-gray-600 hover:text-gray-900"
							>
								<svg
									className="h-6 w-6"
									fill="currentColor"
									viewBox="0 0 24 24"
									aria-labelledby="x-title"
								>
									<title id="x-title">X（Twitter）</title>
									<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
								</svg>
							</a>
						</div>
					</div>
				</header>
				{children}
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}
