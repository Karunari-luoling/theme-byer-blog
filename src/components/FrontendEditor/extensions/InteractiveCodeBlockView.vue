<template>
  <node-view-wrapper
    as="div"
    class="interactive-code-block-wrapper"
    @click.stop="handleWrapperClick"
  >
    <!-- 编辑按钮浮层 -->
    <div class="code-block-edit-overlay" contenteditable="false">
      <button
        title="编辑代码"
        class="code-block-edit-btn"
        @click.prevent.stop="openEditDialog"
      >
        <i class="anzhiyufont anzhiyu-icon-edit" />
        编辑
      </button>
    </div>

    <!-- 直接渲染原始 HTML -->
    <div
      ref="codeBlockRef"
      class="code-block-content"
      contenteditable="false"
      v-html="currentHTML"
    />

    <!-- 编辑代码弹窗 -->
    <AnDialog
      v-model="showEditDialog"
      title="编辑代码块"
      width="800px"
      :show-footer="true"
      confirm-text="保存"
      @confirm="saveCode"
    >
      <!-- 如果代码为空或缺少换行符，显示提示 -->
      <div
        v-if="!editCode || editCode.split('\n').length === 1"
        class="code-edit-warning"
      >
        <i class="anzhiyufont anzhiyu-icon-warning" />
        <span
          >由于浏览器技术限制，无法自动提取代码的换行符。请手动输入完整的代码内容。</span
        >
      </div>

      <div class="code-edit-form-group">
        <label>编程语言</label>
        <input
          v-model="editLanguage"
          type="text"
          placeholder="例如: javascript, python, html"
          class="code-edit-input"
        />
      </div>
      <div class="code-edit-form-group">
        <label>代码内容</label>
        <textarea
          v-model="editCode"
          class="code-edit-textarea"
          placeholder="请输入代码..."
          spellcheck="false"
        />
      </div>
    </AnDialog>
  </node-view-wrapper>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import { NodeViewWrapper } from "@tiptap/vue-3";
import { useSnackbar } from "@/composables/useSnackbar";
import hljs from "highlight.js";
import AnDialog from "@/components/AnDialog/index.vue";

const props = defineProps<{
  node: any;
  updateAttributes: (attrs: any) => void;
  deleteNode: () => void;
  editor: any;
}>();

const { showSnackbar } = useSnackbar();

const codeBlockRef = ref<HTMLDivElement | null>(null);

// 编辑弹窗状态
const showEditDialog = ref(false);
const editCode = ref("");
const editLanguage = ref("");

