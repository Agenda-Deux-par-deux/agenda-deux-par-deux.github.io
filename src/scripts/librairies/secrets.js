window.SECRETS = (async () => {
	try {
		const response = await fetch(atob('L2J0MW9oOTdqN1guanNvbg=='));
		if (!response.ok) throw new Error(`Error loading secrets: ${response.status}`);
		return response.json();
	} catch (error) {
		console.error(error.message);
	}
})();