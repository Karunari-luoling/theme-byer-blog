<script setup lang="ts">
import {
  ref,
  shallowRef,
  onMounted,
  onUnmounted,
  computed,
  nextTick,
  watch,
  reactive
} from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { useSnackbar } from "@/composables/useSnackbar";
import {
  useAIWriting,
  type AIWritingRequest
} from "@/composables/useAIWriting";
import { getArticleList, getArticle } from "@/api/post";

// 动态导入类型定义
type MdEditor = any;
type Themes = any;
type ExposeParam = any;
type ToolbarNames = any;

const props = withDefaults(
  defineProps<{
    modelValue: string;
    onUploadImg: (files: File[], callback: (urls: string[]) => void) => void;
    hidePremiumFeatures?: boolean; // 是否隐藏付费内容和密码保护功能（用于友链页面等场景）
  }>(),
  {
    hidePremiumFeatures: false
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "onSave", markdown: string, html: string): void;
}>();

const siteConfigStore = useSiteConfigStore();
const { showSnackbar } = useSnackbar();

// === AI 写作功能 ===
const aiWritingDialogVisible = ref(false);
const aiWritingForm = reactive<AIWritingRequest>({
  topic: "",
  style: "professional",
  length: "medium",
  useTags: true,
  customPrompt: "",
  learnFromHistory: false,
  historyArticleCount: 3,
  historyArticleSamples: ""
});
const aiWritingPreview = ref("");
const showAIWritingPreview = ref(false);
const isLoadingHistory = ref(false);
const aiWritingError = ref(""); // 错误提示信息
const aiWritingStatus = ref(""); // 当前状态提示

// 写作风格选项
const writingStyleOptions = [
  { value: "professional", label: "专业技术", description: "适合技术文章" },
  { value: "casual", label: "轻松随意", description: "适合生活分享" },
  { value: "academic", label: "学术严谨", description: "适合学术讨论" },
  { value: "creative", label: "创意文学", description: "适合创意写作" }
];

// 文章长度选项
const writingLengthOptions = [
  { value: "short", label: "短篇 (0~800字)" },
  { value: "medium", label: "中篇 (800~2000字)" },
  { value: "long", label: "长篇 (2000~5000字)" }
];

const {
  isGenerating: isAIWriting,
  generatedContent: streamingContent,
  generateStream: generateAIWritingStream,
  cancelGeneration: cancelAIWriting
} = useAIWriting({
  onSuccess: content => {
    aiWritingPreview.value = content;
    showAIWritingPreview.value = true;
    aiWritingError.value = "";
    aiWritingStatus.value = "";
  },
  onError: error => {
    console.error("AI 写作失败:", error);
    aiWritingError.value = error.message || "生成失败，请重试";
    aiWritingStatus.value = "";
  },
  onStream: _chunk => {
    // 流式输出时实时更新预览
    aiWritingPreview.value = streamingContent.value;
    // 显示预览区域
    if (!showAIWritingPreview.value) {
      showAIWritingPreview.value = true;
    }
  }
});

// 打开 AI 写作对话框
const openAIWritingDialog = () => {
  aiWritingForm.topic = "";
  aiWritingForm.style = "professional";
  aiWritingForm.length = "medium";
  aiWritingForm.useTags = true;
  aiWritingForm.customPrompt = "";
  aiWritingForm.learnFromHistory = false;
  aiWritingForm.historyArticleCount = 3;
  aiWritingForm.historyArticleSamples = "";
  aiWritingPreview.value = "";
  showAIWritingPreview.value = false;
  isLoadingHistory.value = false;
  aiWritingError.value = "";
  aiWritingStatus.value = "";
  aiWritingDialogVisible.value = true;
};

// 获取历史文章样本
const fetchHistoryArticleSamples = async (count: number): Promise<string> => {
  try {
    isLoadingHistory.value = true;

    // 先获取文章列表（列表不包含 content_md）
    const result = await getArticleList({
      page: 1,
      pageSize: count,
      status: "PUBLISHED"
    });

    if (result.code === 200 && result.data?.list?.length > 0) {
      // 逐个获取文章详情以获取 content_md
      const articlePromises = result.data.list.map(article =>
        getArticle(article.id).catch(err => {
          console.warn(`获取文章 ${article.id} 详情失败:`, err);
          return null;
        })
      );

      const articleDetails = await Promise.all(articlePromises);

      // 提取文章的 markdown 内容作为样本
      const samples = articleDetails
        .filter(res => res?.code === 200 && res.data?.content_md?.trim())
        .map((res, index) => {
          const article = res!.data;
          // 截取每篇文章前 2000 字符作为样本
          const content = article.content_md || "";
          const truncatedContent =
            content.length > 2000
              ? content.substring(0, 2000) + "..."
              : content;
          return `--- 参考文章 ${index + 1}：《${article.title}》 ---\n${truncatedContent}`;
        })
        .join("\n\n");

      return samples;
    }
    return "";
  } catch (error) {
    console.error("获取历史文章失败:", error);
    return "";
  } finally {
    isLoadingHistory.value = false;
  }
};

// 生成 AI 写作内容（流式）
const handleGenerateAIWriting = async () => {
  const totalStartTime = performance.now();
  console.log("[AI写作UI] ===== 点击开始生成 =====");

  aiWritingError.value = "";
  aiWritingStatus.value = "";
  aiWritingPreview.value = "";
  showAIWritingPreview.value = false;

  if (!aiWritingForm.topic.trim()) {
    aiWritingError.value = "请输入写作主题或大纲";
    return;
  }

  // 如果启用了历史文章学习，先获取历史文章样本
  if (aiWritingForm.learnFromHistory) {
    aiWritingStatus.value = "正在分析历史文章风格...";
    const historyStartTime = performance.now();
    const samples = await fetchHistoryArticleSamples(
      aiWritingForm.historyArticleCount || 3
    );
    console.log(
      `[AI写作UI] 获取历史文章耗时: ${(performance.now() - historyStartTime).toFixed(0)}ms`
    );
    if (samples) {
      aiWritingForm.historyArticleSamples = samples;
      console.log(`[AI写作UI] 历史文章样本长度: ${samples.length} 字符`);
      aiWritingStatus.value = "历史文章分析完成，开始流式生成...";
    } else {
      aiWritingStatus.value = "未找到可参考的历史文章，使用默认风格生成...";
      aiWritingForm.learnFromHistory = false;
    }
  } else {
    // 未启用历史文章学习时，确保清空历史文章样本
    aiWritingForm.historyArticleSamples = "";
    aiWritingStatus.value = "AI 正在创作中，内容将实时显示...";
  }

  console.log(
    `[AI写作UI] 准备阶段耗时: ${(performance.now() - totalStartTime).toFixed(0)}ms`
  );
  console.log(
    `[AI写作UI] 发送参数: learnFromHistory=${aiWritingForm.learnFromHistory}, historyArticleSamples长度=${aiWritingForm.historyArticleSamples?.length || 0}`
  );

  // 使用流式生成
  await generateAIWritingStream(aiWritingForm);
  console.log(
    `[AI写作UI] ===== 全部完成，总耗时: ${(performance.now() - totalStartTime).toFixed(0)}ms =====`
  );
};

// 插入 AI 生成的内容
const insertAIWritingContent = () => {
  if (!aiWritingPreview.value || !editorRef.value) return;

  editorRef.value.insert(() => ({
    targetValue: aiWritingPreview.value,
    select: false,
    deviationStart: 0,
    deviationEnd: 0
  }));

  aiWritingDialogVisible.value = false;
  showAIWritingPreview.value = false;
  aiWritingPreview.value = "";
  showSnackbar("AI 写作内容已插入");
};

// 重新生成
const regenerateAIWriting = async () => {
  showAIWritingPreview.value = false;
  aiWritingPreview.value = "";
  await handleGenerateAIWriting();
};

// 获取音乐API基础地址
const getMusicAPIBaseURL = (): string => {
  const apiBaseURL = siteConfigStore.siteConfig?.music?.api?.base_url;
  return apiBaseURL && apiBaseURL.trim() !== ""
    ? apiBaseURL.trim()
    : "https://metings.qjqq.cn";
};

// 动态导入的编辑器组件和加载状态
const MdEditorComponent = shallowRef<any>(null);
const isEditorLoading = ref(true);
const loadError = ref<string>("");

// 重新加载方法
const reloadPage = () => {
  window.location.reload();
};

const codeMaxLines = computed(
  () => siteConfigStore.getSiteConfig?.code_block?.code_max_lines || 10
);

const collapsedHeight = computed(() => {
  const lines = codeMaxLines.value > 0 ? codeMaxLines.value : 10;
  const height = lines * 25 + 15;
  return `${height}px`;
});

// 全局复制处理函数
const handleCodeCopy = (codeElement: HTMLElement) => {
  if (codeElement) {
    navigator.clipboard
      .writeText(codeElement.textContent || "")
      .then(() => {
        showSnackbar("复制成功，复制和转载请标注本文地址");
      })
      .catch(() => {
        showSnackbar("复制失败，请手动复制");
      });
  }
};

/**
 * 为音乐播放器注入完整数据
 */

/**
 * 从图片提取主色（用于保存）
 */
