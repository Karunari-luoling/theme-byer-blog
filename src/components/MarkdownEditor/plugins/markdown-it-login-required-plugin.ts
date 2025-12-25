/*
 * @Description: 登录后可见内容插件 - PRO版本特有功能
 * @Author: 安知鱼
 * @Date: 2025-10-25 12:00:00
 */
import type MarkdownIt from "markdown-it";

export default function loginRequiredContentPlugin(md: MarkdownIt): void {
  function loginRequiredContentBlockRule(
    state: any,
    startLine: number,
    endLine: number,
    silent: boolean
  ): boolean {
    const startMarker = ":::";
    const startTag = "login-required";
    let pos = state.bMarks[startLine] + state.tShift[startLine];
    let max = state.eMarks[startLine];

    // 如果行太短，无法包含标记，则跳过
    if (pos + startMarker.length > max) {
      return false;
    }

    // 检查是否是 ::: 开头
    if (
      state.src.charCodeAt(pos) !== 0x3a /* : */ ||
      state.src.charCodeAt(pos + 1) !== 0x3a /* : */ ||
      state.src.charCodeAt(pos + 2) !== 0x3a /* : */
    ) {
      return false;
    }

    // 检查 ::: 后面是否是 login-required，支持参数
    const params = state.src.slice(pos + startMarker.length, max).trim();
    if (!params.startsWith(startTag)) {
      return false;
    }

    // 保存开始行的位置信息，用于后续解析参数
    const startPos = pos;
    const startMax = max;

    // 寻找结束标记 :::
    let nextLine = startLine + 1;
    let endLineFound = false;
    while (nextLine < endLine) {
      pos = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];
      const lineText = state.src.slice(pos, max).trim();
      if (lineText === startMarker) {
        endLineFound = true;
        break;
      }
      nextLine++;
    }

    if (!endLineFound) {
      return false;
    }

    if (silent) {
      return true;
    }

    // 解析参数（使用开始行的位置信息）
    const fullParams = state.src
      .slice(startPos + startMarker.length, startMax)
      .trim();
    const paramString = fullParams.substring(startTag.length).trim();

    // 默认值
    let id = "";
    let title = "登录后可查看";
    let hint = "此内容需要登录后才能查看";

    // 解析参数（支持 id="唯一ID" title="标题" hint="提示信息" 格式）
    if (paramString) {
      const idMatch = paramString.match(/id\s*=\s*["']([^"']+)["']/);
      const titleMatch = paramString.match(/title\s*=\s*["']([^"']+)["']/);
      const hintMatch = paramString.match(/hint\s*=\s*["']([^"']+)["']/);

      if (idMatch) {
        id = idMatch[1];
      }

      if (titleMatch) {
        title = titleMatch[1];
      }

      if (hintMatch) {
        hint = hintMatch[1];
      }
    }

    // 提取内容
    const content = state.src.slice(
      state.bMarks[startLine + 1],
      state.bMarks[nextLine]
    );

    // 使用解析的ID或生成默认ID
    let contentId = id;
    if (!contentId) {
      if (!state.env.loginRequiredContentCount) {
        state.env.loginRequiredContentCount = 0;
      }
      state.env.loginRequiredContentCount++;
      contentId = `login-required-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )
        .toString()
        .padStart(3, "0")}`;
    }

    // 在编辑器预览模式下，解析内部markdown并直接显示
    // 直接使用markdown-it实例来解析内部内容
    const innerHtml = state.md.render(content.trim(), state.env);

    // 计算内容长度（去除空白）
    const contentLength = content.trim().length;

    // HTML转义函数，确保属性值安全
    const escapeHtml = (text: string) => {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    };

    // 生成登录后可见内容预览HTML
    const previewHtml = `
<div class="login-required-content-editor-preview" data-section-id="${contentId}" data-content-id="${contentId}" data-content-length="${contentLength}" data-title="${escapeHtml(title)}" data-hint="${escapeHtml(hint)}">
  <div class="login-required-content-header">
    <span class="login-required-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
    <span class="login-required-title">${title}</span>
    <span class="login-required-badge">需登录</span>
  </div>
  <div class="login-required-content-body">
    <div class="login-required-content-preview">
      ${innerHtml}
    </div>
    <div class="login-required-content-meta">
      <span class="content-length">约 ${contentLength} 字</span>
      <span class="login-required-info">• ${escapeHtml(hint)}</span>
    </div>
  </div>
</div>`.trim();

    const token = state.push("html_block", "", 0);
    token.content = previewHtml;
    token.map = [startLine, nextLine + 1];
    token.markup = startMarker;

    state.line = nextLine + 1;
    return true;
  }

  // 注册我们的规则，在 fence 之前处理
  md.block.ruler.before(
    "fence",
    "login-required-content",
    loginRequiredContentBlockRule
  );

  // 添加调试信息
  console.log("Login-required-content plugin registered successfully");
}
