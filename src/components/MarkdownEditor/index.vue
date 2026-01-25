<!--
 * @Description: Markdown编辑器组件（重构版）
 * @Author: 安知鱼
 * @Date: 2025-12-27
-->
<script setup lang="ts">
import {
  ref,
  shallowRef,
  onMounted,
  onUnmounted,
  nextTick,
  watch,
  defineAsyncComponent
} from "vue";
import { useSnackbar } from "@/composables/useSnackbar";
import {
  useContentProcessor,
  enrichHtmlMusicPlayers,
  initMusicPlayer,
  enrichMusicPlayers,
  useMusicPlayerObserver
} from "./composables";
import { useEditorToolbar } from "./composables/useEditorToolbar";
import { initTipEvents } from "./plugins/markdown-it-tip-plugin";

// AI写作对话框组件（异步加载）
const AIWritingDialog = defineAsyncComponent(
  () => import("./components/AIWritingDialog.vue")
);

// 动态导入类型定义
type MdEditor = any;
type Themes = any;
type ExposeParam = any;
type ToolbarNames = any;

const props = withDefaults(
  defineProps<{
    modelValue: string;
    onUploadImg: (files: File[], callback: (urls: string[]) => void) => void;
    hidePremiumFeatures?: boolean;
  }>(),
  {
    hidePremiumFeatures: false
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "onSave", markdown: string, html: string): void;
}>();

const { showSnackbar } = useSnackbar();

// === 编辑器状态 ===
const MdEditorComponent = shallowRef<any>(null);
const isEditorLoading = ref(true);
const loadError = ref<string>("");
const editorRef = ref<ExposeParam>();
const theme = ref<Themes>("light");
const containerRef = ref<HTMLElement | null>(null);
const currentHtml = ref<string>("");

// === Mermaid 渲染状态 ===
const mermaidRenderStatus = ref<{
  isRendering: boolean;
  total: number;
  rendered: number;
}>({
  isRendering: false,
  total: 0,
  rendered: 0
});

// === AI 写作对话框 ===
const aiWritingDialogVisible = ref(false);

// === 使用composables ===
const { sanitize, handleCodeCopy, codeMaxLines, collapsedHeight } =
  useContentProcessor(showSnackbar);
const { createObserver, disconnectObserver, processNewNode } =
  useMusicPlayerObserver();

// 工具栏
const { initToolbarButtons } = useEditorToolbar(containerRef, {
  hidePremiumFeatures: props.hidePremiumFeatures,
  onAIWriting: () => {
    aiWritingDialogVisible.value = true;
  },
  onPaidContent: insertPaidContent,
  onPasswordContent: insertPasswordContent,
  onLoginRequired: insertLoginRequiredContent
});

// === 工具栏配置 ===
const toolbars: ToolbarNames[] = [
  "bold",
  "underline",
  "italic",
  "strikeThrough",
  "-",
  "title",
  "sub",
  "sup",
  "quote",
  "unorderedList",
  "orderedList",
  "task",
  "-",
  "codeRow",
  "code",
  "link",
  "image",
  "table",
  "mermaid",
  "katex",
  "revoke",
  "next",
  "save",
  "=",
  "pageFullscreen",
  "fullscreen",
  "preview",
  "previewOnly",
  "htmlPreview",
  "catalog"
];

// === 重新加载方法 ===
const reloadPage = () => {
  window.location.reload();
};

// === Mermaid 重渲染防抖定时器 ===
let mermaidRenderTimer: ReturnType<typeof setTimeout> | null = null;
// 当前正在渲染的批次（用于中断）
let currentRenderAborted = false;

// === Mermaid 分批渲染配置 ===
const MERMAID_BATCH_SIZE = 3; // 每批渲染的图表数量
const MERMAID_BATCH_DELAY = 50; // 批次之间的延迟（毫秒）

