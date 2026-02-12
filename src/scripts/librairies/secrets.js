window.SECRETS = (async () => {
	try {
		const response = await fetch(atob('L2J0MW9oOTdqN1guYmlu'), { cache: 'no-store' });
		if (!response.ok) throw new Error(`Error loading secrets: ${response.status}`);
		return JSON.parse(atob((await response.text()).trim().replace(/[A-Za-z]/g, c => {
			const base = c <= 'Z' ? 65 : 97;
			return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
		})));
	} catch (error) {
		console.error(error.message);
	}
})();