const extractDominantColorForSave = (imgUrl: string): Promise<string> => {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve("#49b1f5");
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let r = 0,
          g = 0,
          b = 0;
        const sampleSize = 10;

        for (let i = 0; i < data.length; i += 4 * sampleSize) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }

        const pixels = data.length / (4 * sampleSize);
        r = Math.floor(r / pixels);
        g = Math.floor(g / pixels);
        b = Math.floor(b / pixels);

        const color = `rgb(${r}, ${g}, ${b})`;
        console.log(`[主色提取] 提取到的主色:`, color);
        resolve(color);
      } catch (error) {
        console.error("[主色提取] 失败:", error);
        resolve("#49b1f5");
      }
    };
    img.onerror = () => {
      console.error("[主色提取] 图片加载失败");
      resolve("#49b1f5");
    };
    img.src = imgUrl;
  });
};

/**
 * 解码HTML实体
 */
const decodeHtmlEntities = (text: string): string => {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
};

const enrichMusicPlayers = async (doc: Document): Promise<void> => {
  const musicPlayers = doc.querySelectorAll(".markdown-music-player");

  if (musicPlayers.length === 0) return;

  console.log(
    `[编辑器预览] 发现 ${musicPlayers.length} 个音乐播放器，开始注入数据...`
  );

  const enrichPromises = Array.from(musicPlayers).map(async player => {
    const rawMusicId = player.getAttribute("data-music-id");
    const musicDataAttr = player.getAttribute("data-music-data");
    const hasInitialized = player.getAttribute("data-initialized");

    console.log(`[编辑器预览] 检查音乐播放器:`, {
      musicId: rawMusicId,
      hasMusicData: !!musicDataAttr,
      hasInitialized: !!hasInitialized,
      musicDataAttr: musicDataAttr?.substring(0, 100) + "..."
    });

    if (!rawMusicId) return;

    // 解码HTML实体（如 &quot; 转为 "）
    const musicId = decodeHtmlEntities(rawMusicId).replace(/['"]/g, "");

    // 检查是否已有完整数据
    let musicData: any = null;
    try {
      if (musicDataAttr) {
        musicData = JSON.parse(musicDataAttr.replace(/&quot;/g, '"'));
        if (
          musicData.name &&
          musicData.artist &&
          musicData.pic &&
          musicData.url
        ) {
          console.log(
            `[编辑器预览] 音乐 ${musicId} 已有完整数据（包括URL），跳过`
          );
          return; // 已有完整数据
        } else {
          console.log(`[编辑器预览] 音乐 ${musicId} 数据不完整:`, musicData);
        }
      }
    } catch (e) {
      console.warn(`[编辑器预览] 解析音乐数据失败:`, e);
    }

    try {
      console.log(`[编辑器预览] 开始获取音乐 ${musicId} 的数据...`);

      // 调用API获取音乐数据
      const apiBaseURL = getMusicAPIBaseURL();
      const formData = new URLSearchParams();
      formData.append("url", musicId);
      formData.append("level", "exhigh");
      formData.append("type", "json");

      let response = await fetch(`${apiBaseURL}/Song_V1`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData
      });

      let data = await response.json();

      // 如果exhigh失败，尝试standard
      if (!response.ok || data.status !== 200 || !data.success) {
        console.log(`[编辑器预览] exhigh品质失败，尝试standard品质...`);
        const standardFormData = new URLSearchParams();
        standardFormData.append("url", musicId);
        standardFormData.append("level", "standard");
        standardFormData.append("type", "json");

        response = await fetch(`${apiBaseURL}/Song_V1`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: standardFormData
        });

        data = await response.json();
      }

      if (data.status === 200 && data.success) {
        // 确保URL使用HTTPS
        const ensureHttps = (url: string) => {
          if (!url) return url;
          return url.startsWith("http://")
            ? url.replace("http://", "https://")
            : url;
        };

        const name = data.data.name || "";
        const artist = data.data.ar_name || "";
        const pic = ensureHttps(data.data.pic || "");
        const url = ensureHttps(data.data.url || "");

        console.log(`[编辑器预览] 获取到的音乐数据:`, {
          name,
          artist,
          pic,
          url
        });

        // 提取封面主色
        const dominantColor = await extractDominantColorForSave(pic);
        console.log(`[编辑器预览] 提取到的主色:`, dominantColor);

        // 更新data属性
        const fullMusicData = {
          neteaseId: musicId,
          name,
          artist,
          pic,
          url,
          color: dominantColor
        };

        const musicDataJson = JSON.stringify(fullMusicData).replace(
          /"/g,
          "&quot;"
        );
        console.log(`[编辑器预览] 准备设置data-music-data:`, musicDataJson);

        player.setAttribute("data-music-data", musicDataJson);
        player.setAttribute("data-initialized", "true");

        console.log(`[编辑器预览] 已设置属性，验证:`, {
          hasMusicData: player.hasAttribute("data-music-data"),
          musicDataValue: player.getAttribute("data-music-data"),
          hasInitialized: player.hasAttribute("data-initialized")
        });

        // 更新显示的文本和图片
        const nameEl = player.querySelector(".music-name");
        const artistEl = player.querySelector(".music-artist");
        const artworkImgs = player.querySelectorAll(
          ".artwork-image, .artwork-image-blur"
        );

        if (nameEl) nameEl.textContent = name;
        if (artistEl) artistEl.textContent = artist;
        artworkImgs.forEach(img => {
          (img as HTMLImageElement).src = pic;
        });

        console.log(`[编辑器预览] 音乐 ${musicId} 数据注入成功:`, {
          name,
          artist
        });
      } else {
        console.warn(`[编辑器预览] 获取音乐 ${musicId} 数据失败`);
      }
    } catch (error) {
      console.error(`[编辑器预览] 获取音乐 ${musicId} 数据异常:`, error);
    }
  });

  await Promise.all(enrichPromises);
  console.log(`[编辑器预览] 所有音乐播放器数据注入完成`);
};

// 存储当前的HTML内容
const currentHtml = ref<string>("");

// 初始化HTML内容
const initializeHtml = () => {
  // 如果有初始内容，手动触发一次HTML转换
  if (props.modelValue && !currentHtml.value) {
    // 简单的Markdown到HTML转换作为初始值
    // 这只是一个临时解决方案，实际的HTML会在onHtmlChanged中更新
    currentHtml.value = `<p>${props.modelValue.substring(0, 100)}...</p>`;
  }
};

// 处理 HTML 变化事件
const handleHtmlChanged = (html: string) => {
  // 存储最新的HTML内容
  currentHtml.value = html;
  // 调试输出（生产环境下可以移除）
  if (process.env.NODE_ENV === "development") {
    console.log("[MarkdownEditor] HTML内容已更新，长度:", html.length);
  }
  // 付费内容现在由 markdown-it 插件处理，这里只做简单的返回
  return html;
};

const sanitize = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, "text/html");

  // 处理代码块
  doc.querySelectorAll("details.md-editor-code").forEach(detailsElement => {
    const summaryElement = detailsElement.querySelector(
      "summary.md-editor-code-head"
    );
    if (!summaryElement) return;

    if (!summaryElement.querySelector(".copy-button")) {
      const langSpan = detailsElement.querySelector(".md-editor-code-lang");
      const language = langSpan ? langSpan.textContent?.trim() : "";

      // 内置代码复制逻辑
      const copyHandler = `
        event.preventDefault();
        event.stopPropagation();
        const code = this.closest('.md-editor-code').querySelector('pre code');
        if(code && window.__markdownEditorCopyHandler) {
          window.__markdownEditorCopyHandler(code);
        }
      `
        .replace(/\s+/g, " ")
        .trim();

      // 内置代码块展开/收起逻辑（details 的 toggle）
      const toggleHandler = `
        event.preventDefault();
        this.closest('details').open = !this.closest('details').open;
      `
        .replace(/\s+/g, " ")
        .trim();

      summaryElement.innerHTML = `
        <i class="anzhiyufont anzhiyu-icon-angle-down expand" onclick="${toggleHandler}"></i>
        <div class="code-lang">${language}</div>
        <i class="anzhiyufont anzhiyu-icon-paste copy-button" onclick="${copyHandler}"></i>`;
    }

    if (codeMaxLines.value !== -1) {
      const preElement = detailsElement.querySelector("pre");
      if (preElement) {
        let lineCount = 0;
        const rnWrapper = preElement.querySelector("span[rn-wrapper]");

        if (rnWrapper) {
          lineCount = rnWrapper.children.length;
        } else {
          lineCount = (preElement.textContent?.match(/\n/g) || []).length + 1;
        }

        if (lineCount > codeMaxLines.value) {
          detailsElement.classList.add("is-collapsible", "is-collapsed");
          preElement.style.height = collapsedHeight.value;
          preElement.style.overflow = "hidden";

          if (!detailsElement.querySelector(".code-expand-btn")) {
            const expandBtn = document.createElement("div");
            expandBtn.className = "code-expand-btn";

            // 内置展开/折叠逻辑 - 绑定到按钮上
            // 使用实际的高度值而不是模板字符串变量
            const collapsedHeightValue = collapsedHeight.value;
            const expandHandler = `
              const container = this.closest('details.md-editor-code');
              const pre = container.querySelector('pre');
              const icon = this.querySelector('i');
              if(container.classList.contains('is-collapsed')) {
                container.open = true;
                container.classList.remove('is-collapsed');
                if(pre) {
                  pre.style.height = '';
                  pre.style.overflow = '';
                }
                if(icon) {
                  icon.style.transform = 'rotate(180deg)';
                }
                this.classList.add('is-expanded');
              } else {
                container.classList.add('is-collapsed');
                if(pre) {
                  pre.style.height = '${collapsedHeightValue}';
                  pre.style.overflow = 'hidden';
                }
                if(icon) {
                  icon.style.transform = 'rotate(0deg)';
                }
                this.classList.remove('is-expanded');
              }
            `
              .replace(/\s+/g, " ")
              .trim();

            // 事件绑定到按钮上，图标添加过渡动画
            expandBtn.setAttribute("onclick", expandHandler);
            expandBtn.innerHTML = `<i class="anzhiyufont anzhiyu-icon-angle-double-down" style="transition: transform 0.3s ease;"></i>`;
            detailsElement.appendChild(expandBtn);
          }
        }
      }
    }
  });

  doc.querySelectorAll("table").forEach(table => {
    if (table.parentElement?.classList.contains("table-container")) {
      return;
    }
    const container = document.createElement("div");
    container.className = "table-container";
    if (table.parentNode) {
      table.parentNode.insertBefore(container, table);
      container.appendChild(table);
    }
  });

  return doc.body.innerHTML;
};