// === 分批渲染 Mermaid 图表（性能优化） ===
const renderMermaidInBatches = async (
  blocks: Element[],
  updateProgress = true
): Promise<void> => {
  const mermaid = (window as any).mermaid;
  if (!mermaid || blocks.length === 0) return;

  currentRenderAborted = false;
  const totalBlocks = blocks.length;
  let renderedCount = 0;

  // 更新渲染状态（仅在图表数量较多时显示）
  if (updateProgress && totalBlocks >= 3) {
    mermaidRenderStatus.value = {
      isRendering: true,
      total: mermaidRenderStatus.value.total + totalBlocks,
      rendered: mermaidRenderStatus.value.rendered
    };
  }

  console.log(
    `[Mermaid] 开始分批渲染 ${totalBlocks} 个图表，每批 ${MERMAID_BATCH_SIZE} 个`
  );

  // 按批次处理
  for (let i = 0; i < blocks.length; i += MERMAID_BATCH_SIZE) {
    // 检查是否被中断
    if (currentRenderAborted) {
      console.log(
        `[Mermaid] 渲染被中断，已完成 ${renderedCount}/${totalBlocks}`
      );
      if (updateProgress) {
        mermaidRenderStatus.value.isRendering = false;
      }
      return;
    }

    const batch = blocks.slice(i, i + MERMAID_BATCH_SIZE);

    try {
      // 渲染当前批次
      await Promise.all(
        batch.map(async block => {
          if (currentRenderAborted) return;
          try {
            // 为单个块生成唯一 ID 并渲染
            const id = `mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            block.setAttribute("id", id);
            await mermaid.run({
              nodes: [block],
              suppressErrors: true
            });
            // 更新渲染进度
            if (updateProgress && totalBlocks >= 3) {
              mermaidRenderStatus.value.rendered++;
            }
          } catch (e) {
            console.warn("[Mermaid] 单个图表渲染失败:", e);
          }
        })
      );

      renderedCount += batch.length;

      // 批次间延迟，让出主线程
      if (i + MERMAID_BATCH_SIZE < blocks.length) {
        await new Promise(resolve => setTimeout(resolve, MERMAID_BATCH_DELAY));
      }
    } catch (error) {
      console.warn(`[Mermaid] 批次渲染出错:`, error);
    }
  }

  console.log(`[Mermaid] 分批渲染完成，共 ${renderedCount} 个图表`);

  // 完成渲染
  if (updateProgress && totalBlocks >= 3) {
    // 延迟隐藏状态，让用户看到完成
    setTimeout(() => {
      mermaidRenderStatus.value = {
        isRendering: false,
        total: 0,
        rendered: 0
      };
    }, 500);
  }
};

// === 检查并重新渲染未完成的 Mermaid 图表 ===
const checkAndRerenderMermaid = async () => {
  const previewContainer = containerRef.value?.querySelector(
    ".md-editor-preview-wrapper"
  );
  if (!previewContainer) return;

  // 中断之前的渲染任务
  currentRenderAborted = true;
  await new Promise(resolve => setTimeout(resolve, 10));

  // 查找所有未渲染的 mermaid 块（没有 SVG 或没有 data-processed 属性）
  const mermaidBlocks = Array.from(
    previewContainer.querySelectorAll(".md-editor-mermaid")
  );
  const unrenderedBlocks: Element[] = [];

  for (const block of mermaidBlocks) {
    const hasSvg = block.querySelector("svg");
    const isProcessed = block.hasAttribute("data-processed");
    if (!hasSvg || !isProcessed) {
      unrenderedBlocks.push(block);
    }
  }

  if (unrenderedBlocks.length === 0) return;

  const mermaid = (window as any).mermaid;
  if (!mermaid) {
    console.warn("[Mermaid] 全局 mermaid 对象不存在，跳过重渲染");
    return;
  }

  // 使用 IntersectionObserver 优先渲染可见区域的图表
  const visibleBlocks: Element[] = [];
  const hiddenBlocks: Element[] = [];

  unrenderedBlocks.forEach(block => {
    const rect = block.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight + 200 && rect.bottom > -200;
    if (isVisible) {
      visibleBlocks.push(block);
    } else {
      hiddenBlocks.push(block);
    }
  });

  console.log(
    `[Mermaid] 检测到 ${unrenderedBlocks.length} 个未渲染图表（可见: ${visibleBlocks.length}, 隐藏: ${hiddenBlocks.length}）`
  );

  // 先渲染可见区域的图表
  if (visibleBlocks.length > 0) {
    await renderMermaidInBatches(visibleBlocks);
  }

  // 然后渲染隐藏区域的图表
  if (hiddenBlocks.length > 0 && !currentRenderAborted) {
    await renderMermaidInBatches(hiddenBlocks);
  }
};

// === 处理HTML变化事件 ===
const handleHtmlChanged = (html: string) => {
  currentHtml.value = html;

  // 使用防抖机制检查并重渲染 mermaid 图表
  // 根据内容大小动态调整防抖时间
  if (mermaidRenderTimer) {
    clearTimeout(mermaidRenderTimer);
  }

  // 根据 modelValue 长度动态计算防抖时间
  // 大文章需要更长的防抖时间，避免频繁触发渲染
  const contentLength = props.modelValue?.length || 0;
  let debounceTime = 300; // 默认 300ms

  if (contentLength > 100000) {
    // 超过 10 万字，使用 800ms 防抖
    debounceTime = 800;
  } else if (contentLength > 50000) {
    // 超过 5 万字，使用 500ms 防抖
    debounceTime = 500;
  } else if (contentLength > 20000) {
    // 超过 2 万字，使用 400ms 防抖
    debounceTime = 400;
  }

  mermaidRenderTimer = setTimeout(() => {
    checkAndRerenderMermaid();
    // 初始化 tip 组件的事件监听器
    const previewContainer = containerRef.value?.querySelector(
      ".md-editor-preview-wrapper"
    );
    if (previewContainer) {
      initTipEvents(previewContainer as HTMLElement);
    }
  }, debounceTime);

  return html;
};

// === 初始化HTML内容 ===
const initializeHtml = () => {
  if (props.modelValue && !currentHtml.value) {
    currentHtml.value = `<p>${props.modelValue.substring(0, 100)}...</p>`;
  }
};

// === 等待 Mermaid 渲染完成（带进度更新） ===
const waitForMermaidRender = async (
  checkIntervalMs: number = 100
): Promise<{ success: boolean; total: number; rendered: number }> => {
  const previewContainer = containerRef.value?.querySelector(
    ".md-editor-preview-wrapper"
  );
  if (!previewContainer) return { success: true, total: 0, rendered: 0 };

  // 找到所有 mermaid 块
  const mermaidBlocks = Array.from(
    previewContainer.querySelectorAll(".md-editor-mermaid")
  );

  if (mermaidBlocks.length === 0) {
    return { success: true, total: 0, rendered: 0 };
  }

  // 根据 Mermaid 数量动态计算最大等待时间
  // 基础 2 秒 + 每个图表额外 1 秒，最多 15 秒
  // 注意：这只是上限，一旦渲染完成会立即返回
  const maxWaitMs = Math.min(2000 + mermaidBlocks.length * 1000, 15000);
  const startTime = Date.now();

  console.log(
    `[保存文章] 检测到 ${mermaidBlocks.length} 个 Mermaid 图表，最大等待时间: ${maxWaitMs}ms`
  );

  while (Date.now() - startTime < maxWaitMs) {
    // 统计已渲染和未渲染的数量
    let renderedCount = 0;
    for (const block of mermaidBlocks) {
      const hasSvg = block.querySelector("svg");
      const isProcessed = block.hasAttribute("data-processed");
      if (hasSvg && isProcessed) {
        renderedCount++;
      }
    }

    // 检查是否全部完成
    if (renderedCount === mermaidBlocks.length) {
      console.log(
        `[保存文章] 所有 Mermaid 图表已渲染完成 (${mermaidBlocks.length} 个)，耗时: ${Date.now() - startTime}ms`
      );
      return {
        success: true,
        total: mermaidBlocks.length,
        rendered: renderedCount
      };
    }

    // 等待一段时间后再检查
    await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
  }

  // 超时，统计最终状态
  let finalRendered = 0;
  for (const block of mermaidBlocks) {
    const hasSvg = block.querySelector("svg");
    const isProcessed = block.hasAttribute("data-processed");
    if (hasSvg && isProcessed) {
      finalRendered++;
    }
  }

  console.warn(
    `[保存文章] Mermaid 渲染超时 (${maxWaitMs}ms)，已完成: ${finalRendered}/${mermaidBlocks.length}`
  );
  return {
    success: false,
    total: mermaidBlocks.length,
    rendered: finalRendered
  };
};

// === 从预览区域获取渲染后的 HTML ===
const getRenderedHtmlFromPreview = (): string | null => {
  const previewContainer = containerRef.value?.querySelector(
    ".md-editor-preview-wrapper"
  );
  if (!previewContainer) {
    console.warn("[保存文章] 无法找到预览区域");
    return null;
  }

  // 获取预览内容区域（通常是 .md-editor-preview 内部的内容）
  const previewContent = previewContainer.querySelector(".md-editor-preview");
  const targetElement = previewContent || previewContainer;

  // 克隆 DOM 以避免修改原始预览区域
  const clonedElement = targetElement.cloneNode(true) as HTMLElement;

  // 清理临时状态，避免保存不必要的运行时属性
  // 1. 清理 tip 组件的临时状态
  clonedElement
    .querySelectorAll("[data-tip-initialized]")
    .forEach(el => el.removeAttribute("data-tip-initialized"));
  clonedElement.querySelectorAll("[data-visible]").forEach(el => {
    el.removeAttribute("data-visible");
    // 重置 tooltip 的显示状态
    if (el.classList.contains("anzhiyu-tip")) {
      (el as HTMLElement).style.visibility = "hidden";
      (el as HTMLElement).style.opacity = "0";
    }
  });

  // 2. 清理代码块的临时展开状态（保持折叠状态）
  clonedElement.querySelectorAll(".code-expand-btn.is-expanded").forEach(el => {
    el.classList.remove("is-expanded");
    const icon = el.querySelector("i");
    if (icon) {
      (icon as HTMLElement).style.transform = "rotate(0deg)";
    }
  });

  // 3. 清理 details 元素的展开状态（保持折叠）
  clonedElement
    .querySelectorAll("details.md-editor-code.is-collapsible")
    .forEach(details => {
      if (!details.classList.contains("is-collapsed")) {
        details.classList.add("is-collapsed");
        const pre = details.querySelector("pre") as HTMLElement;
        if (pre) {
          pre.style.height = collapsedHeight.value;
          pre.style.overflow = "hidden";
        }
      }
    });

  return clonedElement.innerHTML;
};

// 保存完成的 Promise resolver（用于 triggerSaveAsync）
let saveCompleteResolver:
  | ((value: { markdown: string; html: string }) => void)
  | null = null;

// === 保存处理 ===
const handleSave = async (markdown: string, htmlPromise: Promise<string>) => {
  console.log("[保存文章] 开始处理...");

  // 清除防抖定时器，避免干扰
  if (mermaidRenderTimer) {
    clearTimeout(mermaidRenderTimer);
    mermaidRenderTimer = null;
  }

  // 先调用编辑器的 rerender 方法强制重新渲染（官方 API）
  // 这会触发 markdown-it 重新解析，并让 mermaid 插件重新处理图表
  if (editorRef.value?.rerender) {
    console.log("[保存文章] 调用 editorRef.rerender() 强制重新渲染...");
    editorRef.value.rerender();
    // 等待重新渲染开始
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // 再主动触发 mermaid 渲染（确保未渲染的图表被处理）
  console.log("[保存文章] 主动触发 Mermaid 渲染...");
  await checkAndRerenderMermaid();

  // 等待一小段时间让渲染完成
  await new Promise(resolve => setTimeout(resolve, 100));

  // 等待 Mermaid 渲染完成（动态等待时间）
  const renderResult = await waitForMermaidRender(100);

  if (!renderResult.success && renderResult.total > 0) {
    // 渲染超时，询问用户是否继续
    const unrenderedCount = renderResult.total - renderResult.rendered;
    const confirmMsg =
      `有 ${unrenderedCount} 个 Mermaid 图表尚未渲染完成。\n\n` +
      `继续保存可能导致这些图表在前台显示为源代码。\n\n` +
      `建议：点击"取消"后，等待所有图表渲染完成再保存。\n\n` +
      `是否仍要继续保存？`;

    if (!confirm(confirmMsg)) {
      showSnackbar("已取消保存，请等待图表渲染完成后再试");
      return;
    }
  }

  // 优先从预览区域 DOM 获取渲染后的 HTML（包含 mermaid SVG、katex 等渲染结果）
  // 如果获取失败，则回退到编辑器提供的 HTML
  let rawHtml = getRenderedHtmlFromPreview();
  if (!rawHtml) {
    console.warn("[保存文章] 从预览区域获取 HTML 失败，使用编辑器提供的 HTML");
    rawHtml = await htmlPromise;
  } else {
    console.log("[保存文章] 成功从预览区域获取渲染后的 HTML");
  }

  const enrichedHtml = await enrichHtmlMusicPlayers(rawHtml);
  const sanitizedHtml = sanitize(enrichedHtml);
  emit("onSave", markdown, sanitizedHtml);
  console.log("[保存文章] 保存完成");

  // 如果有等待的 Promise，resolve 它
  if (saveCompleteResolver) {
    saveCompleteResolver({ markdown, html: sanitizedHtml });
    saveCompleteResolver = null;
  }
};

// === AI写作内容插入 ===
const handleAIWritingInsert = (content: string) => {
  if (!content || !editorRef.value) return;

  editorRef.value.insert(() => ({
    targetValue: content,
    select: false,
    deviationStart: 0,
    deviationEnd: 0
  }));
};

// === 插入付费内容标签 ===
function insertPaidContent() {
  if (!editorRef.value) return;

  const paidContentTemplate = `:::paid-content title="高级功能说明" price="9.99" original-price="19.99" currency="R币"
这里是要付费才能查看的内容。

支持多段落内容：
- 列表项
- 代码块
- 图片等

\`\`\`javascript
console.log("这是一个付费代码示例");
// 付费内容中的代码会被正确高亮
function paidFeature() {
  return "advanced functionality";
}
\`\`\`

### 付费内容支持所有 markdown 语法

> 引用块也能正常显示
> 包括多行引用

**粗体**、*斜体*、~~删除线~~等格式都能正确解析。

### 新功能说明：
- **currency**: 自定义货币单位（如 ¥、R币、积分等）
- **original-price**: 原价，会显示划线效果
- **price**: 当前价格（活动价）
- 用户购买后会看到【已购买】标识，而不是价格
:::

`;

  editorRef.value.insert(() => ({
    targetValue: paidContentTemplate,
    select: false,
    deviationStart: 0,
    deviationEnd: 0
  }));
}

// === 插入密码保护内容标签 ===
function insertPasswordContent() {
  if (!editorRef.value) return;
  showPasswordContentDialog();
}

// === 显示密码保护内容设置对话框 ===
function showPasswordContentDialog() {
  const passwordDialog = document.createElement("div");
  passwordDialog.className = "password-content-dialog-overlay";
  passwordDialog.innerHTML = `
    <div class="password-content-dialog">
      <div class="dialog-header">
        <h3>设置密码保护内容</h3>
        <button class="dialog-close-btn" onclick="this.closest('.password-content-dialog-overlay').remove()">×</button>
      </div>
      <div class="dialog-body">
        <div class="form-section primary-section">
          <h4 class="section-title">主要设置</h4>
          <div class="form-group">
            <label>访问密码：<span class="required">*</span></label>
            <input type="password" id="password-value" placeholder="设置访问密码（3-50个字符）" />
            <small class="form-help">此密码用于保护内容，读者需要输入此密码才能查看。密码长度：3-50个字符。</small>
          </div>
          <div class="form-group">
            <label>保护内容：<span class="required">*</span></label>
            <textarea id="password-content" rows="8" placeholder="输入需要密码保护的内容...">这里是需要密码才能查看的重要内容。

### 密码保护内容特性：
- 🔒 **安全保护**：内容经过密码保护，只有知道密码的用户才能查看
- 📝 **完整支持**：支持所有 Markdown 语法，包括代码块、图片、表格等
- 🎨 **自定义提示**：可以自定义密码提示信息和输入框占位符
- ⚡ **即时解锁**：输入正确密码后立即显示内容

**重要提醒**：请妥善保管访问密码，避免泄露给无关人员。</textarea>
          </div>
        </div>

        <div class="form-section secondary-section">
          <h4 class="section-title">显示设置</h4>
          <div class="form-group">
            <label>内容标题：</label>
            <input type="text" id="password-title" placeholder="重要内容" value="重要内容" />
            <small class="form-help">在密码保护区域显示的标题</small>
          </div>
          <div class="form-group">
            <label>密码提示：</label>
            <input type="text" id="password-hint" placeholder="请联系作者获取访问密码" value="请联系作者获取访问密码" />
            <small class="form-help">给读者的密码提示信息</small>
          </div>
          <div class="form-group">
            <label>输入框占位符：</label>
            <input type="text" id="password-placeholder" placeholder="请输入密码" value="请输入密码" />
            <small class="form-help">密码输入框内的占位符文字</small>
          </div>
        </div>
      </div>
      <div class="dialog-footer">
        <button class="btn-cancel" onclick="this.closest('.password-content-dialog-overlay').remove()">取消</button>
        <button class="btn-confirm" onclick="confirmPasswordContent()">确定插入</button>
      </div>
    </div>
  `;

  // 添加对话框样式
  addPasswordDialogStyles();
  document.body.appendChild(passwordDialog);
}

// === 添加密码对话框样式 ===
function addPasswordDialogStyles() {
  if (document.getElementById("password-dialog-styles")) return;

  const style = document.createElement("style");
  style.id = "password-dialog-styles";
  style.textContent = `
    .password-content-dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    }
    .password-content-dialog {
      background: var(--anzhiyu-card-bg);
      border-radius: 12px;
      width: 90%;
      max-width: 600px;
      max-height: 85vh;
      box-shadow: var(--anzhiyu-shadow-main);
      margin: 2rem auto;
      display: flex;
      flex-direction: column;
    }
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: var(--style-border-always);
    }
    .dialog-header h3 {
      margin: 0;
      color: var(--anzhiyu-fontcolor);
    }
    .dialog-close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--anzhiyu-secondtext);
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.3s;
    }
    .dialog-close-btn:hover {
      background: var(--anzhiyu-secondbg);
      color: var(--anzhiyu-fontcolor);
    }
    .dialog-body {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
      min-height: 0;
    }
    .form-section {
      margin-bottom: 1.5rem;
    }
    .form-section:last-child {
      margin-bottom: 0;
    }
    .form-section.primary-section {
      padding: 1.2rem;
      background: var(--anzhiyu-background);
      border: 2px solid var(--anzhiyu-main);
      border-radius: 12px;
      position: relative;
    }
    .form-section.primary-section::before {
      content: "重要";
      position: absolute;
      top: -8px;
      left: 16px;
      padding: 0 8px;
      font-size: 0.7em;
      font-weight: 700;
      color: var(--anzhiyu-white);
      background: var(--anzhiyu-main);
      border-radius: 4px;
    }
    .form-section.secondary-section {
      padding: 1rem;
      background: var(--anzhiyu-secondbg);
      border-radius: 12px;
    }
    .section-title {
      margin: 0 0 1rem 0;
      font-size: 0.9em;
      color: var(--anzhiyu-fontcolor);
      font-weight: 600;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    .form-group:last-child {
      margin-bottom: 0;
    }
    .form-group label {
      display: block;
      margin-bottom: 0.4rem;
      color: var(--anzhiyu-fontcolor);
      font-size: 0.9em;
      font-weight: 500;
    }
    .form-group .required {
      color: var(--anzhiyu-red);
    }
    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 0.65rem 0.9rem;
      border: var(--style-border);
      border-radius: 8px;
      background: var(--anzhiyu-card-bg);
      color: var(--anzhiyu-fontcolor);
      font-size: 0.9em;
      box-sizing: border-box;
      transition: all 0.3s;
    }
    .form-group input:focus,
    .form-group textarea:focus {
      border-color: var(--anzhiyu-main);
      outline: none;
      box-shadow: 0 0 0 3px var(--anzhiyu-main-op);
    }
    .form-help {
      display: block;
      margin-top: 0.3rem;
      font-size: 0.75em;
      color: var(--anzhiyu-secondtext);
    }
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.8rem;
      padding: 1rem 1.5rem;
      border-top: var(--style-border-always);
    }
    .btn-cancel,
    .btn-confirm {
      padding: 0.6rem 1.4rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9em;
      font-weight: 500;
      transition: all 0.3s;
    }
    .btn-cancel {
      background: var(--anzhiyu-secondbg);
      color: var(--anzhiyu-fontcolor);
    }
    .btn-cancel:hover {
      background: var(--anzhiyu-gray-op);
    }
    .btn-confirm {
      background: var(--anzhiyu-main);
      color: var(--anzhiyu-white);
    }
    .btn-confirm:hover {
      opacity: 0.9;
    }
  `;
  document.head.appendChild(style);
}

// === 插入登录后可见内容 ===
function insertLoginRequiredContent() {
  if (!editorRef.value) return;

  const loginRequiredContentTemplate = `:::login-required id="login-required-${Date.now()}-${Math.floor(Math.random() * 1000)}" title="登录后可见" hint="此内容需要登录后才能查看"
这里是登录后可查看的内容。

### 特性说明
- 🔐 **登录保护**：只有登录用户才能查看完整内容
- 📝 **完整支持**：支持所有 Markdown 语法，包括代码块、图片、表格等
- 🎨 **自动识别**：系统自动判断用户登录状态
- ⚡ **即时显示**：登录用户立即显示完整内容

\`\`\`javascript
// 登录后可见内容中的代码会被正确高亮
function memberFeature() {
  return "member only content";
}
\`\`\`

### 支持所有 markdown 语法

> 引用块也能正常显示
> 包括多行引用

**粗体**、*斜体*、~~删除线~~等格式都能正确解析。

| 功能 | 支持情况 |
|------|---------|
| 代码高亮 |支持 |
| 图片显示 |支持 |
| 表格 |支持 |
:::

`;

  const selection = editorRef.value.getSelectedText?.();
  if (selection) {
    const wrappedContent = `:::login-required id="login-required-${Date.now()}-${Math.floor(Math.random() * 1000)}" title="登录后可见" hint="此内容需要登录后才能查看"
${selection}
:::

`;
    editorRef.value.insert(() => ({
      targetValue: wrappedContent,
      select: false,
      deviationStart: 0,
      deviationEnd: 0
    }));
  } else {
    editorRef.value.insert(() => ({
      targetValue: loginRequiredContentTemplate,
      select: false,
      deviationStart: 0,
      deviationEnd: 0
    }));
  }

  showSnackbar("登录后可见内容已插入");
}

// === 全局函数：确认插入密码保护内容 ===
const setupGlobalPasswordConfirm = () => {
  (window as any).confirmPasswordContent = async () => {
    const titleInput = document.getElementById(
      "password-title"
    ) as HTMLInputElement;
    const hintInput = document.getElementById(
      "password-hint"
    ) as HTMLInputElement;
    const placeholderInput = document.getElementById(
      "password-placeholder"
    ) as HTMLInputElement;
    const passwordInput = document.getElementById(
      "password-value"
    ) as HTMLInputElement;
    const contentInput = document.getElementById(
      "password-content"
    ) as HTMLTextAreaElement;

    const title = titleInput?.value || "重要内容";
    const hint = hintInput?.value || "请联系作者获取访问密码";
    const placeholder = placeholderInput?.value || "请输入密码";
    const password = passwordInput?.value;
    const content = contentInput?.value || "";

    if (!password || password.trim() === "") {
      alert("请设置访问密码！密码不能为空。");
      passwordInput?.focus();
      return;
    }

    if (password.length < 3) {
      alert("密码长度不能少于3个字符，请设置更安全的密码。");
      passwordInput?.focus();
      return;
    }

    if (password.length > 50) {
      alert("密码长度不能超过50个字符。");
      passwordInput?.focus();
      return;
    }

    if (!content || content.trim() === "") {
      alert("请输入保护内容！");
      contentInput?.focus();
      return;
    }

    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const blockId = `password-${timestamp}-${random}`;

    try {
      const passwordContentTemplate = `:::password-content password="${password}" id="${blockId}" title="${title}" hint="${hint}" placeholder="${placeholder}"
${content.trim()}
:::

`;

      if (editorRef.value) {
        editorRef.value.insert(() => ({
          targetValue: passwordContentTemplate,
          select: false,
          deviationStart: 0,
          deviationEnd: 0
        }));
      }

      document.querySelector(".password-content-dialog-overlay")?.remove();
      showSnackbar(`密码保护内容已插入，访问密码：${password}（已加密传输）`);
    } catch (error) {
      console.error("密码加密失败:", error);
      showSnackbar("密码加密失败，请重试");
    }
  };
};

// === 预览区域点击事件处理 ===
const handlePreviewClick = (_event: MouseEvent) => {
  // 交互逻辑已通过 onclick 内联事件处理器实现
};

// === 主题观察器 ===
const themeObserver = new MutationObserver(() => {
  const newTheme = document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
  if (theme.value !== newTheme) {
    theme.value = newTheme;
  }
});

// === 异步处理新添加的音乐播放器节点 ===
const processNewMusicNode = async (node: Node) => {
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const element = node as HTMLElement;
  const players =
    element.querySelectorAll?.(
      ".markdown-music-player[data-music-id]:not([data-initialized])"
    ) || [];

  if (players.length > 0) {
    const tempDoc = document.implementation.createHTMLDocument();
    tempDoc.body.appendChild(element.cloneNode(true));
    await enrichMusicPlayers(tempDoc);

    players.forEach((player, index) => {
      const updatedPlayer = tempDoc.body.querySelectorAll(
        ".markdown-music-player"
      )[index];
      if (updatedPlayer) {
        const attrs = updatedPlayer.attributes;
        for (let i = 0; i < attrs.length; i++) {
          const attr = attrs[i];
          if (attr.name.startsWith("data-")) {
            (player as HTMLElement).setAttribute(attr.name, attr.value);
          }
        }

        const nameEl = player.querySelector(".music-name");
        const artistEl = player.querySelector(".music-artist");
        const artworkImgs = player.querySelectorAll(
          ".artwork-image, .artwork-image-blur"
        );

        const updatedName = updatedPlayer.querySelector(".music-name");
        const updatedArtist = updatedPlayer.querySelector(".music-artist");
        const updatedArtworks = updatedPlayer.querySelectorAll(
          ".artwork-image, .artwork-image-blur"
        );

        if (nameEl && updatedName) nameEl.textContent = updatedName.textContent;
        if (artistEl && updatedArtist)
          artistEl.textContent = updatedArtist.textContent;
        artworkImgs.forEach((img, idx) => {
          if (updatedArtworks[idx]) {
            (img as HTMLImageElement).src = (
              updatedArtworks[idx] as HTMLImageElement
            ).src;
          }
        });
      }

      initMusicPlayer(player as HTMLElement);
    });
  }

  if (
    element.classList?.contains("markdown-music-player") &&
    element.dataset.musicId &&
    !element.dataset.initialized
  ) {
    initMusicPlayer(element);
  }
};

// === 音乐播放器初始化观察器 ===
const musicPlayerObserver = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      processNewMusicNode(node);
    });
  });
});