// 当前显示的 HTML（用提取的 code 重新生成，确保换行符正确）
const currentHTML = computed(() => {
  // 🔧 TipTap 会移除 HTML 中标签之间的换行符
  // 解决方案：用正确提取的 code 重新生成 HTML
  if (props.node.attrs.code) {
    console.log("🎨 [currentHTML] 使用提取的 code 重新生成 HTML");
    console.log(
      "📝 [currentHTML] code 行数:",
      props.node.attrs.code.split("\n").length
    );
    const newHTML = generateHTML(
      props.node.attrs.code,
      props.node.attrs.language || "plaintext"
    );
    console.log("✅ [currentHTML] 生成的 HTML 长度:", newHTML.length);

    // 🔧 关键修复：将生成的HTML（包含&#10;）保护后存储到节点属性
    // 原因：节点属性存储时浏览器会解码&#10;，我们需要先替换为占位符
    const protectedHTML = newHTML.replace(/&#10;/g, "___PRESERVED_NEWLINE___");

    console.log(
      "🔒 [currentHTML] 将HTML存储到节点前，保护了",
      (newHTML.match(/&#10;/g) || []).length,
      "个 &#10; 实体"
    );

    // 更新节点属性（异步，不阻塞渲染）
    if (props.updateAttributes) {
      nextTick(() => {
        props.updateAttributes({
          originalHTML: protectedHTML
        });
      });
    }

    return newHTML;
  }

  // 降级：使用原始 HTML
  const html = props.node.attrs.originalHTML || "";
  console.log("⚠️ [currentHTML] 使用原始 HTML（可能有换行符问题）");
  return html;
});

// 从 originalHTML 中提取代码
const extractCodeFromHTML = (html: string): string => {
  if (!html) return "";

  try {
    console.log("*".repeat(80));
    console.log("🔍 [extractCodeFromHTML] 开始提取代码");
    console.log("📏 [extractCodeFromHTML] 原始 HTML 长度:", html.length);

    // 创建临时 DOM 来解析 HTML
    const temp = document.createElement("div");
    temp.innerHTML = html;

    const code = temp.querySelector("code");
    if (!code) {
      console.log("❌ [extractCodeFromHTML] 未找到 code 元素");
      return "";
    }

    // 获取行号数量
    const lineNumberWrapper = code.querySelector("[rn-wrapper]");
    const lineCount = lineNumberWrapper
      ? lineNumberWrapper.querySelectorAll("span").length
      : 0;

    console.log("📊 [extractCodeFromHTML] 行号数量:", lineCount);

    // 获取代码块容器
    const codeBlock = code.querySelector(".md-editor-code-block");
    if (!codeBlock) {
      console.log("❌ [extractCodeFromHTML] 未找到 codeBlock 元素");
      return "";
    }

    console.log(
      "📝 [extractCodeFromHTML] codeBlock.innerHTML 前300字符:",
      codeBlock.innerHTML.substring(0, 300)
    );
    console.log(
      "🔢 [extractCodeFromHTML] codeBlock.innerHTML 中的换行符:",
      (codeBlock.innerHTML.match(/\n/g) || []).length
    );

    // 方法1：先尝试使用 textContent（会保留一些换行符）
    let plainText = codeBlock.textContent || "";
    console.log("📝 [extractCodeFromHTML] textContent:", plainText);
    console.log(
      "🔢 [extractCodeFromHTML] textContent 中的换行符:",
      (plainText.match(/\n/g) || []).length
    );

    // 如果 textContent 的行数不够，尝试从 innerHTML 智能恢复
    const actualLineCount = plainText.split("\n").length;
    if (lineCount > 0 && actualLineCount < lineCount) {
      console.log(
        `⚠️ [extractCodeFromHTML] textContent 行数不足（${actualLineCount}/${lineCount}），尝试从 innerHTML 恢复`
      );

      // 通过分析 HTML 结构来恢复换行符
      let htmlContent = codeBlock.innerHTML;

      // 替换 HTML 实体
      htmlContent = htmlContent
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

      console.log(
        "🔄 [extractCodeFromHTML] 替换实体后的内容（前300字符）:",
        htmlContent.substring(0, 300)
      );

      // 智能处理：在关键位置添加换行标记
      // 1. 注释标签后通常换行（最常见的情况）
      htmlContent = htmlContent.replace(
        /<span class="hljs-comment">([^<]*)<\/span>(?!\s*\n)/gi,
        '<span class="hljs-comment">$1</span>\n'
      );

      // 2. 某些关键字前通常有换行（当它们是新语句的开始时）
      // function, class, const, let, var, if, for, while 等
      htmlContent = htmlContent.replace(
        /<\/span>(?!\s*\n)\s*<span class="hljs-keyword">(function|class|const|let|var|async|export|import)\b/gi,
        '</span>\n<span class="hljs-keyword">$1'
      );

      // 3. 移除所有 HTML 标签
      plainText = htmlContent.replace(/<[^>]+>/g, "").trim();

      console.log(
        "🔄 [extractCodeFromHTML] 从 innerHTML 恢复后的文本:",
        plainText
      );
    }

    // 解码可能的其他 HTML 实体
    const textarea = document.createElement("textarea");
    textarea.innerHTML = plainText;
    plainText = textarea.value.trim();

    console.log("✅ [extractCodeFromHTML] 最终提取的代码:");
    console.log(plainText);
    console.log(
      "📊 [extractCodeFromHTML] 提取的代码行数:",
      plainText.split("\n").length
    );
    console.log("📊 [extractCodeFromHTML] 预期行数:", lineCount);

    // 逐字符分析
    console.log("🔍 [extractCodeFromHTML] 逐字符分析:");
    const chars = plainText.split("");
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

    // 如果提取的行数还是不匹配，提示用户
    if (lineCount > 0 && plainText.split("\n").length !== lineCount) {
      console.warn(
        `⚠️ [extractCodeFromHTML] 行数不匹配！预期 ${lineCount} 行，实际 ${
          plainText.split("\n").length
        } 行`
      );
    }

    console.log("*".repeat(80));
    return plainText;
  } catch (error) {
    console.error("从HTML提取代码失败:", error);
    return "";
  }
};

// 阻止代码块被选中
const handleWrapperClick = (event: MouseEvent) => {
  // 阻止事件冒泡，防止触发编辑器的选择逻辑
  event.stopPropagation();
};

// 打开编辑弹窗
const openEditDialog = () => {
  console.log("=".repeat(80));
  console.log("🔍 [openEditDialog] 开始打开编辑弹窗");
  console.log("📦 [openEditDialog] node.attrs.code:", props.node.attrs.code);
  console.log(
    "📦 [openEditDialog] node.attrs.code 长度:",
    props.node.attrs.code?.length || 0
  );
  console.log(
    "📦 [openEditDialog] node.attrs.code 行数:",
    props.node.attrs.code?.split("\n").length || 0
  );

  // 打印每个字符的详细信息
  if (props.node.attrs.code) {
    console.log("🔍 [openEditDialog] 逐字符分析:");
    const chars = props.node.attrs.code.split("");
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
  }

  // 如果 code 为空，尝试从 originalHTML 中提取
  if (!props.node.attrs.code && props.node.attrs.originalHTML) {
    console.log("⚠️  node.attrs.code 为空，从 originalHTML 提取");
    // 使用 extractCodeFromHTML 尝试提取
    editCode.value = extractCodeFromHTML(props.node.attrs.originalHTML);
    console.log("📝 提取后的代码:", editCode.value);
  } else {
    editCode.value = props.node.attrs.code || "";
    console.log("✅ 直接使用 node.attrs.code");
  }

  console.log("📝 [openEditDialog] 最终 editCode.value:", editCode.value);
  console.log(
    "📊 [openEditDialog] 最终 editCode.value 行数:",
    editCode.value.split("\n").length
  );
  console.log("=".repeat(80));

  editLanguage.value = props.node.attrs.language || "plaintext";
  showEditDialog.value = true;
};

// 生成新的 HTML（当代码或语言被修改后）
const generateHTML = (code: string, language: string): string => {
  try {
    console.log("🔧 [generateHTML] 开始生成 HTML");
    console.log("📝 [generateHTML] 输入代码:", code);
    console.log("📊 [generateHTML] 代码行数:", code.split("\n").length);
    console.log("🏷️ [generateHTML] 语言:", language);

    // 使用 highlight.js 生成高亮
    // 注意：highlight.js 会保留代码中的换行符
    let highlighted = "";
    if (language && hljs.getLanguage(language)) {
      highlighted = hljs.highlight(code, { language }).value;
    } else {
      highlighted = hljs.highlightAuto(code).value;
    }

    console.log(
      "✨ [generateHTML] 高亮后的 HTML 前300字符:",
      highlighted.substring(0, 300)
    );
    console.log(
      "🔢 [generateHTML] 高亮 HTML 中的换行符:",
      (highlighted.match(/\n/g) || []).length
    );

    // 🔧 关键修复：将换行符编码为HTML实体 &#10;
    // 原因：浏览器在序列化HTML时会移除 <span> 标签之间的换行符（当作格式化空白）
    // 使用HTML实体可以确保换行符不会被移除
    highlighted = highlighted.replace(/\n/g, "&#10;");

    console.log(
      "✅ [generateHTML] 将换行符编码为HTML实体，保护了",
      (highlighted.match(/&#10;/g) || []).length,
      "个换行符"
    );

    // 生成行号
    const lines = code.split("\n");
    const lineNumbers = `<span rn-wrapper="" aria-hidden="true">${"<span></span>".repeat(
      lines.length
    )}</span>`;

    // 构建完整的 details 结构（和后端返回的一致）
    const open = props.node.attrs.open !== false ? ' open=""' : "";

    // 获取原始 HTML 的 data-line 属性（如果存在）
    let dataLine = "";
    if (props.node.attrs.originalHTML) {
      const match = props.node.attrs.originalHTML.match(/data-line="(\d+)"/);
      if (match) {
        dataLine = ` data-line="${match[1]}"`;
      }
    }

    // 🔧 不使用 DOM 操作，直接用字符串构建 HTML
    // 原因：通过 DOM 属性传递 HTML 时，浏览器会规范化属性值，导致换行符丢失
    const result = `<details${dataLine} class="md-editor-code is-collapsible is-collapsed"${open}>
          <summary class="md-editor-code-head">
        <i class="anzhiyufont anzhiyu-icon-angle-down expand" onclick="event.preventDefault(); this.closest('details').open = !this.closest('details').open;"></i>
        <div class="code-lang">${language || "plaintext"}</div>
        <i class="anzhiyufont anzhiyu-icon-paste copy-button" onclick="event.preventDefault(); event.stopPropagation(); const code = this.closest('.md-editor-code').querySelector('pre code'); if(code && window.__markdownEditorCopyHandler) { window.__markdownEditorCopyHandler(code); }"></i>
      </summary>
      <pre style="height: 265px; overflow: hidden;"><code class="language-${language || "plaintext"}" language="${language || "plaintext"}"><span class="md-editor-code-block">${highlighted}</span>${lineNumbers}</code></pre>

        <div class="code-expand-btn" onclick="event.preventDefault(); event.stopPropagation(); const container = this.closest('details.md-editor-code'); const pre = container.querySelector('pre'); const icon = this.querySelector('i'); if(container.classList.contains('is-collapsed')) { container.open = true; container.classList.remove('is-collapsed'); if(pre) { pre.style.height = ''; pre.style.overflow = ''; } if(icon) { icon.style.transform = 'rotate(180deg)'; } this.classList.add('is-expanded'); } else { container.classList.add('is-collapsed'); if(pre) { pre.style.height = '265px'; pre.style.overflow = 'hidden'; } if(icon) { icon.style.transform = 'rotate(0deg)'; } this.classList.remove('is-expanded'); }"><i class="anzhiyufont anzhiyu-icon-angle-double-down" style="transition: transform 0.3s ease;"></i></div></details>`;

    console.log(
      "📦 [generateHTML] 生成的完整 HTML 前2000字符:",
      result.substring(0, 2000)
    );
    console.log(
      "🔢 [generateHTML] 完整 HTML 中的换行符:",
      (result.match(/\n/g) || []).length
    );

    return result;
  } catch (error) {
    console.error("生成代码块 HTML 失败:", error);
    return props.node.attrs.originalHTML || "";
  }
};

// 保存代码
const saveCode = () => {
  // 生成新的 HTML
  const newHTML = generateHTML(
    editCode.value,
    editLanguage.value || "plaintext"
  );

  console.log("💾 [saveCode] 保存代码:");
  console.log("  - 代码行数:", editCode.value.split("\n").length);
  console.log("  - 语言:", editLanguage.value);
  console.log("  - 生成的HTML长度:", newHTML.length);
  console.log("  - 生成的HTML前500字符:", newHTML.substring(0, 500));
  console.log("  - HTML中的换行符数量:", (newHTML.match(/\n/g) || []).length);

  // 更新属性
  props.updateAttributes({
    originalHTML: newHTML,
    code: editCode.value,
    language: editLanguage.value || "plaintext"
  });

  console.log("✅ [saveCode] 属性已更新，originalHTML 已设置");

  showSnackbar("代码已更新");
  // AnDialog 会自动关闭
  showEditDialog.value = false;
};
</script>

<style scoped lang="scss">
.interactive-code-block-wrapper {
  position: relative;
  margin: 1rem 0;

  &:hover .code-block-edit-overlay {
    opacity: 1;
  }
}

// 编辑按钮浮层
.code-block-edit-overlay {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.3s;
}

.code-block-edit-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--anzhiyu-white);
  background: var(--anzhiyu-main);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

  i {
    font-size: 14px;
  }
}

.code-block-content {
  // 确保代码块内容正常显示
  // 允许选中代码文字
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;

  :deep(details.md-editor-code) {
    margin: 0;

    // 确保代码块有横向滚动条，避免行号对不上
    pre code {
      display: flex;
      flex-direction: row-reverse;
      overflow: auto;
    }

    .md-editor-code-block {
      flex: 1;
      min-width: 0;
      overflow-x: auto;
      white-space: pre; // 保持代码格式，不自动换行
    }

    span[rn-wrapper] {
      flex-shrink: 0;

      span {
        white-space: nowrap;
      }
    }
  }
}

// 编辑弹窗表单样式
.code-edit-warning {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 6px;
  color: #856404;

  .anzhiyufont {
    font-size: 1.25rem;
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  span {
    flex: 1;
    line-height: 1.5;
  }
}

.code-edit-form-group {
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor);
  }
}

.code-edit-input {
  width: 100%;
  padding: 0.75rem;
  font-size: 0.875rem;
  color: var(--anzhiyu-fontcolor);
  background: var(--anzhiyu-background);
  border: 1px solid var(--anzhiyu-border-color);
  border-radius: 6px;
  outline: none;
  transition: all 0.3s;

  &:focus {
    border-color: var(--anzhiyu-main);
    box-shadow: 0 0 0 3px var(--anzhiyu-main-op-deep);
  }

  &::placeholder {
    color: var(--anzhiyu-secondtext);
  }
}

.code-edit-textarea {
  width: 100%;
  min-height: 300px;
  padding: 0.75rem;
  font-family: "Fira Code", "Consolas", "Monaco", monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--anzhiyu-fontcolor);
  background: var(--hltools-bg);
  border: 1px solid var(--anzhiyu-border-color);
  border-radius: 6px;
  outline: none;
  resize: vertical;
  transition: all 0.3s;

  &:focus {
    border-color: var(--anzhiyu-main);
    box-shadow: 0 0 0 3px var(--anzhiyu-main-op-deep);
  }

  &::placeholder {
    color: var(--anzhiyu-secondtext);
  }
}
</style>
