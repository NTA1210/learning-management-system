import { marked } from "marked";
import DOMPurify from "dompurify";

marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: true,
  mangle: false,
});

export function renderMarkdown(value: string) {
  if (!value) return "";
  const rawHtml = marked.parse(value);
  return DOMPurify.sanitize(typeof rawHtml === "string" ? rawHtml : "");
}

