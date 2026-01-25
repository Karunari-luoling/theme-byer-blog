/**
 * @Description: 内容处理（sanitize、enrichHtml等）
 * @Author: 安知鱼
 * @Date: 2025-12-27
 */
import { computed, type ComputedRef } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { enrichHtmlMusicPlayers } from "./useMusicPlayer";

/**
 * 代码块折叠高度计算
 */
export const useCodeBlockHeight = (): {
  codeMaxLines: ComputedRef<number>;
  collapsedHeight: ComputedRef<string>;
} => {
  const siteConfigStore = useSiteConfigStore();

  const codeMaxLines = computed(
    () => siteConfigStore.getSiteConfig?.post?.code_block?.code_max_lines || 10
  );

  const collapsedHeight = computed(() => {
    const lines = codeMaxLines.value > 0 ? codeMaxLines.value : 10;
    // 每行高度约 26px (font-size 1rem * line-height 1.6)，加上 padding 20px
    const height = lines * 26 + 20;
    return `${height}px`;
  });

  return {
    codeMaxLines,
    collapsedHeight
  };
};

/**
 * 创建sanitize函数
 */
export const createSanitizer = (
  codeMaxLines: ComputedRef<number>,
  collapsedHeight: ComputedRef<string>,
  macStyle: ComputedRef<boolean>,
  _handleCodeCopy: (codeElement: HTMLElement) => void
) => {
  return (html: string): string => {
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

        // 内置代码块展开/收起逻辑
        const toggleHandler = `
          event.preventDefault();
          this.closest('details').open = !this.closest('details').open;
        `
          .replace(/\s+/g, " ")
          .trim();

        // 构建 Mac 圆点 HTML（如果启用）
        const macDotsHtml = macStyle.value
          ? `<div class="mac-dots">
              <span class="mac-dot red"></span>
              <span class="mac-dot yellow"></span>
              <span class="mac-dot green"></span>
            </div>`
          : "";

        // 根据是否启用 Mac 样式添加 class
        const headClass = macStyle.value ? "has-mac-dots" : "";
        if (headClass) {
          summaryElement.classList.add(headClass);
        }

        summaryElement.innerHTML = `
          <i class="anzhiyufont anzhiyu-icon-angle-down expand" onclick="${toggleHandler}"></i>
          ${macDotsHtml}
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
            (preElement as HTMLElement).style.height = collapsedHeight.value;
            (preElement as HTMLElement).style.overflow = "hidden";

            if (!detailsElement.querySelector(".code-expand-btn")) {
              const expandBtn = document.createElement("div");
              expandBtn.className = "code-expand-btn";

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

              expandBtn.setAttribute("onclick", expandHandler);
              expandBtn.innerHTML = `<i class="anzhiyufont anzhiyu-icon-angle-double-down" style="transition: transform 0.3s ease;"></i>`;
              detailsElement.appendChild(expandBtn);
            }
          }
        }
      }
    });

    // 处理表格
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
};

/**
 * 内容处理器hook
 */
export const useContentProcessor = (
  showSnackbar: (message: string) => void
) => {
  const { codeMaxLines, collapsedHeight } = useCodeBlockHeight();
  const siteConfigStore = useSiteConfigStore();

  const macStyle = computed(
    () => siteConfigStore.getSiteConfig?.post?.code_block?.mac_style || false
  );

  // 代码复制处理
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

  // 创建sanitize函数
  const sanitize = createSanitizer(
    codeMaxLines,
    collapsedHeight,
    macStyle,
    handleCodeCopy
  );

  /**
   * 处理保存时的HTML
   */
  const processHtmlForSave = async (
    markdown: string,
    htmlPromise: Promise<string>
  ): Promise<{ markdown: string; html: string }> => {
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

    console.log("[保存文章] 处理完成");

    return {
      markdown,
      html: sanitizedHtml
    };
  };

  return {
    sanitize,
    handleCodeCopy,
    processHtmlForSave,
    codeMaxLines,
    collapsedHeight
  };
};