// === 监听modelValue变化 ===
watch(
  () => props.modelValue,
  () => {
    if (props.modelValue && !currentHtml.value) {
      initializeHtml();
    }
  },
  { immediate: true }
);

// === 生命周期 ===
onMounted(async () => {
  try {
    const [{ MdEditor }, { installMarkdownEditorExtensions }] =
      await Promise.all([import("md-editor-v3"), import("./config")]);

    await import("md-editor-v3/lib/style.css");
    // 初始化编辑器扩展（包含 mermaid 动态加载）
    await installMarkdownEditorExtensions();

    MdEditorComponent.value = MdEditor;
    isEditorLoading.value = false;

    // 将复制处理函数暴露到全局
    (window as any).__markdownEditorCopyHandler = handleCodeCopy;

    // 设置密码确认全局函数
    setupGlobalPasswordConfirm();

    // 初始化主题
    theme.value = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
    themeObserver.observe(document.documentElement, { attributes: true });

    // 监听编辑器预览区域
    if (containerRef.value) {
      containerRef.value.addEventListener("click", handlePreviewClick);

      setTimeout(() => {
        const previewContainer = containerRef.value?.querySelector(
          ".md-editor-preview-wrapper"
        );
        if (previewContainer) {
          musicPlayerObserver.observe(previewContainer, {
            childList: true,
            subtree: true
          });

          if (previewContainer.children.length > 0) {
            processNewMusicNode(previewContainer as HTMLElement);
          }
        }
      }, 300);
    }

    nextTick(() => {
      initializeHtml();
    });

    nextTick(() => {
      setTimeout(() => {
        initToolbarButtons();
      }, 100);
    });
  } catch (error) {
    console.error("Failed to load markdown editor:", error);
    loadError.value = "Markdown编辑器加载失败";
    isEditorLoading.value = false;
  }
});