/**
 * 为HTML中的音乐播放器注入完整数据
 * @param html - 原始HTML
 * @returns 注入数据后的HTML
 */
const enrichHtmlMusicPlayers = async (html: string): Promise<string> => {
  const doc = new DOMParser().parseFromString(html, "text/html");

  // 调用已有的enrichMusicPlayers函数来注入数据
  await enrichMusicPlayers(doc);

  return doc.body.innerHTML;
};

const handleSave = async (markdown: string, htmlPromise: Promise<string>) => {
  console.log("[保存文章] 开始处理...");
  console.log("[保存文章] Markdown长度:", markdown.length);

  // 获取原始HTML
  const rawHtml = await htmlPromise;
  console.log("[保存文章] 原始HTML长度:", rawHtml.length);

  // 为HTML中的音乐播放器注入完整数据
  const enrichedHtml = await enrichHtmlMusicPlayers(rawHtml);
  console.log("[保存文章] 音乐数据注入后HTML长度:", enrichedHtml.length);

  // 清理HTML
  const sanitizedHtml = sanitize(enrichedHtml);

  // 保存：Markdown保持原样，HTML包含完整的音乐数据
  emit("onSave", markdown, sanitizedHtml);
  console.log("[保存文章] 保存完成");
};

// 插入付费内容标签
const insertPaidContent = () => {
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

  // 根据 md-editor-v3 文档，insert 方法接受函数并返回对象
  editorRef.value.insert(selectedText => {
    return {
      targetValue: paidContentTemplate,
      select: false,
      deviationStart: 0,
      deviationEnd: 0
    };
  });
};

// 插入密码保护内容标签
const insertPasswordContent = () => {
  if (!editorRef.value) return;

  // 显示密码设置对话框，让用户输入密码等信息
  showPasswordContentDialog();
};

