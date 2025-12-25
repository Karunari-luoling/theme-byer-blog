/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-09-11 18:54:39
 * @LastEditTime: 2025-09-14 01:43:14
 * @LastEditors: 安知鱼
 */
import type MarkdownIt from "markdown-it";

export default function paidContentPlugin(md: MarkdownIt): void {
  function paidContentBlockRule(
    state: any,
    startLine: number,
    endLine: number,
    silent: boolean
  ): boolean {
    const startMarker = ":::";
    const startTag = "paid-content";
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

    // 检查 ::: 后面是否是 paid-content，支持参数
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
    let title = "付费内容";
    let price = 1.0;
    let originalPrice = 0.0;
    let currencyUnit = "¥";

    // 解析参数（支持 title="标题" paid-title="标题" price="价格" original-price="原价" currency="货币单位" 格式）
    if (paramString) {
      const titleMatch = paramString.match(/title\s*=\s*["']([^"']+)["']/);
      const paidTitleMatch = paramString.match(
        /paid-title\s*=\s*["']([^"']+)["']/
      );
      const priceMatch = paramString.match(
        /price\s*=\s*["']?([0-9]+\.?[0-9]*)["']?/
      );
      const originalPriceMatch = paramString.match(
        /original-price\s*=\s*["']?([0-9]+\.?[0-9]*)["']?/
      );
      const currencyMatch = paramString.match(
        /currency\s*=\s*["']([^"']+)["']/
      );

      // paid-title 优先于 title
      if (paidTitleMatch) {
        title = paidTitleMatch[1];
      } else if (titleMatch) {
        title = titleMatch[1];
      }

      if (priceMatch) {
        price = parseFloat(priceMatch[1]);
      }

      if (originalPriceMatch) {
        originalPrice = parseFloat(originalPriceMatch[1]);
      }

      if (currencyMatch) {
        currencyUnit = currencyMatch[1];
      }
    }

    // 提取内容
    const content = state.src.slice(
      state.bMarks[startLine + 1],
      state.bMarks[nextLine]
    );

    // 递归解析内容中的 markdown 语法
    const renderedContent = md.render(content.trim());

    // 计算内容长度（去除空白）
    const contentLength = content.trim().length;

    // 生成唯一ID
    if (!state.env.paidContentCount) {
      state.env.paidContentCount = 0;
    }
    state.env.paidContentCount++;
    const sectionId = `paid-content-${state.env.paidContentCount}`;

    // 生成价格显示HTML
    let priceHtml = "";
    if (originalPrice > 0 && originalPrice > price) {
      // 有原价且原价大于当前价格，显示划线原价
      priceHtml = `
        <div class="paid-price-group">
          <div class="flex text-left flex-col-reverse">
            <span class="paid-original-price">${currencyUnit}${originalPrice.toFixed(2)}
            </span>
            <span class="paid-original-price-badge"><i class="anzhiyufont anzhiyu-icon-fw-fire"></i>限时特惠</span>
          </div>
          <span class="paid-current-price">
          <span class="paid-current-price-currency">${currencyUnit}</span>
          <span>${price.toFixed(2)}</span></span>
        </div>`;
    } else {
      // 只显示当前价格
      priceHtml = `<span class="paid-price">${currencyUnit}${price.toFixed(2)}</span>`;
    }

    // 生成付费内容预览HTML
    const previewHtml = `
<div class="paid-content-editor-preview" data-section-id="${sectionId}" data-price="${price}" data-original-price="${originalPrice}" data-currency="${currencyUnit}">
  <div class="paid-content-header">
    <span class="paid-icon"><svg t="1757587236982" class="md-editor-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9670" width="200" height="200"><path d="M512 0c283.569231 0 512 228.430769 512 512s-228.430769 512-512 512S0 795.569231 0 512 228.430769 0 512 0z" fill="#FCAE54" p-id="9671"></path><path d="M689.230769 267.815385c-7.876923-7.876923-19.692308-11.815385-31.507692-11.815385-11.815385 0-23.630769 3.938462-31.507692 11.815385L512 389.907692l-110.276923-122.092307c-11.815385-7.876923-23.630769-11.815385-35.446154-11.815385-11.815385 0-23.630769 3.938462-31.507692 11.815385-19.692308 19.692308-19.692308 47.261538 0 66.953846l66.953846 74.830769H326.892308c-7.876923 0-11.815385 3.938462-11.815385 11.815385v59.076923c0 7.876923 3.938462 11.815385 11.815385 11.815384H472.615385v78.769231H366.276923c-7.876923 0-11.815385 3.938462-11.815385 11.815385v55.138461c0 7.876923 3.938462 11.815385 11.815385 11.815385H472.615385v74.830769c0 23.630769 15.753846 47.261538 39.384615 47.261539 27.569231 0 43.323077-19.692308 43.323077-47.261539v-74.830769h106.338461c7.876923 0 11.815385-3.938462 11.815385-11.815385v-55.138461c0-7.876923-3.938462-11.815385-11.815385-11.815385h-106.338461v-78.769231h141.784615c7.876923 0 11.815385-3.938462 11.815385-11.815384v-59.076923c0-7.876923-3.938462-11.815385-11.815385-11.815385h-70.892307l66.953846-74.830769c15.753846-19.692308 15.753846-47.261538-3.938462-66.953846z" fill="#FFFFFF" p-id="9672"></path></svg></span>
    <span class="paid-title">${title}</span>
    ${priceHtml}
  </div>
  <div class="paid-content-body">
    <div class="paid-content-preview">
      ${renderedContent}
    </div>
    <div class="paid-content-meta">
      <span class="content-length">约 ${contentLength} 字</span>
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
  md.block.ruler.before("fence", "paid-content", paidContentBlockRule);

  // 添加调试信息
  console.log("Paid-content plugin registered successfully");
}
