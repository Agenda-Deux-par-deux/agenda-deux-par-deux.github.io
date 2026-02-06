const path = require("node:path");
const { createWatchers, buildCSS, buildJS } = require("chokibasic");

const { close } = createWatchers(
	[
		{
			name: "js",
			patterns: ["src/scripts/**/*.js"],
			ignored: ["**/*.min.js"],
			debounceMs: 150,
			callback: async (events) => {
				console.log("[js] batch", events.length, events.map(e => e.file));
				const entry = path.resolve(__dirname, "../src/scripts/agenda.core.js");
				const outfile = path.resolve(__dirname, "../src/scripts/agenda.core.min.js");
				await buildJS(entry, outfile);
			},
		},
		{
			name: "scss",
			patterns: ["src/styles/**/*.scss"],
			debounceMs: 150,
			callback: async (events) => {
				console.log("[scss] batch", events.length, events.map(e => e.file));
				const inputScss = path.resolve(__dirname, "../src/styles/agenda.core.scss");
				const outCssMin = path.resolve(__dirname, "../src/styles/agenda.core.min.css");
				await buildCSS(inputScss, outCssMin);
			},
		},
	],
	{
		cwd: process.cwd(),
		debug: true
	}
);

process.on("SIGINT", async () => {
	await close();
	process.exit(0);
});




