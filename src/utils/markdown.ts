/**
 * 轻量级 Markdown 简单解析（纯正则，无依赖）
 * 支持：标题、粗体、斜体、代码、链接、图片、引用、换行
 *
 * 与评论区 CommentForm.vue 中的 simpleMarkdownParse 保持一致
 */
export function simpleMarkdownParse(text: string): string {
  if (!text.trim()) return "";

  // 使用不含下划线的占位符，避免被斜体规则处理
  const PLACEHOLDER_PREFIX = "\x00CB";
  const PLACEHOLDER_SUFFIX = "CB\x00";

  // 先提取代码块，用占位符替换，避免代码块内容被其他规则处理
  const codeBlocks: string[] = [];
  let html = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const index = codeBlocks.length;
    // 转义代码块内的 HTML 特殊字符
    const escapedCode = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    codeBlocks.push(`<pre><code>${escapedCode}</code></pre>`);
    return `${PLACEHOLDER_PREFIX}${index}${PLACEHOLDER_SUFFIX}`;
  });

  // 转义 HTML 特殊字符（防止 XSS）
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 标题 # ~ ######（需要在换行处理之前）
  html = html
    .replace(/^#{6}\s+(.+)$/gm, "<h6>$1</h6>")
    .replace(/^#{5}\s+(.+)$/gm, "<h5>$1</h5>")
    .replace(/^#{4}\s+(.+)$/gm, "<h4>$1</h4>")
    .replace(/^#{3}\s+(.+)$/gm, "<h3>$1</h3>")
    .replace(/^#{2}\s+(.+)$/gm, "<h2>$1</h2>")
    .replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");

  // 其他 Markdown 语法
  html = html
    // 行内代码 `code`
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // 图片 ![alt](url)
    .replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      '<img src="$2" alt="$1" style="max-width:100%;">'
    )
    // 链接 [text](url)
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    )
    // 粗体 **text** 或 __text__
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    // 斜体 *text* 或 _text_
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>")
    // 删除线 ~~text~~
    .replace(/~~([^~]+)~~/g, "<del>$1</del>")
    // 引用 > text（需要在换行处理之前）
    .replace(/^&gt;\s*(.+)$/gm, "<blockquote>$1</blockquote>")
    // 换行
    .replace(/\n/g, "<br>");

  // 合并连续的 blockquote
  html = html.replace(/<\/blockquote><br><blockquote>/g, "<br>");

  // 移除块级元素后面紧跟的 <br>
  html = html.replace(/<\/blockquote><br>/g, "</blockquote>");
  html = html.replace(/<\/h([1-6])><br>/g, "</h$1>");

  // 移除代码块前后的 <br>（代码块是块级元素）
  const placeholderRegex = new RegExp(
    `<br>(${PLACEHOLDER_PREFIX}\\d+${PLACEHOLDER_SUFFIX})`,
    "g"
  );
  const placeholderRegex2 = new RegExp(
    `(${PLACEHOLDER_PREFIX}\\d+${PLACEHOLDER_SUFFIX})<br>`,
    "g"
  );
  html = html.replace(placeholderRegex, "$1");
  html = html.replace(placeholderRegex2, "$1");

  // 还原代码块
  codeBlocks.forEach((block, index) => {
    html = html.replace(
      `${PLACEHOLDER_PREFIX}${index}${PLACEHOLDER_SUFFIX}`,
      block
    );
  });

  return html;
}

/**
 * 高亮代码块
 * @param container 包含代码块的容器元素
 */
export async function highlightCodeBlocks(
  container: HTMLElement | null
): Promise<void> {
  if (!container) return;

  const codeBlocks = container.querySelectorAll("pre code");
  if (codeBlocks.length === 0) return;

  // 动态导入 highlight.js
  const hljs = await import("highlight.js").then(m => m.default);

  codeBlocks.forEach(block => {
    // 移除之前的高亮标记，避免重复高亮
    block.removeAttribute("data-highlighted");
    hljs.highlightElement(block as HTMLElement);
  });
}
