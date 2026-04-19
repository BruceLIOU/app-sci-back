/**
 * Replaces {{variable}} placeholders in a template string.
 * Unknown variables are left unchanged.
 */
export function interpolateTemplate(
	template: string,
	vars: Record<string, string>,
): string {
	return template.replace(
		/\{\{(\w+)\}\}/g,
		(_, key) => vars[key] ?? `{{${key}}}`,
	);
}
