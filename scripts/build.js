const path = require("path");
const { buildCSS, buildJS } = require("chokibasic");

(async () => {
	await buildJS(
		path.resolve(__dirname, "../src/scripts/agenda.core.js"),
		path.resolve(__dirname, "../src/scripts/agenda.core.min.js")
	);

	await buildJS(
		path.resolve(__dirname, "../src/service/scripts/agenda.core.js"),
		path.resolve(__dirname, "../src/service/scripts/agenda.core.min.js")
	);

	await buildCSS(
		path.resolve(__dirname, "../src/styles/agenda.core.scss"),
		path.resolve(__dirname, "../src/styles/agenda.core.min.css")
	);

	await buildCSS(
		path.resolve(__dirname, "../src/service/styles/agenda.core.scss"),
		path.resolve(__dirname, "../src/service/styles/agenda.core.min.css")
	);
})();