// 显示密码保护内容设置对话框（但将配置信息嵌入到markdown标记中，而不是单独传递）
const showPasswordContentDialog = () => {
  const passwordDialog = document.createElement("div");
  passwordDialog.className = "password-content-dialog-overlay";
  passwordDialog.innerHTML = `
    <div class="password-content-dialog">
      <div class="dialog-header">
        <h3>设置密码保护内容</h3>
        <button class="dialog-close-btn" onclick="this.closest('.password-content-dialog-overlay').remove()">×</button>
      </div>
      <div class="dialog-body">
        <!-- 主要字段：密码和内容 -->
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

        <!-- 辅助字段：标题、提示等 -->
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
  const style = document.createElement("style");
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

      &:last-child {
        margin-bottom: 0;
      }

      &.primary-section {
        padding: 1.2rem;
        background: var(--anzhiyu-background);
        border: 2px solid var(--anzhiyu-main);
        border-radius: 12px;
        position: relative;

        &::before {
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
      }

      &.secondary-section {
        padding: 1rem;
        background: var(--anzhiyu-secondbg);
        border: 1px solid var(--anzhiyu-lighttext);
        border-radius: 8px;
      }
    }
    .section-title {
      margin: 0 0 1rem 0;
      font-size: 1em;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .primary-section & {
        color: var(--anzhiyu-main);

        &::before {
          content: "⭐";
        }
      }

      .secondary-section & {
        color: var(--anzhiyu-secondtext);

        &::before {
          content: "⚙️";
        }
      }
    }
    .form-group {
      margin-bottom: 1rem;

      .primary-section & {
        &:last-child {
          margin-bottom: 0;
        }
      }
    }
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      color: var(--anzhiyu-fontcolor);
      font-weight: 500;
    }
    .required {
      color: var(--anzhiyu-red);
    }
    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 0.75rem;
      border: var(--style-border-always);
      border-radius: 8px;
      background: var(--anzhiyu-background);
      color: var(--anzhiyu-fontcolor);
      font-size: 0.9rem;
      transition: all 0.3s;
      box-sizing: border-box;
    }
    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: var(--anzhiyu-main);
      box-shadow: var(--anzhiyu-shadow-lightblack);
    }
    .form-help {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.8rem;
      color: var(--anzhiyu-secondtext);
    }
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: var(--style-border-always);
      flex-shrink: 0;
      background: var(--anzhiyu-card-bg);
      border-radius: 0 0 12px 12px;
    }
    .btn-cancel,
    .btn-confirm {
      padding: 0.5rem 1.5rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.3s;
    }
    .btn-cancel {
      background: var(--anzhiyu-secondbg);
      color: var(--anzhiyu-fontcolor);
    }
    .btn-confirm {
      background: var(--anzhiyu-main);
      color: var(--anzhiyu-white);
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(passwordDialog);

  // 聚焦到密码输入框
  setTimeout(() => {
    const passwordInput = document.getElementById("password-value");
    if (passwordInput) passwordInput.focus();
  }, 100);
};

// 插入登录后可见内容标签
const insertLoginRequiredContent = () => {
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

  // 获取当前选中的文本内容
  const selection = editorRef.value.getSelectedText();
  if (selection) {
    // 如果有选中内容，将其包裹在登录后可见标签中
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
    // 没有选中内容，插入模板
    editorRef.value.insert(() => ({
      targetValue: loginRequiredContentTemplate,
      select: false,
      deviationStart: 0,
      deviationEnd: 0
    }));
  }

  showSnackbar("登录后可见内容已插入");
};

// 全局函数：确认插入密码保护内容（将配置直接嵌入markdown标记中）
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

  // 增强密码验证
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

  // 生成简洁的唯一ID用于标识这个密码保护块
  // 使用简短的时间戳 + 3位随机数，更简洁易读
  const timestamp = Date.now().toString().slice(-8); // 取时间戳后8位
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0"); // 3位随机数
  const blockId = `password-${timestamp}-${random}`;
  // 结果示例: password-80180352-123

  // 🔑 直接使用明文密码，后端会进行哈希处理
  try {
    // password字段放在第一个位置，使用明文密码
    const passwordContentTemplate = `:::password-content password="${password}" id="${blockId}" title="${title}" hint="${hint}" placeholder="${placeholder}"
${content.trim()}
:::

`;

    // 插入到编辑器
    if (editorRef.value) {
      editorRef.value.insert(selectedText => {
        return {
          targetValue: passwordContentTemplate,
          select: false,
          deviationStart: 0,
          deviationEnd: 0
        };
      });
    }

    // 关闭对话框
    document.querySelector(".password-content-dialog-overlay")?.remove();

    // 显示成功提示（显示原始密码给用户查看）
    showSnackbar(`密码保护内容已插入，访问密码：${password}（已加密传输）`);
  } catch (error) {
    console.error("密码加密失败:", error);
    showSnackbar("密码加密失败，请重试");
  }
};

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

const editorRef = ref<ExposeParam>();
const theme = ref<Themes>("light");
const containerRef = ref<HTMLElement | null>(null);

// 预览区域点击事件处理 - 现在大部分逻辑已内置到 HTML 中
// 这里保留是为了未来可能需要的额外处理
const handlePreviewClick = (event: MouseEvent) => {
  // 所有交互逻辑已经通过 onclick 内联事件处理器实现
  // 如果未来需要添加额外的全局处理逻辑，可以在这里扩展
};

// 主题观察器
const themeObserver = new MutationObserver(() => {
  const newTheme = document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
  if (theme.value !== newTheme) {
    theme.value = newTheme;
  }
});

/**
 * 异步处理新添加的音乐播放器节点
 */
const processNewNode = async (node: Node) => {
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const element = node as HTMLElement;
  // 查找新添加的音乐播放器
  const players =
    element.querySelectorAll?.(
      ".markdown-music-player[data-music-id]:not([data-initialized])"
    ) || [];

  // 先为播放器注入数据，再初始化
  if (players.length > 0) {
    const tempDoc = document.implementation.createHTMLDocument();
    tempDoc.body.appendChild(element.cloneNode(true));
    await enrichMusicPlayers(tempDoc);

    // 将更新后的内容同步回原DOM
    players.forEach((player, index) => {
      const updatedPlayer = tempDoc.body.querySelectorAll(
        ".markdown-music-player"
      )[index];
      if (updatedPlayer) {
        // 复制data属性
        const attrs = updatedPlayer.attributes;
        for (let i = 0; i < attrs.length; i++) {
          const attr = attrs[i];
          if (attr.name.startsWith("data-")) {
            (player as HTMLElement).setAttribute(attr.name, attr.value);
          }
        }

        // 复制更新的内容（歌名、歌手、封面）
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

  // 检查当前元素本身是否是播放器
  if (
    element.classList?.contains("markdown-music-player") &&
    element.dataset.musicId &&
    !element.dataset.initialized
  ) {
    initMusicPlayer(element);
  }
};

// 音乐播放器初始化观察器
const musicPlayerObserver = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      // 异步处理新节点（不阻塞观察器）
      processNewNode(node);
    });
  });
});

// 初始化单个音乐播放器
const initMusicPlayer = (player: HTMLElement) => {
  if (player.dataset.initialized) return;
  player.dataset.initialized = "true";

  const audio = player.querySelector(
    ".music-audio-element"
  ) as HTMLAudioElement;
  const artworkWrapper = player.querySelector(
    ".music-artwork-wrapper"
  ) as HTMLElement;
  const needleEl = player.querySelector(
    ".artwork-image-needle-background"
  ) as HTMLElement;
  const playIcon = player.querySelector(".music-play-icon") as HTMLElement;
  const pauseIcon = player.querySelector(".music-pause-icon") as HTMLElement;
  const progressBar = player.querySelector(
    ".music-progress-bar"
  ) as HTMLElement;
  const progressFill = player.querySelector(
    ".music-progress-fill"
  ) as HTMLElement;
  const currentTimeEl = player.querySelector(".current-time") as HTMLElement;
  const durationEl = player.querySelector(".duration") as HTMLElement;
  const musicName = player.querySelector(".music-name") as HTMLElement;
  const musicArtist = player.querySelector(".music-artist") as HTMLElement;
  const coverImage = player.querySelector(".artwork-image") as HTMLImageElement;
  const coverBlur = player.querySelector(
    ".artwork-image-blur"
  ) as HTMLImageElement;
  const errorEl = player.querySelector(".music-error") as HTMLElement;

  const neteaseId = player.dataset.musicId;

  // 确保URL使用HTTPS协议
  const ensureHttps = (url: string) => {
    if (!url) return url;
    if (url.startsWith("http://")) {
      return url.replace("http://", "https://");
    }
    return url;
  };

  // 从图片提取主色
  const extractDominantColor = (imgUrl: string): Promise<string> => {
    return new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve("var(--anzhiyu-main)");
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          let r = 0,
            g = 0,
            b = 0;
          const pixelCount = data.length / 4;

          for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
          }

          r = Math.floor(r / pixelCount);
          g = Math.floor(g / pixelCount);
          b = Math.floor(b / pixelCount);

          resolve(`rgb(${r}, ${g}, ${b})`);
        } catch (error) {
          console.error("[音乐播放器] 提取主色失败:", error);
          resolve("var(--anzhiyu-main)");
        }
      };
      img.onerror = () => {
        resolve("var(--anzhiyu-main)");
      };
      img.src = imgUrl;
    });
  };

  // 音乐资源获取函数
  const fetchMusicResources = async () => {
    if (!neteaseId) {
      console.error("[音乐播放器] 缺少音乐ID");
      return null;
    }

    try {
      // 尝试获取 exhigh 音质
      console.log("[音乐播放器] 尝试获取 exhigh 音质");
      const formData = new URLSearchParams();
      formData.append("url", neteaseId);
      formData.append("level", "exhigh");
      formData.append("type", "json");

      const response = await fetch("https://metings.qjqq.cn/Song_V1", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData
      });

      if (!response.ok) {
        // 如果 exhigh 失败，尝试 standard
        console.log("[音乐播放器] exhigh 失败，尝试 standard 音质");
        const standardFormData = new URLSearchParams();
        standardFormData.append("url", neteaseId);
        standardFormData.append("level", "standard");
        standardFormData.append("type", "json");

        const standardResponse = await fetch(
          "https://metings.qjqq.cn/Song_V1",
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: standardFormData
          }
        );

        if (!standardResponse.ok) {
          console.error("[音乐播放器] 所有音质都获取失败");
          return null;
        }

        const standardData = await standardResponse.json();
        if (standardData.status === 200 && standardData.success) {
          return {
            audioUrl: ensureHttps(standardData.data.url),
            name: standardData.data.name || "未知歌曲",
            artist: standardData.data.ar_name || "未知艺术家",
            pic: ensureHttps(standardData.data.pic || "")
          };
        }
        return null;
      }

      const data = await response.json();
      if (data.status === 200 && data.success) {
        return {
          audioUrl: ensureHttps(data.data.url),
          name: data.data.name || "未知歌曲",
          artist: data.data.ar_name || "未知艺术家",
          pic: ensureHttps(data.data.pic || "")
        };
      }

      // exhigh 无资源，尝试 standard
      console.log("[音乐播放器] exhigh 无资源，尝试 standard 音质");
      const standardFormData = new URLSearchParams();
      standardFormData.append("url", neteaseId);
      standardFormData.append("level", "standard");
      standardFormData.append("type", "json");

      const standardResponse = await fetch("https://metings.qjqq.cn/Song_V1", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: standardFormData
      });

      if (!standardResponse.ok) return null;

      const standardData = await standardResponse.json();
      if (standardData.status === 200 && standardData.success) {
        return {
          audioUrl: ensureHttps(standardData.data.url),
          name: standardData.data.name || "未知歌曲",
          artist: standardData.data.ar_name || "未知艺术家",
          pic: ensureHttps(standardData.data.pic || "")
        };
      }
    } catch (error) {
      console.error("[音乐播放器] 获取资源失败:", error);
    }

    return null;
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ":" + (secs < 10 ? "0" : "") + secs;
  };

  // 初始化音乐数据
  const initMusicData = async () => {
    // 检查是否有完整的data属性（保存后的文章会有）
    const dataName = player.dataset.musicName;
    const dataArtist = player.dataset.musicArtist;
    const dataPic = player.dataset.musicPic;
    const dataUrl = player.dataset.musicUrl;

    let resources;

    if (dataUrl && dataName) {
      // 使用data属性中的完整数据，不发起API请求
      // 对 pic 和 url 进行 https 转换
      resources = {
        audioUrl: ensureHttps(dataUrl),
        name: dataName,
        artist: dataArtist || "未知艺术家",
        pic: ensureHttps(dataPic || "")
      };
      console.log("[音乐播放器] 使用已保存的音乐数据:", dataName);
    } else {
      // 通过API获取数据（编辑器预览时）
      resources = await fetchMusicResources();
    }

    if (!resources || !resources.audioUrl) {
      // 显示错误信息
      if (errorEl) errorEl.style.display = "flex";
      console.error("[音乐播放器] 无法获取音乐资源");
      return false;
    }

    // 设置音频源
    audio.src = resources.audioUrl;
    // 预加载音频元数据以获取时长
    audio.load();

    // 更新歌曲信息
    if (musicName) musicName.textContent = resources.name;
    if (musicArtist) musicArtist.textContent = resources.artist;

    // 更新封面
    if (resources.pic) {
      if (coverImage) coverImage.src = resources.pic;
      if (coverBlur) coverBlur.src = resources.pic;

      // 提取封面主色并应用到进度条
      extractDominantColor(resources.pic).then(color => {
        if (progressFill) {
          progressFill.style.background = color;
        }
      });
    }

    console.log("[音乐播放器] 音乐数据加载完成:", resources.name);
    return true;
  };

  // 点击封面或播放图标播放/暂停
  const togglePlay = async () => {
    if (!audio.src) {
      console.error("[音乐播放器] 音频未加载");
      return;
    }

    if (audio.paused) {
      audio.play().catch(err => console.error("[音乐播放器] 播放失败:", err));
    } else {
      audio.pause();
    }
  };

  if (artworkWrapper) {
    artworkWrapper.addEventListener("click", togglePlay);
  }

  // 页面加载时自动获取音乐信息
  initMusicData();

  // 音频事件监听
  audio.addEventListener("play", () => {
    if (artworkWrapper) artworkWrapper.classList.add("is-playing");
    if (needleEl) needleEl.classList.add("needle-playing");
    if (playIcon) playIcon.style.display = "none";
    if (pauseIcon) pauseIcon.style.display = "block";
  });

  audio.addEventListener("pause", () => {
    if (artworkWrapper) artworkWrapper.classList.remove("is-playing");
    if (needleEl) needleEl.classList.remove("needle-playing");
    if (playIcon) playIcon.style.display = "block";
    if (pauseIcon) pauseIcon.style.display = "none";
  });

  audio.addEventListener("timeupdate", () => {
    const progress = (audio.currentTime / audio.duration) * 100 || 0;
    progressFill.style.width = progress + "%";
    currentTimeEl.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener("loadedmetadata", () => {
    durationEl.textContent = formatTime(audio.duration);
  });

  audio.addEventListener("ended", () => {
    audio.currentTime = 0;
    if (artworkWrapper) artworkWrapper.classList.remove("is-playing");
    if (needleEl) needleEl.classList.remove("needle-playing");
  });

  // 进度条点击
  progressBar.addEventListener("click", (e: MouseEvent) => {
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
  });
};

// 添加自定义付费内容按钮
const addCustomPaidContentButton = () => {
  // 如果隐藏高级功能，不添加按钮
  if (props.hidePremiumFeatures) return;

  if (!containerRef.value) return;

  // 查找工具栏容器
  const toolbar = containerRef.value.querySelector(".md-editor-toolbar-right");
  if (!toolbar) {
    // 如果工具栏还没渲染，重试
    setTimeout(() => addCustomPaidContentButton(), 200);
    return;
  }

  // 检查是否已经添加过按钮
  if (toolbar.querySelector(".paid-content-btn")) return;

  // 创建自定义按钮
  const paidContentBtn = document.createElement("div");
  paidContentBtn.className = "md-editor-toolbar-item paid-content-btn";
  paidContentBtn.title = "插入付费内容";
  paidContentBtn.innerHTML = [
    '<div class="md-editor-toolbar-item-content">',
    '<svg t="1757587236982" class="md-editor-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9670" width="200" height="200">',
    '<path d="M512 0c283.569231 0 512 228.430769 512 512s-228.430769 512-512 512S0 795.569231 0 512 228.430769 0 512 0z" fill="#FCAE54" p-id="9671"></path>',
    '<path d="M689.230769 267.815385c-7.876923-7.876923-19.692308-11.815385-31.507692-11.815385-11.815385 0-23.630769 3.938462-31.507692 11.815385L512 389.907692l-110.276923-122.092307c-11.815385-7.876923-23.630769-11.815385-35.446154-11.815385-11.815385 0-23.630769 3.938462-31.507692 11.815385-19.692308 19.692308-19.692308 47.261538 0 66.953846l66.953846 74.830769H326.892308c-7.876923 0-11.815385 3.938462-11.815385 11.815385v59.076923c0 7.876923 3.938462 11.815385 11.815385 11.815384H472.615385v78.769231H366.276923c-7.876923 0-11.815385 3.938462-11.815385 11.815385v55.138461c0 7.876923 3.938462 11.815385 11.815385 11.815385H472.615385v74.830769c0 23.630769 15.753846 47.261538 39.384615 47.261539 27.569231 0 43.323077-19.692308 43.323077-47.261539v-74.830769h106.338461c7.876923 0 11.815385-3.938462 11.815385-11.815385v-55.138461c0-7.876923-3.938462-11.815385-11.815385-11.815385h-106.338461v-78.769231h141.784615c7.876923 0 11.815385-3.938462 11.815385-11.815384v-59.076923c0-7.876923-3.938462-11.815385-11.815385-11.815385h-70.892307l66.953846-74.830769c15.753846-19.692308 15.753846-47.261538-3.938462-66.953846z" fill="#FFFFFF" p-id="9672"></path>',
    "</svg>",
    '<span class="md-editor-toolbar-item-name">付费内容</span>',
    "</div>"
  ].join("");

  // 添加点击事件
  paidContentBtn.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();
    insertPaidContent();
  });

  // 添加样式
  paidContentBtn.style.cssText = [
    "display: flex",
    "align-items: center",
    "justify-content: center",
    "cursor: pointer",
    "border-radius: 4px",
    "transition: background-color 0.2s",
    "margin-left: 4px"
  ].join("; ");

  paidContentBtn.addEventListener("mouseenter", () => {
    paidContentBtn.style.backgroundColor = "var(--md-bk-color-outstand)";
  });

  paidContentBtn.addEventListener("mouseleave", () => {
    paidContentBtn.style.backgroundColor = "transparent";
  });

  // 插入到工具栏末尾
  toolbar.appendChild(paidContentBtn);
};

// 添加自定义密码内容按钮
const addCustomPasswordContentButton = () => {
  // 如果隐藏高级功能，不添加按钮
  if (props.hidePremiumFeatures) return;

  if (!containerRef.value) return;

  // 查找工具栏容器
  const toolbar = containerRef.value.querySelector(".md-editor-toolbar-right");
  if (!toolbar) {
    // 如果工具栏还没渲染，重试
    setTimeout(() => addCustomPasswordContentButton(), 200);
    return;
  }

  // 检查是否已经添加过按钮
  if (toolbar.querySelector(".password-content-btn")) return;

  // 创建自定义按钮
  const passwordContentBtn = document.createElement("div");
  passwordContentBtn.className = "md-editor-toolbar-item password-content-btn";
  passwordContentBtn.title = "插入密码保护内容（PRO版本）";
  passwordContentBtn.innerHTML = [
    '<div class="md-editor-toolbar-item-content">',
    '<svg t="1757587236982" class="md-editor-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="15847" width="200" height="200">',
    '<path d="M832 464h-68V240c0-70.7-57.3-128-128-128H388c-70.7 0-128 57.3-128 128v224h-68c-17.7 0-32 14.3-32 32v384c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V496c0-17.7-14.3-32-32-32zM332 240c0-30.9 25.1-56 56-56h248c30.9 0 56 25.1 56 56v224H332V240z m460 600H232V536h560v304z" fill="#5470C6" p-id="15848"></path>',
    '<path d="M484 701v53c0 4.4 3.6 8 8 8h40c4.4 0 8-3.6 8-8v-53c12.1-8.7 20-22.9 20-39 0-26.5-21.5-48-48-48s-48 21.5-48 48c0 16.1 7.9 30.3 20 39z" fill="#5470C6" p-id="15849"></path>',
    "</svg>",
    '<span class="md-editor-toolbar-item-name">密码保护</span>',
    "</div>"
  ].join("");

  // 添加点击事件
  passwordContentBtn.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();
    insertPasswordContent();
  });

  // 添加样式
  passwordContentBtn.style.cssText = [
    "display: flex",
    "align-items: center",
    "justify-content: center",
    "cursor: pointer",
    "border-radius: 4px",
    "transition: background-color 0.2s",
    "margin-left: 4px",
    "position: relative"
  ].join("; ");

  passwordContentBtn.addEventListener("mouseenter", () => {
    passwordContentBtn.style.backgroundColor = "var(--md-bk-color-outstand)";
  });

  passwordContentBtn.addEventListener("mouseleave", () => {
    passwordContentBtn.style.backgroundColor = "transparent";
  });

  // 插入到工具栏末尾
  toolbar.appendChild(passwordContentBtn);
};

// 添加自定义登录后可见内容按钮
const addCustomLoginRequiredContentButton = () => {
  // 如果隐藏高级功能，不添加按钮
  if (props.hidePremiumFeatures) return;

  if (!containerRef.value) return;

  // 查找工具栏容器
  const toolbar = containerRef.value.querySelector(".md-editor-toolbar-right");
  if (!toolbar) {
    // 如果工具栏还没渲染，重试
    setTimeout(() => addCustomLoginRequiredContentButton(), 200);
    return;
  }

  // 检查是否已经添加过按钮
  if (toolbar.querySelector(".login-required-content-btn")) return;

  // 创建自定义按钮
  const loginRequiredContentBtn = document.createElement("div");
  loginRequiredContentBtn.className =
    "md-editor-toolbar-item login-required-content-btn";
  loginRequiredContentBtn.title = "插入登录后可见内容（PRO版本）";
  loginRequiredContentBtn.innerHTML = [
    '<div class="md-editor-toolbar-item-content">',
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="md-editor-icon">',
    '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>',
    '<circle cx="12" cy="7" r="4"/>',
    "</svg>",
    '<span class="md-editor-toolbar-item-name">登录可见</span>',
    "</div>"
  ].join("");

  // 添加点击事件
  loginRequiredContentBtn.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();
    insertLoginRequiredContent();
  });

  // 添加样式
  loginRequiredContentBtn.style.cssText = [
    "display: flex",
    "align-items: center",
    "justify-content: center",
    "cursor: pointer",
    "border-radius: 4px",
    "transition: background-color 0.2s",
    "margin-left: 4px",
    "position: relative"
  ].join("; ");

  loginRequiredContentBtn.addEventListener("mouseenter", () => {
    loginRequiredContentBtn.style.backgroundColor =
      "var(--md-bk-color-outstand)";
  });

  loginRequiredContentBtn.addEventListener("mouseleave", () => {
    loginRequiredContentBtn.style.backgroundColor = "transparent";
  });

  // 插入到工具栏末尾
  toolbar.appendChild(loginRequiredContentBtn);
};

// 添加 AI 写作按钮
const addAIWritingButton = () => {
  if (!containerRef.value) return;

  // 查找工具栏容器
  const toolbar = containerRef.value.querySelector(".md-editor-toolbar-right");
  if (!toolbar) {
    // 如果工具栏还没渲染，重试
    setTimeout(() => addAIWritingButton(), 200);
    return;
  }

  // 检查是否已经添加过按钮
  if (toolbar.querySelector(".ai-writing-btn")) return;

  // 创建自定义按钮
  const aiWritingBtn = document.createElement("div");
  aiWritingBtn.className = "md-editor-toolbar-item ai-writing-btn";
  aiWritingBtn.title = "AI 写作助手";
  aiWritingBtn.innerHTML = [
    '<div class="md-editor-toolbar-item-content">',
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="md-editor-icon" style="color: var(--anzhiyu-main);">',
    '<path d="M12 2a10 10 0 1 0 10 10H12V2z"/>',
    '<path d="M12 2a10 10 0 0 1 10 10"/>',
    '<path d="M12 12l8.5-8.5"/>',
    '<circle cx="12" cy="12" r="2"/>',
    "</svg>",
    '<span class="md-editor-toolbar-item-name" style="color: var(--anzhiyu-main); font-weight: 600;">AI写作</span>',
    "</div>"
  ].join("");

  // 添加点击事件
  aiWritingBtn.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();
    openAIWritingDialog();
  });

  // 添加样式
  aiWritingBtn.style.cssText = [
    "display: flex",
    "align-items: center",
    "justify-content: center",
    "cursor: pointer",
    "border-radius: 4px",
    "transition: background-color 0.2s",
    "margin-left: 4px",
    "position: relative"
  ].join("; ");

  aiWritingBtn.addEventListener("mouseenter", () => {
    aiWritingBtn.style.backgroundColor = "var(--md-bk-color-outstand)";
  });

  aiWritingBtn.addEventListener("mouseleave", () => {
    aiWritingBtn.style.backgroundColor = "transparent";
  });

  // 插入到工具栏最前面（最显眼的位置）
  toolbar.insertBefore(aiWritingBtn, toolbar.firstChild);
};

// 监听modelValue变化，确保HTML内容同步更新
watch(
  () => props.modelValue,
  () => {
    if (props.modelValue && !currentHtml.value) {
      initializeHtml();
    }
  },
  { immediate: true }
);

onMounted(async () => {
  // 动态导入 md-editor-v3
  try {
    const [{ MdEditor }, { installMarkdownEditorExtensions }] =
      await Promise.all([import("md-editor-v3"), import("./config")]);

    // 动态导入样式
    await import("md-editor-v3/lib/style.css");

    // 初始化编辑器扩展
    installMarkdownEditorExtensions();

    MdEditorComponent.value = MdEditor;
    isEditorLoading.value = false;

    // 将复制处理函数暴露到全局作用域
    (window as any).__markdownEditorCopyHandler = handleCodeCopy;

    // 初始化主题和监听器
    theme.value = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
    themeObserver.observe(document.documentElement, { attributes: true });

    // 监听编辑器预览区域的DOM变化以初始化音乐播放器
    if (containerRef.value) {
      containerRef.value.addEventListener("click", handlePreviewClick);

      // 延迟启动音乐播放器观察器，确保编辑器已完全渲染
      setTimeout(() => {
        const previewContainer = containerRef.value?.querySelector(
          ".md-editor-preview-wrapper"
        );
        if (previewContainer) {
          musicPlayerObserver.observe(previewContainer, {
            childList: true,
            subtree: true
          });

          // 初始化已存在的音乐播放器（异步加载数据）
          if (previewContainer.children.length > 0) {
            // 处理整个预览容器
            processNewNode(previewContainer as HTMLElement);
          }
        }
      }, 300);
    }

    // 初始化HTML内容
    nextTick(() => {
      initializeHtml();
    });

    // 添加自定义按钮
    nextTick(() => {
      // 延迟添加按钮，确保编辑器完全渲染
      setTimeout(() => {
        addAIWritingButton();
        addCustomPaidContentButton();
        addCustomPasswordContentButton();
        addCustomLoginRequiredContentButton();
      }, 100);
    });
  } catch (error) {
    console.error("Failed to load markdown editor:", error);
    loadError.value = "Markdown编辑器加载失败";
    isEditorLoading.value = false;
  }
});

onUnmounted(() => {
  themeObserver.disconnect();
  musicPlayerObserver.disconnect();
  if (containerRef.value) {
    containerRef.value.removeEventListener("click", handlePreviewClick);
  }
  // 清理全局函数
  delete (window as any).__markdownEditorCopyHandler;
  delete (window as any).confirmPasswordContent;
});

// 移除密码配置管理，简化组件接口
defineExpose({
  triggerSave: () => editorRef.value?.triggerSave(),
  getCurrentHtml: () => currentHtml.value
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
    <component
      :is="MdEditorComponent"
      v-else-if="MdEditorComponent"
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

    <!-- AI 写作对话框 -->
    <Teleport to="body">
      <div v-if="aiWritingDialogVisible" class="ai-writing-dialog-overlay">
        <div class="ai-writing-dialog">
          <!-- AI 生成中遮罩 -->
          <div
            v-if="isAIWriting && !showAIWritingPreview"
            class="ai-generating-mask"
          >
            <div class="generating-content">
              <div class="generating-spinner">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
                  />
                </svg>
              </div>
              <div class="generating-text">
                <h4>AI 正在创作中...</h4>
                <p>{{ aiWritingStatus || "正在生成精彩内容，请稍候" }}</p>
              </div>
              <button class="cancel-generating-btn" @click="cancelAIWriting">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
                停止生成
              </button>
            </div>
          </div>

          <div class="dialog-header">
            <div class="dialog-title">
              <div
                class="title-icon"
                style="
                  width: 32px;
                  height: 32px;
                  border-radius: 8px;
                  background: var(--anzhiyu-theme);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                "
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  style="width: 16px; height: 16px"
                >
                  <path
                    d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
                  />
                  <path d="M20 3v4" />
                  <path d="M22 5h-4" />
                  <path d="M4 17v2" />
                  <path d="M5 18H3" />
                </svg>
              </div>
              <div class="title-text">
                <h3>AI 写作助手</h3>
                <span class="title-subtitle">让 AI 帮你创作精彩内容</span>
              </div>
            </div>
            <button
              class="dialog-close-btn"
              @click="aiWritingDialogVisible = false"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          <!-- 错误提示 -->
          <div v-if="aiWritingError" class="dialog-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m15 9-6 6" />
              <path d="m9 9 6 6" />
            </svg>
            <span>{{ aiWritingError }}</span>
            <button class="error-close" @click="aiWritingError = ''">×</button>
          </div>

          <div class="dialog-body">
            <!-- 输入区域 -->
            <div v-if="!showAIWritingPreview" class="ai-writing-form">
              <!-- 主题输入区 -->
              <div class="form-section topic-section">
                <div class="topic-input-wrapper">
                  <textarea
                    v-model="aiWritingForm.topic"
                    rows="4"
                    placeholder="描述你想要创作的内容...（必填）"
                    class="topic-textarea"
                  />
                  <div class="input-hints">
                    <span
                      class="hint-item"
                      @click="aiWritingForm.topic = '介绍 Vue 3 的新特性'"
                      >💡 介绍 Vue 3 的新特性</span
                    >
                    <span
                      class="hint-item"
                      @click="aiWritingForm.topic = '分享博客搭建经验'"
                      >📝 分享博客搭建经验</span
                    >
                    <span
                      class="hint-item"
                      @click="aiWritingForm.topic = 'TypeScript 高级类型解析'"
                      >🔧 TypeScript 高级类型解析</span
                    >
                  </div>
                </div>
              </div>

              <!-- 配置选项区 -->
              <div class="form-section config-section">
                <div class="config-grid">
                  <!-- 写作风格 -->
                  <div class="config-block">
                    <div class="config-label">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path
                          d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"
                        />
                        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                        <path d="m5 12-3 3 3 3" />
                        <path d="m9 18 3-3-3-3" />
                      </svg>
                      <span>写作风格</span>
                    </div>
                    <div class="style-cards">
                      <div
                        v-for="style in writingStyleOptions"
                        :key="style.value"
                        class="style-card"
                        :class="{ active: aiWritingForm.style === style.value }"
                        @click="
                          aiWritingForm.style =
                            style.value as AIWritingRequest['style']
                        "
                      >
                        <span class="style-name">{{ style.label }}</span>
                        <span class="style-hint">{{ style.description }}</span>
                        <div class="card-check">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="3"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 文章长度 -->
                  <div class="config-block">
                    <div class="config-label">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <line x1="21" x2="14" y1="4" y2="4" />
                        <line x1="10" x2="3" y1="4" y2="4" />
                        <line x1="21" x2="12" y1="12" y2="12" />
                        <line x1="8" x2="3" y1="12" y2="12" />
                        <line x1="21" x2="16" y1="20" y2="20" />
                        <line x1="12" x2="3" y1="20" y2="20" />
                      </svg>
                      <span>文章长度</span>
                    </div>
                    <div class="length-pills">
                      <div
                        v-for="length in writingLengthOptions"
                        :key="length.value"
                        class="length-pill"
                        :class="{
                          active: aiWritingForm.length === length.value
                        }"
                        @click="
                          aiWritingForm.length =
                            length.value as AIWritingRequest['length']
                        "
                      >
                        <span class="pill-label">{{
                          length.label.split(" ")[0]
                        }}</span>
                        <span class="pill-count">{{
                          length.label.match(/\(([^)]+)\)/)?.[1] || ""
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 增强选项区 -->
              <div class="form-section enhance-section">
                <div class="enhance-options">
                  <label
                    class="enhance-option"
                    :class="{ active: aiWritingForm.useTags }"
                  >
                    <input v-model="aiWritingForm.useTags" type="checkbox" />
                    <div class="option-content">
                      <div class="option-text">
                        <span class="option-title">博客标签插件</span>
                        <span class="option-desc"
                          >使用提示框、折叠、选项卡等丰富内容</span
                        >
                      </div>
                    </div>
                    <div class="option-toggle">
                      <div class="toggle-track">
                        <div class="toggle-thumb" />
                      </div>
                    </div>
                  </label>

                  <label
                    class="enhance-option"
                    :class="{ active: aiWritingForm.learnFromHistory }"
                  >
                    <input
                      v-model="aiWritingForm.learnFromHistory"
                      type="checkbox"
                    />
                    <div class="option-content">
                      <div class="option-text">
                        <span class="option-title">学习写作风格</span>
                        <span class="option-desc"
                          >参考历史文章，模仿你的表达方式</span
                        >
                      </div>
                    </div>
                    <div class="option-toggle">
                      <div class="toggle-track">
                        <div class="toggle-thumb" />
                      </div>
                    </div>
                  </label>
                </div>

                <!-- 历史文章数量选择 -->
                <div
                  v-if="aiWritingForm.learnFromHistory"
                  class="history-config"
                >
                  <div class="history-label">参考文章数量</div>
                  <div class="history-chips">
                    <div
                      v-for="count in [2, 3, 5]"
                      :key="count"
                      class="history-chip"
                      :class="{
                        active: aiWritingForm.historyArticleCount === count
                      }"
                      @click="aiWritingForm.historyArticleCount = count"
                    >
                      {{ count }} 篇
                    </div>
                  </div>
                  <div class="history-note">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <path d="M12 8h.01" />
                    </svg>
                    AI 将分析你最近发布的文章，学习写作风格后再创作
                  </div>
                </div>
              </div>

              <!-- 高级选项 -->
              <details class="advanced-section">
                <summary class="advanced-toggle">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path
                      d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
                    />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>高级选项</span>
                  <svg
                    class="chevron"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </summary>
                <div class="advanced-content">
                  <label class="advanced-label">自定义提示词</label>
                  <textarea
                    v-model="aiWritingForm.customPrompt"
                    rows="3"
                    placeholder="添加额外的写作要求或指导..."
                    class="advanced-textarea"
                  />
                </div>
              </details>
            </div>

            <!-- 预览区域（流式生成时也显示） -->
            <div v-else class="ai-writing-preview">
              <div class="preview-header">
                <span class="preview-label">
                  <template v-if="isAIWriting">
                    <span class="streaming-indicator">
                      <span class="streaming-dot" />
                      AI 正在创作中...
                    </span>
                  </template>
                  <template v-else> AI 生成内容预览 </template>
                </span>
                <button
                  v-if="!isAIWriting"
                  class="regenerate-btn"
                  @click="regenerateAIWriting"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path
                      d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"
                    />
                  </svg>
                  重新生成
                </button>
                <button v-else class="cancel-btn" @click="cancelAIWriting">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                  停止生成
                </button>
              </div>
              <div class="preview-content" :class="{ streaming: isAIWriting }">
                <pre>{{ aiWritingPreview }}<span v-if="isAIWriting" class="cursor-blink">|</span></pre>
              </div>
              <div class="streaming-status">
                <span class="char-count">
                  <template v-if="isAIWriting">
                    <span class="streaming-dot" /> 正在生成...
                  </template>
                  已生成 {{ aiWritingPreview.length }} 字
                </span>
              </div>
            </div>
          </div>

          <div class="dialog-footer">
            <button class="btn-cancel" @click="aiWritingDialogVisible = false">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
              取消
            </button>
            <button
              v-if="!showAIWritingPreview"
              class="btn-generate"
              :disabled="isAIWriting || !aiWritingForm.topic.trim()"
              @click="handleGenerateAIWriting"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
                />
                <path d="M20 3v4" />
                <path d="M22 5h-4" />
                <path d="M4 17v2" />
                <path d="M5 18H3" />
              </svg>
              开始生成
            </button>
            <button v-else class="btn-insert" @click="insertAIWritingContent">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
              插入到编辑器
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.md-editor-container {
  height: 100%;
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

// AI 写作对话框样式
.ai-writing-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  backdrop-filter: blur(6px);
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.ai-writing-dialog {
  position: relative;
  background: var(--anzhiyu-card-bg);
  border-radius: 14px;
  width: 92%;
  max-width: 540px;
  max-height: 85vh;
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.2s ease-out;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: var(--style-border);
  background: var(--anzhiyu-secondbg);
}

.dialog-title {
  display: flex;
  align-items: center;
  gap: 10px;

  .title-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--anzhiyu-theme);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--anzhiyu-shadow-lightblack);

    svg {
      color: var(--anzhiyu-white);
      width: 16px;
      height: 16px;
    }
  }

  .title-text {
    h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
    }

    .title-subtitle {
      font-size: 11px;
      color: var(--anzhiyu-secondtext);
      margin-top: 1px;
      display: block;
    }
  }
}

.dialog-close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--anzhiyu-secondtext);
  padding: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.15s;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: var(--anzhiyu-theme-op);
    color: var(--anzhiyu-red);
  }
}

// AI 生成中遮罩样式
.ai-generating-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  animation: fadeIn 0.3s ease-out;

  .generating-content {
    text-align: center;
    color: white;
    padding: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .generating-spinner {
    svg {
      width: 48px;
      height: 48px;
      animation: sparkle 2s ease-in-out infinite;
      filter: drop-shadow(0 0 12px rgba(73, 177, 245, 0.6));
    }
  }

  .generating-text {
    h4 {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
      color: white;
    }

    p {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.85);
    }
  }

  .generating-stats {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 20px;
  }

  .cancel-generating-btn {
    margin-top: 8px;
    padding: 10px 24px;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    color: white;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;

    svg {
      width: 14px;
      height: 14px;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(255, 255, 255, 0.5);
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes sparkle {
  0%,
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
  50% {
    transform: scale(1.1) rotate(180deg);
    opacity: 0.8;
  }
}

// 错误提示样式
.dialog-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--anzhiyu-theme-op);
  border-bottom: var(--style-border);
  color: var(--anzhiyu-red);
  font-size: 12px;
  animation: slideDown 0.2s ease-out;

  svg {
    flex-shrink: 0;
    width: 14px;
    height: 14px;
  }

  span {
    flex: 1;
  }

  .error-close {
    background: none;
    border: none;
    color: var(--anzhiyu-red);
    cursor: pointer;
    font-size: 14px;
    padding: 2px 6px;
    border-radius: 4px;
    transition: all 0.15s;

    &:hover {
      background: var(--anzhiyu-theme-op);
    }
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dialog-body {
  flex: 1;
  overflow-y: auto;
  scrollbar-gutter: stable;
  padding: 16px;
  position: relative;
}

// 新版紧凑表单样式
.ai-writing-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

// 表单区块
.form-section {
  background: var(--anzhiyu-secondbg);
  border-radius: 10px;
  padding: 12px;
}

// 主题输入区
.topic-section {
  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }

  .section-icon {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: var(--anzhiyu-theme);
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      color: var(--anzhiyu-white);
      width: 14px;
      height: 14px;
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 6px;

    .title {
      font-size: 13px;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
    }

    .required-badge {
      font-size: 10px;
      padding: 2px 6px;
      background: var(--anzhiyu-theme-op);
      color: var(--anzhiyu-red);
      border-radius: 4px;
      font-weight: 500;
    }
  }
}

.topic-input-wrapper {
  .topic-textarea {
    width: 100%;
    padding: 10px 12px;
    border: var(--style-border);
    border-radius: 8px;
    background: var(--anzhiyu-card-bg);
    color: var(--anzhiyu-fontcolor);
    font-size: 13px;
    line-height: 1.5;
    resize: none;
    transition: all 0.2s;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: var(--anzhiyu-main);
      box-shadow: var(--anzhiyu-shadow-lightblack);
    }

    &::placeholder {
      color: var(--anzhiyu-secondtext);
    }
  }

  .input-hints {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;

    .hint-item {
      font-size: 11px;
      padding: 4px 8px;
      background: var(--anzhiyu-card-bg);
      border: var(--style-border);
      border-radius: 12px;
      color: var(--anzhiyu-secondtext);
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        border-color: var(--anzhiyu-main);
        color: var(--anzhiyu-main);
        background: var(--anzhiyu-theme-op);
      }
    }
  }
}

// 配置区域
.config-section {
  padding: 10px;
}

.config-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-block {
  .config-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 500;
    color: var(--anzhiyu-secondtext);
    margin-bottom: 8px;

    svg {
      width: 14px;
      height: 14px;
      opacity: 0.7;
    }
  }
}

// 风格卡片
.style-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.style-card {
  position: relative;
  padding: 8px 6px;
  border: var(--style-border);
  border-radius: 8px;
  background: var(--anzhiyu-card-bg);
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;

  .style-icon {
    font-size: 16px;
    display: block;
    margin-bottom: 4px;
  }

  .style-name {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor);
    margin-bottom: 2px;
  }

  .style-hint {
    display: block;
    font-size: 9px;
    color: var(--anzhiyu-secondtext);
    line-height: 1.2;
  }

  .card-check {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--anzhiyu-main);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transform: scale(0.5);
    transition: all 0.15s;

    svg {
      color: white;
      width: 8px;
      height: 8px;
    }
  }

  &:hover {
    border-color: var(--anzhiyu-theme);
    background: var(--anzhiyu-theme-op);
  }

  &.active {
    border-color: var(--anzhiyu-main);
    background: var(--anzhiyu-theme-op);

    .card-check {
      opacity: 1;
      transform: scale(1);
    }

    .style-name {
      color: var(--anzhiyu-main);
    }
  }
}

// 长度选择
.length-pills {
  display: flex;
  gap: 6px;
}

.length-pill {
  flex: 1;
  padding: 8px 6px;
  border: var(--style-border);
  border-radius: 8px;
  background: var(--anzhiyu-card-bg);
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;

  .pill-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor);
  }

  .pill-count {
    display: block;
    font-size: 10px;
    color: var(--anzhiyu-secondtext);
    margin-top: 2px;
  }

  &:hover {
    border-color: var(--anzhiyu-theme);
  }

  &.active {
    border-color: var(--anzhiyu-main);
    background: var(--anzhiyu-main);

    .pill-label,
    .pill-count {
      color: white;
    }
  }
}

// 增强选项区
.enhance-section {
  background: transparent;
  padding: 0;
}

.enhance-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.enhance-option {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: var(--anzhiyu-secondbg);
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;

  input[type="checkbox"] {
    display: none;
  }

  .option-content {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
  }

  .option-icon {
    font-size: 18px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--anzhiyu-card-bg);
    border-radius: 8px;
  }

  .option-text {
    flex: 1;

    .option-title {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
    }

    .option-desc {
      display: block;
      font-size: 10px;
      color: var(--anzhiyu-secondtext);
      margin-top: 2px;
    }
  }

  .option-toggle {
    .toggle-track {
      width: 36px;
      height: 20px;
      background: var(--anzhiyu-card-border);
      border-radius: 10px;
      position: relative;
      transition: all 0.2s;

      .toggle-thumb {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 16px;
        height: 16px;
        background: white;
        border-radius: 50%;
        transition: all 0.2s;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      }
    }
  }

  &:hover {
    background: var(--anzhiyu-theme-op);
  }

  &.active {
    border-color: var(--anzhiyu-theme);
    background: var(--anzhiyu-theme-op);

    .option-toggle .toggle-track {
      background: var(--anzhiyu-main);

      .toggle-thumb {
        left: 18px;
      }
    }
  }
}

// 历史配置
.history-config {
  margin-top: 8px;
  padding: 10px 12px;
  background: var(--anzhiyu-theme-op);
  border: var(--style-border);
  border-radius: 8px;
  animation: slideDown 0.2s ease-out;

  .history-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--anzhiyu-secondtext);
    margin-bottom: 8px;
  }

  .history-chips {
    display: flex;
    gap: 6px;
  }

  .history-chip {
    flex: 1;
    padding: 6px 10px;
    background: var(--anzhiyu-card-bg);
    border: var(--style-border);
    border-radius: 6px;
    font-size: 11px;
    font-weight: 500;
    color: var(--anzhiyu-fontcolor);
    text-align: center;
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      border-color: var(--anzhiyu-main);
    }

    &.active {
      background: var(--anzhiyu-main);
      border-color: var(--anzhiyu-main);
      color: white;
    }
  }

  .history-note {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    font-size: 10px;
    color: var(--anzhiyu-secondtext);

    svg {
      flex-shrink: 0;
      opacity: 0.6;
    }
  }
}

// 高级选项
.advanced-section {
  margin-top: 4px;

  summary {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: var(--anzhiyu-secondbg);
    border-radius: 8px;
    cursor: pointer;
    font-size: 12px;
    color: var(--anzhiyu-secondtext);
    transition: all 0.15s;
    list-style: none;

    &::-webkit-details-marker {
      display: none;
    }

    svg {
      width: 14px;
      height: 14px;
      opacity: 0.6;
    }

    .chevron {
      margin-left: auto;
      transition: transform 0.2s;
    }

    &:hover {
      color: var(--anzhiyu-main);
      background: var(--anzhiyu-theme-op);
    }
  }

  &[open] summary .chevron {
    transform: rotate(180deg);
  }

  .advanced-content {
    padding: 12px;
    margin-top: 8px;
    background: var(--anzhiyu-secondbg);
    border-radius: 8px;
    animation: slideDown 0.2s ease-out;
  }

  .advanced-label {
    display: block;
    font-size: 11px;
    font-weight: 500;
    color: var(--anzhiyu-secondtext);
    margin-bottom: 6px;
  }

  .advanced-textarea {
    width: 100%;
    padding: 8px 10px;
    border: var(--style-border);
    border-radius: 6px;
    background: var(--anzhiyu-card-bg);
    color: var(--anzhiyu-fontcolor);
    font-size: 12px;
    line-height: 1.4;
    resize: none;
    transition: all 0.15s;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: var(--anzhiyu-main);
    }

    &::placeholder {
      color: var(--anzhiyu-secondtext);
    }
  }
}

.ai-writing-preview {
  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .preview-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor);
  }

  .regenerate-btn,
  .cancel-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 10px;
    background: var(--anzhiyu-secondbg);
    border: none;
    border-radius: 6px;
    color: var(--anzhiyu-fontcolor);
    cursor: pointer;
    transition: all 0.15s;
    font-size: 11px;

    svg {
      width: 12px;
      height: 12px;
    }

    &:hover {
      background: var(--anzhiyu-main);
      color: white;
    }
  }

  .cancel-btn {
    background: var(--anzhiyu-red-op);
    color: var(--anzhiyu-red);

    &:hover {
      background: var(--anzhiyu-red);
      color: white;
    }
  }

  .streaming-indicator {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--anzhiyu-main);
  }

  .streaming-dot {
    width: 8px;
    height: 8px;
    background: var(--anzhiyu-main);
    border-radius: 50%;
    animation: streamingPulse 1s ease-in-out infinite;
  }

  @keyframes streamingPulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(0.8);
    }
  }

  .preview-content {
    max-height: 320px;
    overflow-y: auto;
    padding: 12px;
    background: var(--anzhiyu-secondbg);
    border-radius: 8px;

    &.streaming {
      border: 1px solid var(--anzhiyu-main-op);
    }

    pre {
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: inherit;
      font-size: 12px;
      line-height: 1.7;
      color: var(--anzhiyu-fontcolor);
    }

    .cursor-blink {
      animation: cursorBlink 0.8s ease-in-out infinite;
      color: var(--anzhiyu-main);
      font-weight: bold;
    }

    @keyframes cursorBlink {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0;
      }
    }
  }

  .streaming-status {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-top: 8px;
    padding: 8px 12px;
    background: var(--anzhiyu-main-op);
    border-radius: 6px;
    font-size: 11px;

    .char-count {
      color: var(--anzhiyu-secondtext);
      font-weight: 500;
    }
  }
}

.generating-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--anzhiyu-maskbgdeep);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(6px);
  animation: fadeIn 0.2s ease-out;
}

.generating-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
  padding: 24px;

  .generating-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor);
  }

  .generating-status {
    font-size: 12px;
    color: var(--anzhiyu-main);
    font-weight: 500;
  }

  .generating-tip {
    font-size: 11px;
    color: var(--anzhiyu-secondtext);
    margin-top: 4px;
  }

  .generating-progress {
    width: 140px;
    height: 3px;
    background: var(--anzhiyu-theme-op);
    border-radius: 2px;
    overflow: hidden;

    .progress-bar {
      height: 100%;
      background: var(--anzhiyu-main);
      border-radius: 2px;
      animation: progressMove 2s ease-in-out infinite;
    }
  }
}

.generating-animation {
  display: flex;
  gap: 6px;

  .dot {
    width: 8px;
    height: 8px;
    background: var(--anzhiyu-main);
    border-radius: 50%;
    animation: bounce 1.4s ease-in-out infinite;

    &:nth-child(1) {
      animation-delay: 0s;
    }
    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes progressMove {
  0% {
    width: 0%;
    margin-left: 0%;
  }
  50% {
    width: 60%;
    margin-left: 20%;
  }
  100% {
    width: 0%;
    margin-left: 100%;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-top: var(--style-border);
  background: var(--anzhiyu-secondbg);
}

.btn-cancel,
.btn-generate,
.btn-insert {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.15s ease;

  svg {
    width: 14px;
    height: 14px;
  }

  &:focus-visible {
    outline: 2px solid var(--anzhiyu-theme);
    outline-offset: 1px;
  }
}

.btn-cancel {
  background: var(--anzhiyu-card-bg);
  color: var(--anzhiyu-secondtext);
  border: var(--style-border);

  &:hover {
    background: var(--anzhiyu-card-bg);
    border-color: var(--anzhiyu-theme);
    color: var(--anzhiyu-fontcolor);
  }
}

.btn-generate {
  background: var(--anzhiyu-main);
  color: white;

  &:hover:not(:disabled) {
    filter: brightness(1.08);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-loading-spinner {
    width: 12px;
    height: 12px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

.btn-insert {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;

  &:hover {
    filter: brightness(1.08);
  }
}

@media (max-width: 480px) {
  .dialog-footer {
    padding: 10px 14px;
    gap: 6px;
  }

  .btn-cancel,
  .btn-generate,
  .btn-insert {
    flex: 1;
    justify-content: center;
    padding: 8px 12px;
  }
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
