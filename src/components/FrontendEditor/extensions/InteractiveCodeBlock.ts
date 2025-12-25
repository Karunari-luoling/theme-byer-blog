/*
 * @Description: 交互式代码块扩展 - 保留展开/收起、复制、行号等功能，同时支持编辑
 * @Author: 安知鱼
 * @Date: 2025-10-25 15:00:00
 */
import { Node } from "@tiptap/core";
import { VueNodeViewRenderer } from "@tiptap/vue-3";
import InteractiveCodeBlockView from "./InteractiveCodeBlockView.vue";

export interface InteractiveCodeBlockOptions {
  HTMLAttributes: Record<string, any>;
}

export const InteractiveCodeBlock = Node.create<InteractiveCodeBlockOptions>({
  name: "interactiveCodeBlock",

  group: "block",

  atom: false, // 不是原子节点，内容可编辑

  code: true,

  addOptions() {
    return {
      HTMLAttributes: {}
    };
  },

  addAttributes() {
    return {
      // 保存原始的完整 HTML 结构
      originalHTML: {
        default: ""
      },
      // 保存语言（用于编辑）
      language: {
        default: "plaintext"
      },
      // 保存代码（用于编辑）
      code: {
        default: ""
      },
      // 是否展开
      open: {
        default: true
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: "details.md-editor-code",
        getAttrs: element => {
          const el = element as HTMLElement;
          const code = el.querySelector("code");
          const languageMatch = code?.className.match(/language-(\w+)/);

          // 尝试从 DOM 中提取代码
          // 优先使用 textContent，它会保留一些换行符
          const codeBlock = code?.querySelector(".md-editor-code-block");
          let extractedCode = "";

          // 获取行号数量
          const lineNumberWrapper = code?.querySelector("[rn-wrapper]");
          const lineCount = lineNumberWrapper
            ? lineNumberWrapper.querySelectorAll("span").length
            : 0;

          if (codeBlock) {
            // 使用 textContent 提取（保留换行符）
            extractedCode = codeBlock.textContent || "";

            // 如果行数不匹配，尝试智能恢复
            const actualLineCount = extractedCode.split("\n").length;
            if (lineCount > 0 && actualLineCount < lineCount) {
              console.log(
                `⚠️ [parseHTML] textContent 行数不足（${actualLineCount}/${lineCount}），尝试智能恢复`
              );

              // 从 innerHTML 智能恢复换行符
              let htmlContent = codeBlock.innerHTML;

              // 替换 HTML 实体（包括换行符实体）
              htmlContent = htmlContent
                .replace(/&#10;/g, "\n") // 🔧 将换行符实体解码回换行符
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&amp;/g, "&")
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'");

              // 在注释后添加换行
              htmlContent = htmlContent.replace(
                /<span class="hljs-comment">([^<]*)<\/span>(?!\s*\n)/gi,
                '<span class="hljs-comment">$1</span>\n'
              );

              // 在某些关键字前添加换行
              htmlContent = htmlContent.replace(
                /<\/span>(?!\s*\n)\s*<span class="hljs-keyword">(function|class|const|let|var|async|export|import)\b/gi,
                '</span>\n<span class="hljs-keyword">$1'
              );

              // 移除 HTML 标签
              extractedCode = htmlContent.replace(/<[^>]+>/g, "").trim();

              console.log(
                `✅ [parseHTML] 智能恢复后的行数: ${extractedCode.split("\n").length}`
              );
            }
          }

          console.log("-".repeat(80));
          console.log("🔍 [parseHTML] 开始解析代码块");
          console.log("📏 [parseHTML] outerHTML 长度:", el.outerHTML.length);
          console.log(
            "📝 [parseHTML] outerHTML 前2000字符:",
            el.outerHTML.substring(0, 2000)
          );
          console.log(
            "🔢 [parseHTML] outerHTML 中的换行符:",
            (el.outerHTML.match(/\n/g) || []).length
          );

          // 检查 code 元素的 innerHTML
          if (code) {
            const codeBlock = code.querySelector(".md-editor-code-block");
            if (codeBlock) {
              console.log(
                "📝 [parseHTML] codeBlock.innerHTML 前300字符:",
                codeBlock.innerHTML.substring(0, 300)
              );
              console.log(
                "🔢 [parseHTML] codeBlock.innerHTML 中的换行符:",
                (codeBlock.innerHTML.match(/\n/g) || []).length
              );
              console.log(
                "🔢 [parseHTML] codeBlock.innerHTML 中的 <span> 标签:",
                (codeBlock.innerHTML.match(/<span/g) || []).length
              );
            }
          }

          console.log("📊 [parseHTML] 行号数量:", lineCount);
          console.log(
            "🏷️ [parseHTML] 语言:",
            languageMatch ? languageMatch[1] : "未识别"
          );
          console.log("📝 [parseHTML] 提取的代码:");
          console.log(extractedCode);
          console.log(
            "📊 [parseHTML] 提取的代码行数:",
            extractedCode.split("\n").length
          );

          // 逐字符分析
          console.log("🔍 [parseHTML] 逐字符分析:");
          const chars = extractedCode.split("");
          chars.forEach((char, index) => {
            const charCode = char.charCodeAt(0);
            const display =
              char === "\n"
                ? "\\n"
                : char === "\r"
                  ? "\\r"
                  : char === "\t"
                    ? "\\t"
                    : char;
            console.log(`  [${index}] '${display}' (code: ${charCode})`);
          });

          console.log("-".repeat(80));

          // 🔧 TipTap/浏览器会自动将 HTML 实体（如 &#10;）解码
          // 我们需要在存储到节点属性前，将 &#10; 替换为不会被解码的占位符
          let preservedHTML = el.outerHTML || "";

          // 统计原始 HTML 中的 &#10; 实体数量
          const originalEntityCount = (preservedHTML.match(/&#10;/g) || [])
            .length;

          // 将 &#10; 实体替换为占位符，避免被浏览器解码
          preservedHTML = preservedHTML.replace(
            /&#10;/g,
            "___PRESERVED_NEWLINE___"
          );

          console.log("🔒 [parseHTML] 保护 &#10; 实体:");
          console.log("  - 原始 &#10; 实体数:", originalEntityCount);
          console.log(
            "  - 保护后占位符数:",
            (preservedHTML.match(/___PRESERVED_NEWLINE___/g) || []).length
          );

          return {
            // 保存完整的后端 HTML（换行符已被保护）
            originalHTML: preservedHTML,
            language: languageMatch ? languageMatch[1] : "",
            code: extractedCode, // 保存提取的代码
            open: el.hasAttribute("open")
          };
        }
      }
    ];
  },

  renderHTML({ node }) {
    // 🔧 这个方法用于序列化（保存时）
    // 使用 Base64 编码存储原始 HTML 和代码，完全避免浏览器处理导致换行符丢失
    const originalHTML = node.attrs.originalHTML || "";
    const code = node.attrs.code || "";
    const encodedHTML = btoa(encodeURIComponent(originalHTML));
    const encodedCode = btoa(encodeURIComponent(code));

    console.log("🔒 [renderHTML] 编码前 HTML 长度:", originalHTML.length);
    console.log(
      "🔒 [renderHTML] 编码前换行符数:",
      (originalHTML.match(/\n/g) || []).length
    );
    console.log("🔒 [renderHTML] 编码后 HTML 长度:", encodedHTML.length);
    console.log("🔒 [renderHTML] 代码长度:", code.length);
    console.log("🔒 [renderHTML] 代码行数:", code.split("\n").length);
    console.log("🔒 [renderHTML] 编码后代码长度:", encodedCode.length);

    return [
      "div",
      {
        class: "interactive-code-block-placeholder",
        "data-language": node.attrs.language || "",
        // Base64 编码的原始代码（用于 Turndown 转换）
        "data-encoded-code": encodedCode,
        // Base64 编码的原始 HTML（完全绕过浏览器的 HTML 规范化）
        "data-encoded-html": encodedHTML
      },
      // 添加一个简单的预览，以防清理失败
      ["pre", {}, ["code", {}, code]]
    ];
  },

  addNodeView() {
    return VueNodeViewRenderer(InteractiveCodeBlockView);
  }
});
