/*
 * @Description: 密码文章插件 - PRO版本特有功能
 * @Author: 安知鱼
 * @Date: 2025-09-16 12:00:00
 * @LastEditTime: 2025-09-16 17:32:01
 * @LastEditors: 安知鱼
 */
import type MarkdownIt from "markdown-it";

export default function passwordContentPlugin(md: MarkdownIt): void {
  function passwordContentBlockRule(
    state: any,
    startLine: number,
    endLine: number,
    silent: boolean
  ): boolean {
    const startMarker = ":::";
    const startTag = "password-content";
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

    // 检查 ::: 后面是否是 password-content，支持参数
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
    let title = "密码保护内容";
    let password = ""; // 密码信息
    let _hint = "请输入正确的访问密码"; // 在编辑器预览模式下暂不使用
    let _placeholder = "请输入密码"; // 在编辑器预览模式下暂不使用

    // 解析参数（支持 password="密码" id="唯一ID" title="标题" hint="密码提示" placeholder="输入框占位符" 格式）
    if (paramString) {
      const passwordMatch = paramString.match(
        /password\s*=\s*["']([^"']+)["']/
      );
      const idMatch = paramString.match(/id\s*=\s*["']([^"']+)["']/);
      const titleMatch = paramString.match(/title\s*=\s*["']([^"']+)["']/);
      const hintMatch = paramString.match(/hint\s*=\s*["']([^"']+)["']/);
      const placeholderMatch = paramString.match(
        /placeholder\s*=\s*["']([^"']+)["']/
      );

      if (passwordMatch) {
        password = passwordMatch[1];
      }

      if (idMatch) {
        id = idMatch[1];
      }

      if (titleMatch) {
        title = titleMatch[1];
      }

      if (hintMatch) {
        _hint = hintMatch[1];
      }

      if (placeholderMatch) {
        _placeholder = placeholderMatch[1];
      }
    }

    // 提取内容
    const content = state.src.slice(
      state.bMarks[startLine + 1],
      state.bMarks[nextLine]
    );

    // 使用解析的ID或生成默认ID
    let sectionId = id;
    if (!sectionId) {
      if (!state.env.passwordContentCount) {
        state.env.passwordContentCount = 0;
      }
      state.env.passwordContentCount++;
      sectionId = `password-${Date.now()}-${Math.floor(Math.random() * 1000)
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

    // 生成密码保护内容预览HTML（与付费内容样式保持一致）
    // 注意：密码已经过AES-GCM加密，在data-password属性中传递给后端
    const previewHtml = `
<div class="password-content-editor-preview" data-section-id="${sectionId}" data-content-id="${sectionId}" data-content-length="${contentLength}" data-password="${escapeHtml(password)}" data-title="${escapeHtml(title)}" data-hint="${escapeHtml(_hint)}" data-placeholder="${escapeHtml(_placeholder)}">
  <div class="password-content-header">
    <span class="password-icon"><svg t="1757587236982" class="md-editor-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="15847" width="200" height="200"><path d="M832 464h-68V240c0-70.7-57.3-128-128-128H388c-70.7 0-128 57.3-128 128v224h-68c-17.7 0-32 14.3-32 32v384c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V496c0-17.7-14.3-32-32-32zM332 240c0-30.9 25.1-56 56-56h248c30.9 0 56 25.1 56 56v224H332V240z m460 600H232V536h560v304z" fill="#5470C6" p-id="15848"></path><path d="M484 701v53c0 4.4 3.6 8 8 8h40c4.4 0 8-3.6 8-8v-53c12.1-8.7 20-22.9 20-39 0-26.5-21.5-48-48-48s-48 21.5-48 48c0 16.1 7.9 30.3 20 39z" fill="#5470C6" p-id="15849"></path></svg></span>
    <span class="password-title">${title}</span>
    <span class="password-pro-badge">密码保护内容</span>
  </div>
  <div class="password-content-body">
    <div class="password-content-preview">
      ${innerHtml}
    </div>
    <div class="password-content-meta">
      <span class="content-length">约 ${contentLength} 字</span>
      <span class="password-protection-info">• 此内容受密码保护</span>
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
  md.block.ruler.before("fence", "password-content", passwordContentBlockRule);

  // 添加调试信息
  console.log("Password-content plugin registered successfully");
}
