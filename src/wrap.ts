export function wrapToWidth(text: string, maxWidth: number): string[] {
	if (maxWidth <= 0) return [text];

	const lines: string[] = [];
	let current = "";
	let currentWidth = 0;

	for (let i = 0; i < text.length; i++) {
		if (text.charCodeAt(i) === 0x1b && i + 1 < text.length && text[i + 1] === "[") {
			const end = text.indexOf("m", i + 2);
			if (end !== -1) {
				current += text.slice(i, end + 1);
				i = end;
				continue;
			}
		}

		if (currentWidth >= maxWidth) {
			lines.push(current);
			current = "";
			currentWidth = 0;
		}
		current += text[i];
		currentWidth++;
	}

	if (current) lines.push(current);
	return lines.length > 0 ? lines : [""];
}