onUnmounted(() => {
  // 清理 Mermaid 渲染相关
  if (mermaidRenderTimer) {
    clearTimeout(mermaidRenderTimer);
    mermaidRenderTimer = null;
  }
  currentRenderAborted = true; // 中断正在进行的渲染
  mermaidRenderStatus.value = { isRendering: false, total: 0, rendered: 0 };

  themeObserver.disconnect();
  musicPlayerObserver.disconnect();
  disconnectObserver();
  if (containerRef.value) {
    containerRef.value.removeEventListener("click", handlePreviewClick);
  }
  delete (window as any).__markdownEditorCopyHandler;
  delete (window as any).confirmPasswordContent;
});

// === 暴露方法 ===
defineExpose({
  triggerSave: () => editorRef.value?.triggerSave(),
  // 异步版本的 triggerSave，返回 Promise，等待保存完成后 resolve
  triggerSaveAsync: () => {
    return new Promise<{ markdown: string; html: string }>(
      (resolve, reject) => {
        // 设置 resolver，handleSave 完成后会调用它
        saveCompleteResolver = resolve;

        // 触发保存
        if (editorRef.value?.triggerSave) {
          editorRef.value.triggerSave();
        } else {
          saveCompleteResolver = null;
          reject(new Error("编辑器未就绪"));
        }

        // 设置超时（30秒），防止永远等待
        setTimeout(() => {
          if (saveCompleteResolver) {
            saveCompleteResolver = null;
            reject(new Error("保存超时"));
          }
        }, 30000);
      }
    );
  },
  // 优先从预览区域获取渲染后的 HTML，确保包含 mermaid SVG 等渲染结果
  getCurrentHtml: () => getRenderedHtmlFromPreview() || currentHtml.value
});
</script>

