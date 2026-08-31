const EMPTY_EDITOR_HTML = /^(\s|<p><br><\/p>|<p>\s*<\/p>)*$/i;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function objectivesToEditorHtml(
  objectives: string[] | null | undefined,
): string {
  if (!objectives?.length) return '';

  const joined = objectives.join('').trim();
  if (objectives.length === 1 && /<[a-z][\s\S]*>/i.test(joined)) {
    return joined;
  }

  const items = objectives
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `<li><p>${escapeHtml(item)}</p></li>`)
    .join('');

  return items ? `<ul>${items}</ul>` : '';
}

export function objectivesFromEditorHtml(html: string): string[] | undefined {
  const trimmed = html.trim();
  if (!trimmed || EMPTY_EDITOR_HTML.test(trimmed)) {
    return undefined;
  }
  return [trimmed];
}