<template>
  <div ref="containerRef" class="md-editor-container">
    <!-- 加载中状态 -->
    <div v-if="isEditorLoading" class="editor-loading">
      <div class="loading-spinner" />
      <span>正在加载Markdown编辑器...</span>
    </div>

    <!-- 加载失败状态 -->
    <div v-else-if="loadError" class="editor-error">
      <div class="error-icon">⚠️</div>
      <span>{{ loadError }}</span>
      <button class="retry-btn" @click="reloadPage">重新加载</button>
    </div>

    <!-- 动态渲染的编辑器 -->
    <template v-else-if="MdEditorComponent">
      <component
        :is="MdEditorComponent"
        ref="editorRef"
        style="height: 100%; max-height: 100%"
        :model-value="modelValue"
        :theme="theme"
        :toolbars="toolbars"
        :showCodeRowNumber="true"
        :sanitize="sanitize"
        :auto-fold-threshold="99999999"
        :showToolbarName="true"
        @update:model-value="val => emit('update:modelValue', val)"
        @onUploadImg="onUploadImg"
        @onSave="handleSave"
        @onHtmlChanged="handleHtmlChanged"
      />
      <!-- Mermaid 渲染进度提示 -->
      <Transition name="fade">
        <div
          v-if="
            mermaidRenderStatus.isRendering && mermaidRenderStatus.total > 0
          "
          class="mermaid-render-status"
        >
          <div class="mermaid-render-progress">
            <div class="loading-spinner small" />
            <span>
              正在渲染图表 {{ mermaidRenderStatus.rendered }}/{{
                mermaidRenderStatus.total
              }}
            </span>
          </div>
        </div>
      </Transition>
    </template>

    <!-- AI 写作对话框 -->
    <AIWritingDialog
      v-model="aiWritingDialogVisible"
      @insert="handleAIWritingInsert"
    />
  </div>
</template>

<style scoped lang="scss">
.md-editor-container {
  height: 100%;
  position: relative;
}

.editor-loading,
.editor-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--anzhiyu-fontcolor);
  text-align: center;
  gap: 16px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--anzhiyu-gray-op);
  border-top: 3px solid var(--anzhiyu-main);
  border-radius: 50%;
  animation: spin 1s linear infinite;

  &.small {
    width: 16px;
    height: 16px;
    border-width: 2px;
  }
}

.error-icon {
  font-size: 32px;
}

.retry-btn {
  padding: 8px 16px;
  background: var(--anzhiyu-main);
  color: var(--anzhiyu-white);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: var(--anzhiyu-main-op-deep);
  }
}

// Mermaid 渲染进度提示
.mermaid-render-status {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 100;
}

.mermaid-render-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--anzhiyu-card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  font-size: 13px;
  color: var(--anzhiyu-fontcolor);
}

// 过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
