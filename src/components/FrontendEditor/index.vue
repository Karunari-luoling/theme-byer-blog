<script setup lang="ts">
import { ref, watch, onBeforeUnmount, nextTick } from "vue";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Highlight } from "@tiptap/extension-highlight";
import TurndownService from "turndown";
import { ElMessage } from "element-plus";
import AnDialog from "@/components/AnDialog";
import { useLazyLoading } from "@/composables/useLazyLoading";

// 自定义 extensions
import { Subscript } from "./extensions/Subscript";
import { Superscript } from "./extensions/Superscript";
import { InlineDelete } from "./extensions/InlineDelete";
import { PreserveHTML } from "./extensions/PreserveHTML";
import { CustomImage } from "./extensions/CustomImage";
import { PaidContent } from "./extensions/PaidContent";
import { PasswordContent } from "./extensions/PasswordContent";
import { LoginRequiredContent } from "./extensions/LoginRequiredContent";
import { InteractiveCodeBlock } from "./extensions/InteractiveCodeBlock";

defineOptions({
  name: "FrontendEditor"
});

interface Props {
  modelValue: string;
  placeholder?: string;
  readonly?: boolean;
  onUploadImage?: (file: File) => Promise<string>; // 图片上传回调函数
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: "开始编辑文章内容...",
  readonly: false
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  "update:markdown": [value: string];
}>();

// Turndown 配置 - 用于将 HTML 转换为 Markdown
const turndownService = new TurndownService({
  headingStyle: "atx",
  hr: "---",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*"
});

// ========== 自定义转换规则 ==========

// 规则1: 保留付费内容容器
turndownService.addRule("paidContent", {
  filter: function (node) {
    return (
      node.nodeName === "DIV" &&
      node.classList.contains("paid-content-editor-preview")
    );
  },
  replacement: function (content, node) {
    const element = node as HTMLElement;
    const title = element.getAttribute("data-title") || "付费内容";
    const price = element.getAttribute("data-price") || "0";
    const originalPrice = element.getAttribute("data-original-price") || "";
    const currency = element.getAttribute("data-currency") || "¥";

    // 提取实际的内容（从 paid-content-preview 中提取，避免包含 meta 信息）
    const previewElement = element.querySelector(".paid-content-preview");
    let actualContent = "";

    if (previewElement) {
      // 🔧 关键修复：移除占位符，只保留实际内容
      const clonedElement = previewElement.cloneNode(true) as HTMLElement;
      const placeholder = clonedElement.querySelector(
        ".paid-content-placeholder"
      );
      if (placeholder) {
        placeholder.remove();
      }

      // 🎯 保持 HTML 格式（与后台编辑器一致）
      actualContent = clonedElement.innerHTML.trim();
    }

    // 如果没有内容，使用默认提示
    if (!actualContent || actualContent.trim() === "") {
      actualContent = "<p>这里是要付费才能查看的内容。</p>";
    }

    // 构建 markdown 语法
    let attrs = `title="${title}" price="${price}"`;
    if (originalPrice) {
      attrs += ` original-price="${originalPrice}"`;
    }
    if (currency !== "¥") {
      attrs += ` currency="${currency}"`;
    }

    return `\n:::paid-content ${attrs}\n${actualContent}\n:::\n\n`;
  }
});

// 规则2: 保留密码保护内容容器
turndownService.addRule("passwordContent", {
  filter: function (node) {
    return (
      node.nodeName === "DIV" &&
      node.classList.contains("password-content-editor-preview")
    );
  },
  replacement: function (content, node) {
    const element = node as HTMLElement;
    const passwordId = element.getAttribute("data-content-id") || "";
    const title = element.getAttribute("data-title") || "密码保护内容";
    const hint = element.getAttribute("data-hint") || "请输入密码";
    const placeholder =
      element.getAttribute("data-placeholder") || "请输入密码";
    const password = element.getAttribute("data-password") || "";

    // 提取实际的内容（从 password-content-preview 中提取，避免包含 meta 信息）
    const previewElement = element.querySelector(".password-content-preview");
    let actualContent = "";

    if (previewElement) {
      // 🔧 关键修复：移除占位符，只保留实际内容
      const clonedElement = previewElement.cloneNode(true) as HTMLElement;
      const placeholderElement = clonedElement.querySelector(
        ".password-content-placeholder"
      );
      if (placeholderElement) {
        placeholderElement.remove();
      }

      // 🎯 转换为纯文本（与后台编辑器一致）
      // 从所有段落中提取文本内容
      const paragraphs = clonedElement.querySelectorAll("p");
      if (paragraphs.length > 0) {
        const textParts: string[] = [];
        paragraphs.forEach(p => {
          const text = p.textContent?.trim();
          if (text) textParts.push(text);
        });
        actualContent = textParts.join("\n");
      } else {
        // 如果没有段落，直接获取文本内容
        actualContent = clonedElement.textContent?.trim() || "";
      }
    }

    // 如果没有内容，使用默认提示
    if (!actualContent || actualContent.trim() === "") {
      actualContent = "这里是密码保护的内容。";
    }

    // 构建 markdown 语法
    return `\n:::password-content password="${password}" id="${passwordId}" title="${title}" hint="${hint}" placeholder="${placeholder}"\n${actualContent}\n:::\n\n`;
  }
});

// 规则3: 保留登录后可查看内容容器
turndownService.addRule("loginRequiredContent", {
  filter: function (node) {
    return (
      node.nodeName === "DIV" &&
      node.classList.contains("login-required-content-editor-preview")
    );
  },
  replacement: function (content, node) {
    const element = node as HTMLElement;
    const contentId = element.getAttribute("data-content-id") || "";
    const title = element.getAttribute("data-title") || "登录后可查看";
    const hint =
      element.getAttribute("data-hint") || "此内容需要登录后才能查看";

    // 提取实际的内容（从 login-required-content-preview 中提取，避免包含 meta 信息）
    const previewElement = element.querySelector(
      ".login-required-content-preview"
    );
    let actualContent = "";

    if (previewElement) {
      // 🔧 关键修复：移除占位符，只保留实际内容
      const clonedElement = previewElement.cloneNode(true) as HTMLElement;
      const placeholderElement = clonedElement.querySelector(
        ".login-required-content-placeholder"
      );
      if (placeholderElement) {
        placeholderElement.remove();
      }

      // 🎯 保持 HTML 格式（登录后可查看的内容保存为 HTML）
      actualContent = clonedElement.innerHTML.trim();
    }

    // 如果没有内容，使用默认提示
    if (!actualContent || actualContent.trim() === "") {
      actualContent = "<p>这里是登录后可查看的内容。</p>";
    }

    // 构建 markdown 语法
    return `\n:::login-required id="${contentId}" title="${title}" hint="${hint}"\n${actualContent}\n:::\n\n`;
  }
});

// 规则4: 代码块转换为 Markdown（处理占位符）
turndownService.addRule("codeBlockPlaceholder", {
  filter: function (node) {
    return (
      node.nodeName === "DIV" &&
      node.classList.contains("interactive-code-block-placeholder")
    );
  },
  replacement: function (content, node) {
    const element = node as HTMLElement;

    // 🔧 优先从 Base64 编码的 data-encoded-code 属性读取代码
    const encodedCode = element.getAttribute("data-encoded-code");
    const language = element.getAttribute("data-language") || "";
    let code = "";

    if (encodedCode) {
      try {
        // 从 Base64 解码
        code = decodeURIComponent(atob(encodedCode));
        console.log("✅ [Turndown 占位符] 从 Base64 解码代码成功");
        console.log("📝 [Turndown 占位符] 语言:", language);
        console.log("📝 [Turndown 占位符] 代码行数:", code.split("\n").length);
        console.log("📝 [Turndown 占位符] 代码:", code);
      } catch (error) {
        console.warn("⚠️ [Turndown 占位符] Base64 解码失败:", error);
      }
    }

    // 构建 Markdown 代码块
    return `\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
  }
});

// 规则5: 代码块转换为 Markdown（处理真实的代码块，作为降级方案）
turndownService.addRule("codeBlock", {
  filter: function (node) {
    return (
      node.nodeName === "DETAILS" && node.classList.contains("md-editor-code")
    );
  },
  replacement: function (content, node) {
    const element = node as HTMLElement;

    // 提取语言
    const langElement = element.querySelector(".code-lang");
    const language = langElement?.textContent?.trim() || "";

    // 提取代码内容
    const codeBlock = element.querySelector(".md-editor-code-block");
    let code = "";

    if (codeBlock) {
      // 🔧 关键修复：先将 <br> 转换为换行符，再处理其他标签
      let html = codeBlock.innerHTML;

      console.log(
        "🔍 [Turndown 真实代码块] 原始 HTML 前300字符:",
        html.substring(0, 300)
      );
      console.log(
        "🔍 [Turndown 真实代码块] <br> 数量:",
        (html.match(/<br>/gi) || []).length
      );

      // 第一步：将 <br> 标签转换为特殊占位符（避免被后续处理影响）
      const BR_PLACEHOLDER = "___NEWLINE___";
      html = html.replace(/<br\s*\/?>/gi, BR_PLACEHOLDER);

      // 第二步：移除所有 HTML 标签
      code = html.replace(/<[^>]+>/g, "");

      // 第三步：恢复换行符
      code = code.replace(new RegExp(BR_PLACEHOLDER, "g"), "\n");

      // 第四步：解码 HTML 实体
      code = code
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
    }

    console.log("📝 [Turndown 真实代码块] 语言:", language);
    console.log("📝 [Turndown 真实代码块] 代码:", code);
    console.log("📊 [Turndown 真实代码块] 代码行数:", code.split("\n").length);

    // 构建 Markdown 代码块
    return `\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
  }
});

// 规则6: 增强图片转换，保留特殊属性
turndownService.addRule("customImage", {
  filter: function (node) {
    return (
      node.nodeName === "IMG" ||
      (node.nodeName === "FIGURE" && node.classList.contains("image-figure"))
    );
  },
  replacement: function (content, node) {
    const element = node as HTMLElement;

    // 处理 figure 元素（带描述的图片）
    if (element.nodeName === "FIGURE") {
      const img = element.querySelector("img");
      const figcaption = element.querySelector("figcaption");

      if (!img) return "";

      // 优先使用 data-src（真实 URL），如果没有才使用 src（避免懒加载占位符）
      const src = img.getAttribute("data-src") || img.getAttribute("src") || "";
      const alt = img.getAttribute("alt") || "";
      const title = img.getAttribute("title") || "";
      const caption = figcaption ? figcaption.textContent?.trim() : "";
      const width = img.getAttribute("width") || "";
      const height = img.getAttribute("height") || "";

      // 获取对齐方式
      let align = "center";
      if (element.classList.contains("image-align-left")) {
        align = "left";
      } else if (element.classList.contains("image-align-right")) {
        align = "right";
      }

      // 构建带属性的 markdown 图片语法
      let markdown = `![${alt}](${src}`;

      // 如果只有 caption 且没有其他属性，使用标准 Markdown 语法
      const hasCustomAttrs = width || height || align !== "center";

      if (caption && !hasCustomAttrs) {
        // 标准 Markdown 语法：![](url "描述")
        markdown += ` "${caption}"`;
        markdown += ")";
      } else {
        // 有其他自定义属性，使用花括号语法
        markdown += ")";

        if (caption || width || height || align !== "center") {
          const attrs = [];
          if (caption) attrs.push(`caption="${caption}"`);
          if (width) attrs.push(`width=${width}`);
          if (height) attrs.push(`height=${height}`);
          if (align !== "center") attrs.push(`align=${align}`);

          if (attrs.length > 0) {
            markdown += `{${attrs.join(" ")}}`;
          }
        }
      }

      return markdown;
    }

    // 处理普通 img 元素
    const img = element as HTMLImageElement;
    // 优先使用 data-src（真实 URL），如果没有才使用 src（避免懒加载占位符）
    const src = img.getAttribute("data-src") || img.getAttribute("src") || "";
    const alt = img.getAttribute("alt") || "";
    const title = img.getAttribute("title") || "";
    const width = img.getAttribute("width") || "";
    const height = img.getAttribute("height") || "";

    // 获取对齐方式
    let align = "center";
    if (img.classList.contains("image-align-left")) {
      align = "left";
    } else if (img.classList.contains("image-align-right")) {
      align = "right";
    }

    // 构建 markdown
    let markdown = `![${alt}](${src}`;

    // 如果只有 title 且没有其他属性，使用标准 Markdown 语法
    const hasCustomAttrs = width || height || align !== "center";

    if (title && !hasCustomAttrs) {
      // 标准 Markdown 语法：![](url "描述")
      markdown += ` "${title}"`;
      markdown += ")";
    } else {
      // 有其他自定义属性，使用花括号语法
      markdown += ")";

      if (title || width || height || align !== "center") {
        const attrs = [];
        if (title) attrs.push(`caption="${title}"`);
        if (width) attrs.push(`width=${width}`);
        if (height) attrs.push(`height=${height}`);
        if (align !== "center") attrs.push(`align=${align}`);

        if (attrs.length > 0) {
          markdown += `{${attrs.join(" ")}}`;
        }
      }
    }

    return markdown;
  }
});

// 规则4: 保留高亮文本的标记
turndownService.addRule("highlight", {
  filter: function (node) {
    return node.nodeName === "MARK";
  },
  replacement: function (content) {
    return `==${content}==`;
  }
});

// 规则5: 保留下标
turndownService.addRule("subscript", {
  filter: ["sub"],
  replacement: function (content) {
    return `~${content}~`;
  }
});

// 规则6: 保留上标
turndownService.addRule("superscript", {
  filter: ["sup"],
  replacement: function (content) {
    return `^${content}^`;
  }
});

// ========== 后台编辑器插件语法支持 ==========

// 规则7: Tabs 插件 - 标签页
turndownService.addRule("tabs", {
  filter: function (node) {
    return node.nodeName === "DIV" && node.classList.contains("tabs");
  },
  replacement: function (content, node) {
    const element = node as HTMLElement;
    // 提取 tab 按钮和内容
    const navTabs = element.querySelector(".nav-tabs");
    const tabContents = element.querySelector(".tab-contents");

    if (!navTabs || !tabContents) return content;

    const tabs = navTabs.querySelectorAll(".tab");
    const tabItems = tabContents.querySelectorAll(".tab-item-content");

    if (tabs.length === 0) return content;

    // 找到激活的 tab 索引
    let activeIndex = 0;
    tabs.forEach((tab, index) => {
      if (tab.classList.contains("active")) {
        activeIndex = index;
      }
    });

    // 构建 markdown
    let markdown = `\n:::tabs active=${activeIndex + 1}\n`;

    tabs.forEach((tab, index) => {
      const caption = tab.textContent?.trim() || `Tab ${index + 1}`;
      const tabItem = tabItems[index];
      const tabContent = tabItem ? tabItem.innerHTML.trim() : "";

      markdown += `== tab ${caption}\n${tabContent}\n\n`;
    });

    markdown += ":::\n\n";
    return markdown;
  }
});

// 规则8: Folding 插件 - 折叠框
turndownService.addRule("folding", {
  filter: function (node) {
    return (
      node.nodeName === "DETAILS" && node.classList.contains("folding-tag")
    );
  },
  replacement: function (content, node) {
    const element = node as HTMLElement;
    const summary = element.querySelector("summary");
    const contentDiv = element.querySelector(".content");

    if (!summary) return content;

    const title = summary.textContent?.trim() || "折叠框";
    const isOpen = element.hasAttribute("open");
    const hasCustomColor = element.classList.contains("custom-color");

    let params = "folding";
    if (isOpen) params += " open";

    // 提取自定义颜色
    if (hasCustomColor) {
      const borderColor = element.style.borderColor;
      if (borderColor) params += ` ${borderColor}`;
    }

    const innerContent = contentDiv ? contentDiv.innerHTML.trim() : "";

    return `\n:::${params}\n${title}\n${innerContent}\n:::\n\n`;
  }
});

// 规则9: Hidden 插件 - 隐藏内容（块级）
turndownService.addRule("hiddenBlock", {
  filter: function (node) {
    return node.nodeName === "DIV" && node.classList.contains("hide-block");
  },
  replacement: function (content, node) {
    const element = node as HTMLElement;
    const button = element.querySelector(".hide-button") as HTMLElement;
    const hideContent = element.querySelector(".hide-content") as HTMLElement;

    if (!button || !hideContent) return content;

    const displayText = button.textContent?.trim() || "查看隐藏内容";
    const bgColor = button.style.backgroundColor || "";
    const textColor = button.style.color || "";
    const innerContent = hideContent.innerHTML.trim();

    let params = "hidden";
    if (displayText !== "查看隐藏内容") params += ` display=${displayText}`;
    if (bgColor) params += ` bg=${bgColor}`;
    if (textColor) params += ` color=${textColor}`;

    return `\n:::${params}\n${innerContent}\n:::\n\n`;
  }
});

// 规则10: Hidden 插件 - 隐藏内容（行内）
turndownService.addRule("hiddenInline", {
  filter: function (node) {
    return node.nodeName === "SPAN" && node.classList.contains("hide-inline");
  },
  replacement: function (content, node) {
    const element = node as HTMLElement;
    const button = element.querySelector(".hide-button") as HTMLElement;
    const hideContent = element.querySelector(".hide-content") as HTMLElement;

    if (!button || !hideContent) return content;

    const displayText = button.textContent?.trim() || "查看";
    const bgColor = button.style.backgroundColor || "";
    const textColor = button.style.color || "";
    const innerContent = hideContent.textContent?.trim() || "";

    let params = "";
    if (displayText !== "查看") params += ` display=${displayText}`;
    if (bgColor) params += ` bg=${bgColor}`;
    if (textColor) params += ` color=${textColor}`;

    return `{hide${params}}${innerContent}{/hide}`;
  }
});

// 规则11: Btns 插件 - 按钮组
turndownService.addRule("btns", {
  filter: function (node) {
    return node.nodeName === "DIV" && node.classList.contains("btns-container");
  },
  replacement: function (content, node) {
    const element = node as HTMLElement;

    // 提取参数
    let cols = 3;
    let style = "default";

    element.classList.forEach(cls => {
      if (cls.startsWith("btns-cols-")) {
        cols = parseInt(cls.replace("btns-cols-", "")) || 3;
      }
      if (cls.startsWith("btns-style-")) {
        style = cls.replace("btns-style-", "");
      }
    });

    const btnItems = element.querySelectorAll(".btn-item");
    if (btnItems.length === 0) return content;

    let markdown = `\n:::btns cols=${cols}`;
    if (style !== "default") markdown += ` style=${style}`;
    markdown += "\n";

    btnItems.forEach(btn => {
      const url = btn.getAttribute("href") || "#";
      // 支持三种图标类型：img、iconify span、iconfont i
      const iconEl = btn.querySelector(
        ".btn-icon img, .btn-icon .iconify, .btn-icon i"
      );
      // 支持新的 .btn-content 结构
      const titleEl = btn.querySelector(".btn-content .btn-title, .btn-title");
      const descEl = btn.querySelector(".btn-content .btn-desc, .btn-desc");

      let icon = "anzhiyu-icon-circle-arrow-right";
      if (iconEl) {
        if (iconEl.tagName === "IMG") {
          // 图片 URL
          icon = iconEl.getAttribute("src") || icon;
        } else if (iconEl.classList.contains("iconify")) {
          // Iconify 图标
          icon = iconEl.getAttribute("data-icon") || icon;
        } else {
          // iconfont 图标
          const classes = iconEl.className.split(" ");
          const iconClass = classes.find(c => c.startsWith("anzhiyu-icon-"));
          if (iconClass) icon = iconClass;
        }
      }

      const title = titleEl?.textContent?.trim() || "按钮";
      const desc = descEl?.textContent?.trim() || "";

      let itemLine = `- icon=${icon} title=${title} url=${url}`;
      if (desc) {
        itemLine += ` desc=${desc}`;
      }
      markdown += itemLine + "\n";
    });

    markdown += ":::\n\n";
    return markdown;
  }
});

// 规则12: Gallery 插件 - 图片画廊
turndownService.addRule("gallery", {
  filter: function (node) {
    return (
      node.nodeName === "DIV" && node.classList.contains("gallery-container")
    );
  },
  replacement: function (content, node) {
    const element = node as HTMLElement;

    // 提取参数
    let cols = 3;
    element.classList.forEach(cls => {
      if (cls.startsWith("gallery-cols-")) {
        cols = parseInt(cls.replace("gallery-cols-", "")) || 3;
      }
    });

    const gap = element.style.getPropertyValue("--gallery-gap") || "10px";
    const ratioValue = element.style.getPropertyValue("--gallery-ratio");

    let markdown = `\n:::gallery cols=${cols} gap=${gap}`;
    if (ratioValue) {
      // 从 padding-bottom 百分比反推宽高比
      const percentage = parseFloat(ratioValue);
      if (percentage === 56.25) markdown += " ratio=16:9";
      else if (percentage === 100) markdown += " ratio=1:1";
      else if (percentage === 75) markdown += " ratio=4:3";
    }
    markdown += "\n";

    const items = element.querySelectorAll(".gallery-item");
    items.forEach(item => {
      const img = item.querySelector("img");
      if (img) {
        const url = img.getAttribute("src") || "";
        const alt = img.getAttribute("alt") || "";
        const title = img.getAttribute("title") || "";

        markdown += `![${alt}](${url}${title ? ` "${title}"` : ""})\n`;
      }
    });

    markdown += ":::\n\n";
    return markdown;
  }
});

// 规则13: Video Gallery 插件 - 视频画廊
turndownService.addRule("videoGallery", {
  filter: function (node) {
    return (
      node.nodeName === "DIV" &&
      node.classList.contains("video-gallery-container")
    );
  },
  replacement: function (content, node) {
    const element = node as HTMLElement;

    // 提取参数
    let cols = 2;
    element.classList.forEach(cls => {
      if (cls.startsWith("video-gallery-cols-")) {
        cols = parseInt(cls.replace("video-gallery-cols-", "")) || 2;
      }
    });

    const gap = element.style.getPropertyValue("--video-gallery-gap") || "16px";
    const ratioValue = element.style.getPropertyValue("--video-gallery-ratio");

    let markdown = `\n:::video-gallery cols=${cols} gap=${gap}`;
    if (ratioValue) {
      const percentage = parseFloat(ratioValue);
      if (percentage === 56.25) markdown += " ratio=16:9";
      else if (percentage === 75) markdown += " ratio=4:3";
    }
    markdown += "\n";

    const items = element.querySelectorAll(".video-gallery-item");
    items.forEach(item => {
      const video = item.querySelector("video");
      if (video) {
        const url = video.getAttribute("src") || "";
        const poster = video.getAttribute("poster") || "";
        const titleEl = item.querySelector(".video-gallery-title");
        const title = titleEl?.textContent?.trim() || "";

        markdown += `url=${url}`;
        if (poster) markdown += ` poster=${poster}`;
        if (title) markdown += ` title=${title}`;
        markdown += "\n";
      }
    });

    markdown += ":::\n\n";
    return markdown;
  }
});

// 规则14: Button 插件 - 单个按钮
turndownService.addRule("button", {
  filter: function (node) {
    return node.nodeName === "A" && node.classList.contains("btn-anzhiyu");
  },
  replacement: function (content, node) {
    const element = node as HTMLElement;
    const url = element.getAttribute("href") || "#";
    const text = element.querySelector("span")?.textContent?.trim() || "按钮";
    const iconEl = element.querySelector("i");

    let icon = "anzhiyu-icon-circle-arrow-right";
    if (iconEl) {
      const classes = iconEl.className.split(" ");
      const iconClass = classes.find(c => c.startsWith("anzhiyu-icon-"));
      if (iconClass) icon = iconClass;
    }

    // 提取样式参数
    let params = `url=${url} text=${text} icon=${icon}`;

    if (element.classList.contains("btn-outline")) params += " style=outline";
    if (element.classList.contains("btn-larger")) params += " size=larger";

    // 提取颜色
    const colorClasses = ["blue", "pink", "red", "purple", "orange", "green"];
    colorClasses.forEach(color => {
      if (element.classList.contains(`btn-${color}`)) {
        params += ` color=${color}`;
      }
    });

    return `{btn ${params}}{/btn}`;
  }
});

// 规则15: LinkCard 插件 - 链接卡片
turndownService.addRule("linkcard", {
  filter: function (node) {
    return (
      node.nodeName === "DIV" && node.classList.contains("anzhiyu-tag-link")
    );
  },
  replacement: function (content, node) {
    const element = node as HTMLElement;
    const link = element.querySelector("a.tag-Link");

    if (!link) return content;

    const url = link.getAttribute("href") || "#";
    const tipsEl = link.querySelector(".tag-link-tips");
    const titleEl = link.querySelector(".tag-link-title");
    const sitenameEl = link.querySelector(".tag-link-sitename");
    const iconEl = link.querySelector(".tag-link-left i, .tag-link-left img");

    const tips = tipsEl?.textContent?.trim() || "引用站外地址";
    const title = titleEl?.textContent?.trim() || "链接标题";
    const sitename = sitenameEl?.textContent?.trim() || "网站名称";

    let icon = "anzhiyu-icon-link";
    if (iconEl) {
      if (iconEl.tagName === "IMG") {
        icon = iconEl.getAttribute("src") || icon;
      } else {
        const classes = iconEl.className.split(" ");
        const iconClass = classes.find(c => c.startsWith("anzhiyu-icon-"));
        if (iconClass) icon = iconClass;
      }
    }

    return `{linkcard url=${url} title="${title}" sitename="${sitename}" icon=${icon} tips="${tips}"}{/linkcard}`;
  }
});

// 规则16: Tip 插件 - 提示
turndownService.addRule("tip", {
  filter: function (node) {
    return (
      node.nodeName === "SPAN" && node.classList.contains("anzhiyu-tip-wrapper")
    );
  },
  replacement: function (content, node) {
    const element = node as HTMLElement;
    const textEl = element.querySelector(".anzhiyu-tip-text");
    const tipEl = element.querySelector(".anzhiyu-tip");

    if (!textEl || !tipEl) return content;

    const text = textEl.textContent?.trim() || "提示文本";
    const tipContent = tipEl.getAttribute("data-content") || "这里是提示内容";
    const position = tipEl.getAttribute("data-position") || "top";
    const theme = tipEl.getAttribute("data-theme") || "dark";
    const trigger = tipEl.getAttribute("data-trigger") || "hover";

    let params = `text="${text}" content="${tipContent}"`;
    if (position !== "top") params += ` position=${position}`;
    if (theme !== "dark") params += ` theme=${theme}`;
    if (trigger !== "hover") params += ` trigger=${trigger}`;

    return `{tip ${params}}{/tip}`;
  }
});

// 规则17: Inline Styles 插件 - 行内样式
// 下划线
turndownService.addRule("inlineUnderline", {
  filter: function (node) {
    return (
      node.nodeName === "SPAN" && node.classList.contains("inline-underline")
    );
  },
  replacement: function (content, node) {
    const element = node as HTMLElement;
    const color = element.style.textDecorationColor || "";
    const params = color ? ` color=${color}` : "";
    return `{u${params}}${content}{/u}`;
  }
});

// 着重号
turndownService.addRule("inlineEmphasis", {
  filter: function (node) {
    return (
      node.nodeName === "SPAN" &&
      node.classList.contains("inline-emphasis-mark")
    );
  },
  replacement: function (content, node) {
    const element = node as HTMLElement;
    const color = element.style.textEmphasisColor || "";
    const params = color ? ` color=${color}` : "";
    return `{emp${params}}${content}{/emp}`;
  }
});

// 波浪线
turndownService.addRule("inlineWavy", {
  filter: function (node) {
    return node.nodeName === "SPAN" && node.classList.contains("inline-wavy");
  },
  replacement: function (content, node) {
    const element = node as HTMLElement;
    const color = element.style.textDecorationColor || "";
    const params = color ? ` color=${color}` : "";
    return `{wavy${params}}${content}{/wavy}`;
  }
});

// 删除线
turndownService.addRule("inlineDelete", {
  filter: function (node) {
    return node.nodeName === "SPAN" && node.classList.contains("inline-delete");
  },
  replacement: function (content, node) {
    const element = node as HTMLElement;
    const color = element.style.textDecorationColor || "";
    const params = color ? ` color=${color}` : "";
    return `{del${params}}${content}{/del}`;
  }
});

// 键盘样式
turndownService.addRule("inlineKbd", {
  filter: function (node) {
    return node.nodeName === "SPAN" && node.classList.contains("inline-kbd");
  },
  replacement: function (content) {
    return `{kbd}${content}{/kbd}`;
  }
});

// 密码样式
turndownService.addRule("inlinePassword", {
  filter: function (node) {
    return (
      node.nodeName === "SPAN" && node.classList.contains("inline-password")
    );
  },
  replacement: function (content) {
    return `{psw}${content}{/psw}`;
  }
});

// ========== 后台编辑器插件语法支持结束 ==========

// 初始化懒加载
const {
  initLazyLoading,
  reinitialize: reinitializeLazyLoad,
  cleanup: cleanupLazyLoad,
  processImage
} = useLazyLoading({
  rootMargin: "100px",
  threshold: 0.1
});

// 立即加载视口内的图片
const loadVisibleImages = (container: HTMLElement) => {
  const images = container.querySelectorAll<HTMLImageElement>("img[data-src]");
  images.forEach(img => {
    const rect = img.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

    if (isVisible) {
      const dataSrc = img.getAttribute("data-src");
      if (dataSrc && img.src !== dataSrc) {
        console.log("🖼️ 立即加载视口内的图片:", dataSrc.slice(-30));
        img.src = dataSrc;
        img.classList.add("lazy-loaded");
      }
    }
  });
};

// 创建编辑器实例
const editor = useEditor({
  content: props.modelValue,
  editable: !props.readonly,
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6]
      },
      codeBlock: false // 禁用默认的 CodeBlock，使用我们的 InteractiveCodeBlock
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: "link"
      }
    }),
    CustomImage.configure({
      HTMLAttributes: {
        class: "article-image editable-image"
      }
    }),
    Placeholder.configure({
      placeholder: props.placeholder
    }),
    TextStyle,
    Color,
    Underline,
    TextAlign.configure({
      types: ["heading", "paragraph"]
    }),
    Highlight.configure({
      multicolor: true
    }),
    // 自定义 extensions
    Subscript,
    Superscript,
    InlineDelete,
    PreserveHTML,
    InteractiveCodeBlock, // 交互式代码块（保留展开/收起、复制等功能）
    PaidContent,
    PasswordContent,
    LoginRequiredContent
  ],
  editorProps: {
    attributes: {
      class: "frontend-editor-content"
    },
    handlePaste: (view, event) => {
      // 处理粘贴事件，支持粘贴图片
      const items = event.clipboardData?.items;
      if (!items) return false;

      // 查找图片类型的项
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
          event.preventDefault();
          const file = item.getAsFile();
          if (file) {
            handlePasteImage(file);
          }
          return true;
        }
      }

      return false;
    }
  },
  onCreate: () => {
    // 编辑器创建完成后设置图片点击监听
    setupImageClickListener();

    // 设置密码保护内容设置按钮的点击监听
    setupPasswordContentListener();

    // 设置付费内容设置按钮的点击监听
    setupPaidContentListener();

    // 设置登录后可查看内容设置按钮的点击监听
    setupLoginRequiredContentListener();

    // 初始化懒加载
    nextTick(() => {
      const editorEl = document.querySelector(".frontend-editor-content");
      if (editorEl) {
        initLazyLoading(editorEl as HTMLElement);
        // 立即加载视口内的图片
        loadVisibleImages(editorEl as HTMLElement);
        console.log("🖼️ [FrontendEditor] 懒加载已初始化");
      }
    });
  },
  onUpdate: ({ editor }) => {
    try {
      console.log("📝 onUpdate 开始");

      // 🔍 调试：检查编辑器中图片节点的属性
      console.log("🔍 [onUpdate] 检查编辑器中的图片节点属性:");
      editor.state.doc.descendants((node: any) => {
        if (node.type.name === "customImage") {
          console.log("  图片节点属性:", {
            src: node.attrs.src?.slice(-30),
            width: node.attrs.width,
            height: node.attrs.height,
            align: node.attrs.align
          });
        }
      });

      // 更新付费内容和密码保护内容的字数统计
      updateContentLengths(editor);

      // 🔧 获取清理后的 HTML 和 Markdown
      // 注意：Markdown 转换使用未替换占位符的原始 HTML（保留 Base64 编码的代码）
      const rawHTML = editor.getHTML();
      const cleanedHTML = getCleanedHTML();

      console.log("📝 [onUpdate] 原始 HTML 长度:", rawHTML.length);
      console.log(
        "📝 [onUpdate] 原始 HTML 是否包含占位符:",
        rawHTML.includes("interactive-code-block-placeholder")
      );
      if (rawHTML.includes("interactive-code-block-placeholder")) {
        const match = rawHTML.match(
          /<div[^>]*class="interactive-code-block-placeholder"[^>]*>/
        );
        if (match) {
          console.log("📝 [onUpdate] 占位符标签:", match[0]);
        }
      }

      const markdown = convertHtmlToMarkdown(rawHTML);

      console.log("✅ getHTML 成功");

      // 设置标记，表示正在从编辑器发送更新
      isUpdatingFromEditor = true;

      // 发出清理后的内容
      emit("update:modelValue", cleanedHTML);
      emit("update:markdown", markdown);

      // 在下一个 tick 清除标记，确保父组件的 watch 已经执行完毕
      nextTick(() => {
        isUpdatingFromEditor = false;
      });

      // 如果有选中的图片，更新工具栏按钮状态
      if (selectedImage.value) {
        nextTick(() => {
          updateToolbarButtonState();
        });
      }

      // 重新初始化懒加载（处理新添加的图片）
      nextTick(() => {
        const editorEl = document.querySelector(".frontend-editor-content");
        if (editorEl) {
          reinitializeLazyLoad(editorEl as HTMLElement);
          // 立即加载视口内的图片（如调整尺寸后、新插入的图片等）
          loadVisibleImages(editorEl as HTMLElement);
        }
      });
    } catch (error) {
      console.error("❌ onUpdate 错误:", error);
      console.log("📊 当前编辑器状态:", editor.state);
      console.log("📄 文档结构:", editor.state.doc.toJSON());

      // 🔧 使用备用方案：清除缓存并重试一次
      console.log("🔄 清除缓存并重试获取 HTML...");
      lastCleanedHTML = "";
      lastEditorStateHash = "";

      try {
        const rawHTML = editor.getHTML();
        const cleanedHTML = getCleanedHTML();

        console.log("📝 [备用方案] 原始 HTML 长度:", rawHTML.length);
        console.log(
          "📝 [备用方案] 原始 HTML 是否包含占位符:",
          rawHTML.includes("interactive-code-block-placeholder")
        );

        const markdown = convertHtmlToMarkdown(rawHTML);

        console.log("✅ 备用方案成功获取 HTML");

        // 设置标记
        isUpdatingFromEditor = true;

        // 发出清理后的内容
        emit("update:modelValue", cleanedHTML);
        emit("update:markdown", markdown);

        // 在下一个 tick 清除标记
        nextTick(() => {
          isUpdatingFromEditor = false;
        });
      } catch (fallbackError) {
        console.error("❌ 备用方案也失败:", fallbackError);
        // 清除标记
        isUpdatingFromEditor = false;
      }
    }
  }
});

// 计算文本字数（中文按字符，英文按单词，数字按字符）
const calculateWordCount = (text: string): number => {
  if (!text) {
    console.log("📊 [calculateWordCount] 文本为空，返回 0");
    return 0;
  }

  // 移除HTML标签
  const plainText = text.replace(/<[^>]*>/g, "").trim();

  // 统计中文字符
  const chineseChars = plainText.match(/[\u4e00-\u9fa5]/g) || [];

  // 统计英文单词（只统计纯字母单词，不包含数字）
  const englishWords = plainText.match(/[a-zA-Z]+/g) || [];

  // 统计数字字符（按字符数计算，不是单词数）
  const digitChars = plainText.match(/[0-9]/g) || [];

  // 总字数 = 中文字符数 + 英文单词数 + 数字字符数
  const totalCount =
    chineseChars.length + englishWords.length + digitChars.length;

  console.log("📊 [calculateWordCount] 字数计算:", {
    原始文本长度: text.length,
    纯文本长度: plainText.length,
    中文字符数: chineseChars.length,
    英文单词数: englishWords.length,
    数字字符数: digitChars.length,
    总字数: totalCount,
    文本预览: plainText.substring(0, 30) + (plainText.length > 30 ? "..." : "")
  });

  return totalCount;
};

// 计算节点内容的字数
const getNodeTextContent = (node: any): string => {
  let text = "";
  let nodeCount = 0;

  const traverse = (n: any, depth: number = 0) => {
    if (!n.content) return;

    n.content.forEach((child: any) => {
      nodeCount++;
      const indent = "  ".repeat(depth);

      if (child.type.name === "text") {
        const childText = child.text || "";
        text += childText;
      } else if (child.content) {
        traverse(child, depth + 1);
      } else {
      }
    });
  };

  return text;
};

// 防止无限循环：记录上次更新的时间戳和内容哈希
let lastUpdateTimestamp = 0;
let lastContentHash = "";

// 缓存最后一次清理的 HTML，避免重复清理
let lastCleanedHTML = "";
let lastEditorStateHash = "";

/**
 * 获取清理后的 HTML（用于保存文章）
 * 从编辑器 JSON 中提取 originalHTML，替换占位符
 */
const getCleanedHTML = (): string => {
  if (!editor.value) return "";

  // 生成当前编辑器状态的简单哈希
  const currentHash = JSON.stringify(editor.value.state.doc.toJSON());

  // 如果编辑器状态没有变化，直接返回缓存的结果
  if (currentHash === lastEditorStateHash && lastCleanedHTML) {
    console.log("📦 [getCleanedHTML] 使用缓存的清理结果");
    return lastCleanedHTML;
  }

  let html = "";
  try {
    html = editor.value.getHTML();
  } catch (error) {
    console.error("❌ [getCleanedHTML] editor.getHTML() 失败:", error);
    // 🔧 备用方案：直接从 DOM 获取 HTML
    const editorEl = document.querySelector(".frontend-editor-content");
    if (editorEl) {
      console.log("🔄 [getCleanedHTML] 使用 DOM 备用方案");
      html = editorEl.innerHTML;
    } else {
      console.error("❌ [getCleanedHTML] 无法找到编辑器 DOM 元素");
      return lastCleanedHTML || "";
    }
  }

  console.log("🧹 [getCleanedHTML] 开始处理代码块（字符串级别）");
  console.log("📝 [getCleanedHTML] 原始 HTML 长度:", html.length);
  console.log(
    "📝 [getCleanedHTML] 原始 HTML 是否包含占位符:",
    html.includes("interactive-code-block-placeholder")
  );

  // 🔧 第一步：在字符串级别替换代码块占位符（避免浏览器规范化）
  // 从编辑器 JSON 中收集所有代码块的 originalHTML
  const codeBlocksData: string[] = [];
  editor.value.state.doc.descendants((node: any) => {
    if (node.type.name === "interactiveCodeBlock") {
      const originalHTML = node.attrs.originalHTML || "";
      codeBlocksData.push(originalHTML);
      console.log(
        `📦 [getCleanedHTML] 从 JSON 提取代码块 #${codeBlocksData.length}:`,
        {
          占位符数: (originalHTML.match(/___PRESERVED_NEWLINE___/g) || [])
            .length,
          "&#10;实体数": (originalHTML.match(/&#10;/g) || []).length,
          原生换行符数: (originalHTML.match(/\n/g) || []).length,
          HTML长度: originalHTML.length,
          HTML前200字符: originalHTML.substring(0, 200)
        }
      );
    }
  });

  console.log(
    `📦 [getCleanedHTML] 从编辑器 JSON 中找到 ${codeBlocksData.length} 个代码块`
  );

  // 使用正则表达式在字符串中替换占位符
  if (codeBlocksData.length > 0) {
    let replacementIndex = 0;
    // 匹配整个占位符 div
    const placeholderRegex =
      /<div[^>]*class="interactive-code-block-placeholder"[^>]*>.*?<\/div>/gs;

    // 先测试正则表达式是否能匹配
    const matches = html.match(placeholderRegex);
    console.log(
      `🔍 [getCleanedHTML] 正则匹配到 ${matches?.length || 0} 个占位符`
    );
    if (matches && matches.length > 0) {
      console.log(
        "🔍 [getCleanedHTML] 第一个匹配的占位符（前300字符）:",
        matches[0].substring(0, 300)
      );
    }

    const htmlBeforeReplace = html;
    html = html.replace(placeholderRegex, match => {
      if (replacementIndex < codeBlocksData.length) {
        let originalHTML = codeBlocksData[replacementIndex];

        // 🔧 将保护的占位符还原为 &#10; 实体
        originalHTML = originalHTML.replace(
          /___PRESERVED_NEWLINE___/g,
          "&#10;"
        );

        replacementIndex++;
        console.log(
          `🔄 [getCleanedHTML] 字符串替换占位符 #${replacementIndex}:`,
          {
            匹配内容长度: match.length,
            匹配内容前200字符: match.substring(0, 200),
            替换HTML长度: originalHTML.length,
            "还原后&#10;实体数": (originalHTML.match(/&#10;/g) || []).length,
            替换HTML原生换行符数: (originalHTML.match(/\n/g) || []).length,
            替换HTML前200字符: originalHTML.substring(0, 200)
          }
        );
        return originalHTML;
      }
      return match;
    });

    console.log(
      `✅ [getCleanedHTML] 完成 ${replacementIndex} 个代码块的字符串替换`
    );
    console.log(
      "📝 [getCleanedHTML] 替换前 HTML 长度:",
      htmlBeforeReplace.length
    );
    console.log("📝 [getCleanedHTML] 替换后 HTML 长度:", html.length);
    console.log(
      "📝 [getCleanedHTML] 替换后 HTML 中的 &#10; 实体数:",
      (html.match(/&#10;/g) || []).length
    );
    console.log(
      "📝 [getCleanedHTML] HTML 是否发生变化:",
      html !== htmlBeforeReplace
    );
  }

  // 🔧 第二步：在 DOM 操作前保护 &#10; 实体
  // 原因：tempDiv.innerHTML 会让浏览器解析 HTML，将 &#10; 解码为真正的换行符
  // 然后读取 innerHTML 时，浏览器会重新序列化，导致换行符丢失
  const NEWLINE_ENTITY_PLACEHOLDER = "___NEWLINE_ENTITY_PLACEHOLDER___";

  // 将 &#10; 临时替换为占位符
  const htmlWithProtectedEntities = html.replace(
    /&#10;/g,
    NEWLINE_ENTITY_PLACEHOLDER
  );

  console.log(
    "🔒 [getCleanedHTML] 保护了",
    (html.match(/&#10;/g) || []).length,
    "个 &#10; 实体"
  );

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlWithProtectedEntities;

  // 🔍 调试：检查原始 HTML 中的图片属性
  console.log("🔍 [getCleanedHTML] 检查原始 HTML 中的图片属性");
  const allImages = tempDiv.querySelectorAll("img");
  allImages.forEach((img, index) => {
    console.log(`  图片 #${index + 1}:`, {
      src: img.getAttribute("src")?.slice(-30),
      "data-src": img.getAttribute("data-src")?.slice(-30),
      width: img.getAttribute("width"),
      height: img.getAttribute("height")
    });
  });

  // 兼容：查找旧式的交互式代码块（带 interactive-code-block 类）
  const oldStyleCodeBlocks = tempDiv.querySelectorAll(
    "details.interactive-code-block"
  );
  if (oldStyleCodeBlocks.length > 0) {
    console.log(
      `📦 [getCleanedHTML] 找到 ${oldStyleCodeBlocks.length} 个旧式代码块`
    );
    oldStyleCodeBlocks.forEach(details => {
      details.classList.remove("interactive-code-block");
    });
  }

  // 🔧 处理 PreserveHTML 节点：恢复原始 HTML
  console.log("🔧 [getCleanedHTML] 开始处理 PreserveHTML 节点");
  const preserveHTMLNodes = tempDiv.querySelectorAll(
    ".preserve-html-wrapper[data-html]"
  );
  console.log(
    `📦 [getCleanedHTML] 找到 ${preserveHTMLNodes.length} 个 PreserveHTML 节点`
  );

  preserveHTMLNodes.forEach((wrapper, index) => {
    const originalHTML = wrapper.getAttribute("data-html");
    if (originalHTML) {
      console.log(
        `🔄 [getCleanedHTML] PreserveHTML #${index + 1}: 恢复原始 HTML (长度: ${originalHTML.length})`
      );
      const temp = document.createElement("div");
      temp.innerHTML = originalHTML;
      const element = temp.firstElementChild;
      if (element && wrapper.parentNode) {
        wrapper.parentNode.replaceChild(element, wrapper);
        console.log(`✅ [getCleanedHTML] PreserveHTML #${index + 1} 恢复成功`);
      }
    }
  });

  // 🖼️ 处理懒加载图片：将 data-src 恢复到 src
  console.log("🖼️ [getCleanedHTML] 开始处理懒加载图片");
  const lazyImages =
    tempDiv.querySelectorAll<HTMLImageElement>("img[data-src]");
  console.log(`📦 [getCleanedHTML] 找到 ${lazyImages.length} 个懒加载图片`);

  lazyImages.forEach((img, index) => {
    const dataSrc = img.getAttribute("data-src");
    const width = img.getAttribute("width");
    const height = img.getAttribute("height");

    console.log(
      `🔄 [getCleanedHTML] 图片 #${index + 1}: src=${dataSrc?.slice(-30)}, width=${width}, height=${height}`
    );

    if (dataSrc) {
      img.setAttribute("src", dataSrc);
      img.removeAttribute("data-src");
      // 移除懒加载相关的类和属性
      img.classList.remove("lazy-image", "lazy-loaded", "lazy-loading");
      img.removeAttribute("data-lazy-processed");
    }

    // 📊 验证保存后的属性
    console.log(
      `✅ [getCleanedHTML] 图片 #${index + 1} 处理后: width=${img.getAttribute("width")}, height=${img.getAttribute("height")}`
    );
  });

  // 获取处理后的HTML
  let result = tempDiv.innerHTML;

  // 🔧 还原占位符为 &#10; 实体
  result = result.replace(new RegExp(NEWLINE_ENTITY_PLACEHOLDER, "g"), "&#10;");

  console.log(
    "🔓 [getCleanedHTML] 还原了",
    (result.match(/&#10;/g) || []).length,
    "个 &#10; 实体"
  );

  console.log(`✅ [getCleanedHTML] 清理完成，HTML 长度: ${result.length}`);

  // 🔍 调试：检查最终 HTML 中的图片标签
  console.log("🔍 [getCleanedHTML] 最终 HTML 中的图片标签:");
  const finalImages = tempDiv.querySelectorAll("img");
  finalImages.forEach((img, index) => {
    console.log(`  最终图片 #${index + 1}:`, {
      src: img.getAttribute("src")?.slice(-30),
      width: img.getAttribute("width"),
      height: img.getAttribute("height"),
      完整标签: img.outerHTML.substring(0, 200)
    });
  });

  // 🔍 调试：检查代码块的换行符编码
  console.log("🔍 [getCleanedHTML] 最终 HTML 中的代码块换行符编码:");
  const codeBlockMatches = result.match(
    /<span class="md-editor-code-block">[\s\S]*?<\/span>/g
  );
  if (codeBlockMatches) {
    codeBlockMatches.forEach((match, index) => {
      const htmlEntityCount = (match.match(/&#10;/g) || []).length;
      const rawNewlineCount = (match.match(/\n/g) || []).length;
      console.log(
        `  代码块 #${index + 1}: ${htmlEntityCount} 个 &#10; 实体, ${rawNewlineCount} 个原生换行符，前100字符:`,
        match.substring(0, 100)
      );
    });
  }

  // 缓存结果
  lastCleanedHTML = result;
  lastEditorStateHash = currentHash;

  return result;
};

// 更新付费内容和密码保护内容的字数统计
const updateContentLengths = (editorInstance: any) => {
  console.log("🔍 [updateContentLengths] ========== 开始更新字数 ==========");
  const { state, view } = editorInstance;

  // 生成当前文档的简单哈希（用于检测内容是否真的变化）
  const currentHash = JSON.stringify(state.doc.toJSON());
  const now = Date.now();
  const timeSinceLastUpdate = now - lastUpdateTimestamp;

  console.log("🔍 [updateContentLengths] 时间检查:", {
    timeSinceLastUpdate: `${timeSinceLastUpdate}ms`,
    contentChanged: currentHash !== lastContentHash
  });

  // 如果内容哈希相同且距离上次更新不到50ms，跳过（避免重复更新）
  if (currentHash === lastContentHash && timeSinceLastUpdate < 50) {
    console.log(
      "⏭️ [updateContentLengths] 跳过更新（内容未变化或更新过于频繁）"
    );
    return;
  }

  const { tr } = state;
  let modified = false;
  let paidContentCount = 0;
  let passwordContentCount = 0;
  let loginRequiredContentCount = 0;

  state.doc.descendants((node: any, pos: number) => {
    // 处理付费内容节点
    if (node.type.name === "paidContent") {
      paidContentCount++;
      const textContent = getNodeTextContent(node);
      const wordCount = calculateWordCount(textContent);
      const currentLength = node.attrs.contentLength || "0";

      console.log(`📝 [付费内容 #${paidContentCount}] 检查字数:`, {
        title: node.attrs.title,
        position: pos,
        currentLength,
        newCount: wordCount,
        textContent: textContent.substring(0, 50) + "...",
        needsUpdate: String(wordCount) !== currentLength
      });

      if (String(wordCount) !== currentLength) {
        console.log("✅ [付费内容] 字数需要更新:", {
          title: node.attrs.title,
          oldCount: currentLength,
          newCount: wordCount
        });
        tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          contentLength: String(wordCount)
        });
        modified = true;
      }
    }

    // 处理密码保护内容节点
    if (node.type.name === "passwordContent") {
      passwordContentCount++;
      const textContent = getNodeTextContent(node);
      const wordCount = calculateWordCount(textContent);
      const currentLength = node.attrs.contentLength || "0";

      console.log(`🔒 [密码内容 #${passwordContentCount}] 检查字数:`, {
        title: node.attrs.title,
        position: pos,
        currentLength,
        newCount: wordCount,
        textContent: textContent.substring(0, 50) + "...",
        needsUpdate: String(wordCount) !== currentLength
      });

      if (String(wordCount) !== currentLength) {
        console.log("✅ [密码内容] 字数需要更新:", {
          title: node.attrs.title,
          oldCount: currentLength,
          newCount: wordCount
        });
        tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          contentLength: String(wordCount)
        });
        modified = true;
      }
    }

    // 处理登录后可查看内容节点
    if (node.type.name === "loginRequiredContent") {
      loginRequiredContentCount++;
      const textContent = getNodeTextContent(node);
      const wordCount = calculateWordCount(textContent);
      const currentLength = node.attrs.contentLength || "0";

      console.log(`👤 [登录内容 #${loginRequiredContentCount}] 检查字数:`, {
        title: node.attrs.title,
        position: pos,
        currentLength,
        newCount: wordCount,
        textContent: textContent.substring(0, 50) + "...",
        needsUpdate: String(wordCount) !== currentLength
      });

      if (String(wordCount) !== currentLength) {
        console.log("✅ [登录内容] 字数需要更新:", {
          title: node.attrs.title,
          oldCount: currentLength,
          newCount: wordCount
        });
        tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          contentLength: String(wordCount)
        });
        modified = true;
      }
    }
  });

  console.log("🔍 [updateContentLengths] 统计结果:", {
    paidContentCount,
    passwordContentCount,
    loginRequiredContentCount,
    modified
  });

  // 如果有修改，应用事务
  if (modified) {
    console.log("💾 [updateContentLengths] 应用字数更新事务");
    lastUpdateTimestamp = now;
    lastContentHash = currentHash;
    view.dispatch(tr);
    console.log("✅ [updateContentLengths] 字数更新完成");
  } else {
    console.log("ℹ️ [updateContentLengths] 无需更新字数");
  }

  console.log("🔍 [updateContentLengths] ========== 更新字数结束 ==========");
};

// HTML 转 Markdown
const convertHtmlToMarkdown = (html: string): string => {
  try {
    // 🔧 不要替换占位符！直接让 Turndown 处理占位符
    // 占位符包含 Base64 编码的原始代码，可以完整保留换行符
    console.log("🔄 [convertHtmlToMarkdown] 开始转换");
    console.log(
      "📦 [convertHtmlToMarkdown] 是否包含占位符:",
      html.includes("interactive-code-block-placeholder")
    );

    const markdown = turndownService.turndown(html);

    console.log("✅ [convertHtmlToMarkdown] 转换完成");
    console.log("📝 [convertHtmlToMarkdown] Markdown 长度:", markdown.length);

    return markdown;
  } catch (error) {
    console.error("HTML转Markdown失败:", error);
    return html;
  }
};

// 标记：是否正在通过 onUpdate 发送更新（避免循环）
let isUpdatingFromEditor = false;

// 监听外部内容变化
watch(
  () => props.modelValue,
  value => {
    if (!editor.value) return;

    // 如果是编辑器自己触发的更新，忽略
    if (isUpdatingFromEditor) {
      console.log("🔄 [watch modelValue] 跳过编辑器自身触发的更新");
      return;
    }

    // 🔧 比较清理后的 HTML，避免因占位符差异导致无限循环
    const currentCleanedHTML = getCleanedHTML();
    if (value !== currentCleanedHTML) {
      try {
        // 🔍 检查原始 HTML 字符串中的代码块
        console.log("=".repeat(80));
        console.log("🔍 [setContent] 接收到的 HTML 长度:", value.length);

        const codeBlockMatch = value.match(
          /<details[^>]*class="md-editor-code"[^>]*>[\s\S]*?<\/details>/
        );
        if (codeBlockMatch) {
          console.log("✅ [setContent] 找到代码块完整结构");
          console.log(
            "📏 [setContent] 代码块 HTML 长度:",
            codeBlockMatch[0].length
          );

          // 提取 md-editor-code-block 部分
          const codeContentMatch = codeBlockMatch[0].match(
            /<span class="md-editor-code-block">([\s\S]*?)<\/span>/
          );
          if (codeContentMatch) {
            console.log("📝 [setContent] 代码内容（前300字符）:");
            console.log(codeContentMatch[1].substring(0, 300));
            console.log(
              "🔢 [setContent] 代码内容中的换行符数量:",
              (codeContentMatch[1].match(/\n/g) || []).length
            );
            console.log(
              "🔢 [setContent] 代码内容中的 <span> 标签数量:",
              (codeContentMatch[1].match(/<span/g) || []).length
            );
          }
        } else {
          console.log("⚠️ [setContent] 未找到代码块");
        }
        console.log("=".repeat(80));

        editor.value.commands.setContent(value);
      } catch (error) {
        console.warn("Failed to set content:", error);
      }
    }
  }
);

// 监听只读状态变化
watch(
  () => props.readonly,
  value => {
    if (editor.value) {
      try {
        editor.value.setEditable(!value);
      } catch (error) {
        console.warn("Failed to set editable:", error);
      }
    }
  }
);

// 工具栏按钮操作
const setHeading = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
  editor.value?.chain().focus().toggleHeading({ level }).run();
};

const toggleBold = () => {
  editor.value?.chain().focus().toggleBold().run();
};

const toggleItalic = () => {
  editor.value?.chain().focus().toggleItalic().run();
};

const toggleUnderline = () => {
  editor.value?.chain().focus().toggleUnderline().run();
};

const toggleStrike = () => {
  editor.value?.chain().focus().toggleStrike().run();
};

const toggleBulletList = () => {
  editor.value?.chain().focus().toggleBulletList().run();
};

const toggleOrderedList = () => {
  editor.value?.chain().focus().toggleOrderedList().run();
};

const toggleBlockquote = () => {
  editor.value?.chain().focus().toggleBlockquote().run();
};

const toggleCodeBlock = () => {
  editor.value?.chain().focus().toggleCodeBlock().run();
};

const setTextAlign = (align: "left" | "center" | "right" | "justify") => {
  editor.value?.chain().focus().setTextAlign(align).run();
};

const undo = () => {
  editor.value?.chain().focus().undo().run();
};

const redo = () => {
  editor.value?.chain().focus().redo().run();
};

// ========== 付费内容相关 ==========
// 打开付费内容插入对话框
const openPaidContentDialog = () => {
  isEditingPaidContent.value = false;
  paidContentForm.value = {
    title: "付费内容",
    price: 9.99,
    originalPrice: null,
    currency: "¥"
  };
  editingPaidContentPos.value = -1;
  paidContentDialogVisible.value = true;
};

// 编辑付费内容
const editPaidContent = (pos?: number) => {
  if (!editor.value) return;

  const { state } = editor.value;
  let targetPos = pos;

  // 如果没有传入位置，通过当前选中位置查找
  if (targetPos === undefined) {
    const { from } = state.selection;
    state.doc.nodesBetween(from, from + 1, (node, nodePos) => {
      if (node.type.name === "paidContent") {
        targetPos = nodePos;
        return false;
      }
    });
  }

  if (targetPos === undefined) return;

  // 查找对应的付费内容节点
  const node = state.doc.nodeAt(targetPos);
  if (node && node.type.name === "paidContent") {
    isEditingPaidContent.value = true;
    editingPaidContentPos.value = targetPos;

    // 填充表单数据
    paidContentForm.value = {
      title: node.attrs.title || "付费内容",
      price: parseFloat(node.attrs.price) || 9.99,
      originalPrice: node.attrs.originalPrice
        ? parseFloat(node.attrs.originalPrice)
        : null,
      currency: node.attrs.currency || "¥"
    };

    paidContentDialogVisible.value = true;
  }
};

// 插入或更新付费内容
const insertPaidContent = () => {
  if (!paidContentForm.value.price || paidContentForm.value.price <= 0) {
    ElMessage.warning("请输入有效的价格");
    return;
  }

  if (!editor.value) return;

  if (isEditingPaidContent.value && editingPaidContentPos.value >= 0) {
    // 编辑模式：更新现有节点的属性
    const { state } = editor.value;
    const node = state.doc.nodeAt(editingPaidContentPos.value);

    if (node && node.type.name === "paidContent") {
      // 更新节点属性，保留原有内容
      editor.value
        .chain()
        .focus()
        .setNodeSelection(editingPaidContentPos.value)
        .updateAttributes("paidContent", {
          title: paidContentForm.value.title,
          price: String(paidContentForm.value.price),
          originalPrice: paidContentForm.value.originalPrice
            ? String(paidContentForm.value.originalPrice)
            : null,
          currency: paidContentForm.value.currency,
          contentLength: node.attrs.contentLength || "0" // 保留原有字数统计
        })
        .run();

      ElMessage.success("付费内容已更新");
    }
  } else {
    // 🔧 插入模式：先检查是否已存在付费内容
    const { state } = editor.value;
    let hasPaidContent = false;

    state.doc.descendants(node => {
      if (node.type.name === "paidContent") {
        hasPaidContent = true;
        return false; // 停止遍历
      }
    });

    if (hasPaidContent) {
      ElMessage.error(
        "一篇文章只能包含一个付费内容区块，请删除现有付费内容后再添加"
      );
      return;
    }

    // 创建新节点
    editor.value
      .chain()
      .focus()
      .insertContent({
        type: "paidContent",
        attrs: {
          title: paidContentForm.value.title,
          price: String(paidContentForm.value.price),
          originalPrice: paidContentForm.value.originalPrice
            ? String(paidContentForm.value.originalPrice)
            : null,
          currency: paidContentForm.value.currency,
          contentLength: "0" // 初始字数为0
        },
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "付费内容在这里..."
              }
            ]
          }
        ]
      })
      .run();

    ElMessage.success("付费内容已插入");
  }

  paidContentDialogVisible.value = false;
};

// 取消插入付费内容
const cancelPaidContentInsert = () => {
  paidContentDialogVisible.value = false;
};

// ========== 密码保护内容相关 ==========
// 打开密码保护内容插入对话框
const openPasswordContentDialog = () => {
  isEditingPasswordContent.value = false;
  passwordContentForm.value = {
    contentId: `password-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: "重要内容",
    hint: "请联系作者获取访问密码",
    placeholder: "请输入密码",
    password: ""
  };
  editingPasswordContentPos.value = -1;
  passwordContentDialogVisible.value = true;
};

// 编辑密码保护内容
const editPasswordContent = (contentId: string) => {
  if (!editor.value) return;

  const { state } = editor.value;

  // 查找对应的密码保护内容节点
  state.doc.descendants((node, pos) => {
    if (
      node.type.name === "passwordContent" &&
      node.attrs.contentId === contentId
    ) {
      isEditingPasswordContent.value = true;
      editingPasswordContentPos.value = pos;

      // 填充表单数据
      passwordContentForm.value = {
        contentId: node.attrs.contentId || "",
        title: node.attrs.title || "密码保护内容",
        hint: node.attrs.hint || "请输入密码",
        placeholder: node.attrs.placeholder || "请输入密码",
        password: node.attrs.password || ""
      };

      passwordContentDialogVisible.value = true;
      return false; // 停止遍历
    }
  });
};

// 插入或更新密码保护内容
const insertPasswordContent = () => {
  if (!passwordContentForm.value.password.trim()) {
    ElMessage.warning("请设置密码");
    return;
  }

  if (!editor.value) return;

  if (isEditingPasswordContent.value && editingPasswordContentPos.value >= 0) {
    // 编辑模式：更新现有节点的属性
    const { state } = editor.value;
    const node = state.doc.nodeAt(editingPasswordContentPos.value);

    if (node && node.type.name === "passwordContent") {
      // 更新节点属性，保留原有内容
      editor.value
        .chain()
        .focus()
        .setNodeSelection(editingPasswordContentPos.value)
        .updateAttributes("passwordContent", {
          contentId: passwordContentForm.value.contentId,
          title: passwordContentForm.value.title,
          hint: passwordContentForm.value.hint,
          placeholder: passwordContentForm.value.placeholder,
          password: passwordContentForm.value.password,
          contentLength: node.attrs.contentLength || "0" // 保留原有字数统计
        })
        .run();

      ElMessage.success("密码保护内容已更新");
    }
  } else {
    // 🔧 插入模式：先检查是否已存在密码保护内容
    const { state } = editor.value;
    let hasPasswordContent = false;

    state.doc.descendants(node => {
      if (node.type.name === "passwordContent") {
        hasPasswordContent = true;
        return false; // 停止遍历
      }
    });

    if (hasPasswordContent) {
      ElMessage.error(
        "一篇文章只能包含一个密码保护内容区块，请删除现有密码保护内容后再添加"
      );
      return;
    }

    // 创建新节点
    editor.value
      .chain()
      .focus()
      .insertContent({
        type: "passwordContent",
        attrs: {
          contentId: passwordContentForm.value.contentId,
          title: passwordContentForm.value.title,
          hint: passwordContentForm.value.hint,
          placeholder: passwordContentForm.value.placeholder,
          password: passwordContentForm.value.password,
          contentLength: "0" // 初始字数为0
        },
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "密码保护的内容在这里..."
              }
            ]
          }
        ]
      })
      .run();

    ElMessage.success("密码保护内容已插入");
  }

  passwordContentDialogVisible.value = false;
};

// 取消插入密码保护内容
const cancelPasswordContentInsert = () => {
  passwordContentDialogVisible.value = false;
};

// ========== 登录后可查看内容相关 ==========
// 打开登录后可查看内容插入对话框
const openLoginRequiredContentDialog = () => {
  isEditingLoginRequiredContent.value = false;
  loginRequiredContentForm.value = {
    contentId: `login-required-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: "登录后可查看",
    hint: "此内容需要登录后才能查看"
  };
  editingLoginRequiredContentPos.value = -1;
  loginRequiredContentDialogVisible.value = true;
};

// 编辑登录后可查看内容
const editLoginRequiredContent = (contentId: string) => {
  if (!editor.value) return;

  const { state } = editor.value;

  // 查找对应的登录后可查看内容节点
  state.doc.descendants((node, pos) => {
    if (
      node.type.name === "loginRequiredContent" &&
      node.attrs.contentId === contentId
    ) {
      isEditingLoginRequiredContent.value = true;
      editingLoginRequiredContentPos.value = pos;

      // 填充表单数据
      loginRequiredContentForm.value = {
        contentId: node.attrs.contentId || "",
        title: node.attrs.title || "登录后可查看",
        hint: node.attrs.hint || "此内容需要登录后才能查看"
      };

      loginRequiredContentDialogVisible.value = true;
      return false; // 停止遍历
    }
  });
};

// 插入或更新登录后可查看内容
const insertLoginRequiredContent = () => {
  if (!editor.value) return;

  if (
    isEditingLoginRequiredContent.value &&
    editingLoginRequiredContentPos.value >= 0
  ) {
    // 编辑模式：更新现有节点的属性
    const { state } = editor.value;
    const node = state.doc.nodeAt(editingLoginRequiredContentPos.value);

    if (node && node.type.name === "loginRequiredContent") {
      // 更新节点属性，保留原有内容
      editor.value
        .chain()
        .focus()
        .setNodeSelection(editingLoginRequiredContentPos.value)
        .updateAttributes("loginRequiredContent", {
          contentId: loginRequiredContentForm.value.contentId,
          title: loginRequiredContentForm.value.title,
          hint: loginRequiredContentForm.value.hint,
          contentLength: node.attrs.contentLength || "0" // 保留原有字数统计
        })
        .run();

      ElMessage.success("登录后可查看内容已更新");
    }
  } else {
    // 🔧 插入模式：先检查是否已存在登录后可查看内容
    const { state } = editor.value;
    let hasLoginRequiredContent = false;

    state.doc.descendants(node => {
      if (node.type.name === "loginRequiredContent") {
        hasLoginRequiredContent = true;
        return false; // 停止遍历
      }
    });

    if (hasLoginRequiredContent) {
      ElMessage.error(
        "一篇文章只能包含一个登录后可查看内容区块，请删除现有内容后再添加"
      );
      return;
    }

    // 创建新节点
    editor.value
      .chain()
      .focus()
      .insertContent({
        type: "loginRequiredContent",
        attrs: {
          contentId: loginRequiredContentForm.value.contentId,
          title: loginRequiredContentForm.value.title,
          hint: loginRequiredContentForm.value.hint,
          contentLength: "0" // 初始字数为0
        },
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "登录后可查看的内容在这里..."
              }
            ]
          }
        ]
      })
      .run();

    ElMessage.success("登录后可查看内容已插入");
  }

  loginRequiredContentDialogVisible.value = false;
};

// 取消插入登录后可查看内容
const cancelLoginRequiredContentInsert = () => {
  loginRequiredContentDialogVisible.value = false;
};

// 设置登录后可查看内容设置按钮的监听
const setupLoginRequiredContentListener = () => {
  if (!editor.value) return;

  const editorElement = editor.value.view.dom;

  editorElement.addEventListener("click", e => {
    const target = e.target as HTMLElement;
    const settingsBtn = target.closest(".login-required-settings-btn");

    if (settingsBtn) {
      e.preventDefault();
      e.stopPropagation();

      const contentId = settingsBtn.getAttribute("data-content-id");
      if (contentId) {
        editLoginRequiredContent(contentId);
      }
    }
  });
};

// 设置密码保护内容设置按钮的监听
const setupPasswordContentListener = () => {
  if (!editor.value) return;

  const editorElement = editor.value.view.dom;

  editorElement.addEventListener("click", e => {
    const target = e.target as HTMLElement;
    const settingsBtn = target.closest(".password-settings-btn");

    if (settingsBtn) {
      e.preventDefault();
      e.stopPropagation();

      const contentId = settingsBtn.getAttribute("data-content-id");
      if (contentId) {
        editPasswordContent(contentId);
      }
    }
  });
};

// 设置付费内容点击监听器
const setupPaidContentListener = () => {
  if (!editor.value) return;

  const editorElement = editor.value.view.dom;

  editorElement.addEventListener("click", e => {
    const target = e.target as HTMLElement;
    const settingsBtn = target.closest(".paid-settings-btn");

    if (settingsBtn) {
      e.preventDefault();
      e.stopPropagation();

      // 找到最近的 paid-content-editor-preview 容器
      const previewContainer = target.closest(".paid-content-editor-preview");
      if (!previewContainer) return;

      // 通过编辑器查找这个节点的位置
      const { state } = editor.value;
      let targetPos: number | undefined;

      state.doc.descendants((node, pos) => {
        if (node.type.name === "paidContent") {
          // 检查是否是当前点击的节点（通过比较属性）
          const nodeTitle = node.attrs.title;
          const nodePrice = node.attrs.price;
          const containerTitle = previewContainer.getAttribute("data-title");
          const containerPrice = previewContainer.getAttribute("data-price");

          if (nodeTitle === containerTitle && nodePrice === containerPrice) {
            targetPos = pos;
            return false; // 停止遍历
          }
        }
      });

      if (targetPos !== undefined) {
        editPaidContent(targetPos);
      }
    }
  });
};

// 打开链接插入对话框
const openLinkDialog = () => {
  // 检查是否有选中的文本
  const { from, to } = editor.value?.state.selection || {};
  const selectedText = editor.value?.state.doc.textBetween(
    from || 0,
    to || 0,
    " "
  );

  // 如果当前在链接上，获取链接信息进行编辑
  if (editor.value?.isActive("link")) {
    const { href } = editor.value.getAttributes("link");
    linkForm.value = {
      text: selectedText || "",
      url: href || ""
    };
  } else {
    linkForm.value = {
      text: selectedText || "",
      url: ""
    };
  }

  linkDialogVisible.value = true;
};

// 插入或更新链接
const handleInsertLink = () => {
  if (!linkForm.value.url.trim()) {
    ElMessage.warning("请输入链接地址");
    return;
  }

  const url = linkForm.value.url.trim();
  const text = linkForm.value.text.trim();

  if (!editor.value) return;

  // 如果当前没有选中文本，则插入新的链接
  if (editor.value.state.selection.empty) {
    // 使用描述文本，如果没有描述则使用链接地址本身
    const displayText = text || url;
    editor.value
      .chain()
      .focus()
      .insertContent(`<a href="${url}">${displayText}</a>`)
      .run();
  } else {
    // 否则将当前选中的文本设置为链接
    editor.value
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }

  ElMessage.success("链接插入成功");
  linkDialogVisible.value = false;
};

// 取消插入链接
const handleCancelLink = () => {
  linkDialogVisible.value = false;
};

const addLink = () => {
  openLinkDialog();
};

const removeLink = () => {
  editor.value?.chain().focus().unsetLink().run();
};

// 打开图片插入对话框
const openImageInsertDialog = () => {
  imageInsertForm.value = {
    url: "",
    file: null
  };
  imageUploadMode.value = "url";
  imageInsertDialogVisible.value = true;
};

// 处理图片文件选择
const handleImageFileChange = (uploadFile: any) => {
  if (uploadFile && uploadFile.raw) {
    imageInsertForm.value.file = uploadFile.raw as File;
  }
};

// 插入图片
const insertImage = async () => {
  try {
    let imageUrl = "";

    if (imageUploadMode.value === "url") {
      // 链接模式
      imageUrl = imageInsertForm.value.url.trim();
      if (!imageUrl) {
        ElMessage.warning("请输入图片链接");
        return;
      }
    } else {
      // 上传模式
      const file = imageInsertForm.value.file;
      if (!file) {
        ElMessage.warning("请选择要上传的图片");
        return;
      }

      // 检查文件类型
      if (!file.type.startsWith("image/")) {
        ElMessage.error("只能上传图片文件");
        return;
      }

      // 检查文件大小（限制5MB）
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        ElMessage.error("图片大小不能超过5MB");
        return;
      }

      if (!props.onUploadImage) {
        ElMessage.error("未配置图片上传功能");
        return;
      }

      isUploadingImage.value = true;
      try {
        imageUrl = await props.onUploadImage(file);
        if (!imageUrl) {
          throw new Error("上传失败，未返回图片地址");
        }
      } catch (error: any) {
        ElMessage.error(error.message || "图片上传失败");
        return;
      } finally {
        isUploadingImage.value = false;
      }
    }

    // 插入图片到编辑器
    editor.value?.chain().focus().setImage({ src: imageUrl }).run();

    ElMessage.success("图片插入成功");
    imageInsertDialogVisible.value = false;
  } catch (error: any) {
    ElMessage.error(error.message || "插入图片失败");
    isUploadingImage.value = false;
  }
};

// 取消插入图片
const cancelImageInsert = () => {
  imageInsertDialogVisible.value = false;
};

// 处理粘贴图片
const handlePasteImage = async (file: File) => {
  // 检查文件类型
  if (!file.type.startsWith("image/")) {
    return;
  }

  // 检查文件大小（限制5MB）
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    ElMessage.error("图片大小不能超过5MB");
    return;
  }

  if (!props.onUploadImage) {
    ElMessage.error("未配置图片上传功能");
    return;
  }

  // 显示上传提示
  const loadingMessage = ElMessage.info({
    message: "正在上传粘贴的图片...",
    duration: 0
  });

  try {
    const imageUrl = await props.onUploadImage(file);
    if (!imageUrl) {
      throw new Error("上传失败，未返回图片地址");
    }

    // 插入图片到编辑器
    editor.value?.chain().focus().setImage({ src: imageUrl }).run();

    ElMessage.success("图片粘贴成功");
  } catch (error: any) {
    ElMessage.error(error.message || "图片上传失败");
  } finally {
    loadingMessage.close();
  }
};

// 检查当前状态
const isActive = (
  name: string | Record<string, any>,
  attrs?: Record<string, any>
) => {
  if (typeof name === "string") {
    return editor.value?.isActive(name, attrs) ?? false;
  }
  return editor.value?.isActive(name) ?? false;
};

// 图片编辑相关
const selectedImage = ref<HTMLImageElement | null>(null);
const resizeHandles = ref<HTMLDivElement[]>([]);
const previewBox = ref<HTMLDivElement | null>(null);
const imageToolbar = ref<HTMLDivElement | null>(null);

// 链接插入对话框
const linkDialogVisible = ref(false);
const linkForm = ref({
  text: "",
  url: ""
});

// 图片插入对话框
const imageInsertDialogVisible = ref(false);
const imageInsertForm = ref({
  url: "",
  file: null as File | null
});
const imageUploadMode = ref<"url" | "upload">("url"); // url: 链接模式, upload: 上传模式
const isUploadingImage = ref(false);

// 图片编辑对话框
const imageEditDialogVisible = ref(false);
const imageEditForm = ref({
  src: "",
  alt: "",
  title: "",
  caption: "",
  width: null as number | null,
  height: null as number | null,
  keepAspectRatio: true
});
const originalAspectRatio = ref(1);
// 保存正在编辑的图片位置，避免因为点击对话框导致 selectedImage 被清空
const editingImagePos = ref(-1);

// ========== 付费内容编辑对话框 ==========
const paidContentDialogVisible = ref(false);
const isEditingPaidContent = ref(false); // 标记是编辑还是插入
const paidContentForm = ref({
  title: "付费内容",
  price: 9.99,
  originalPrice: null as number | null,
  currency: "¥"
});
const editingPaidContentPos = ref(-1);

// ========== 密码保护内容编辑对话框 ==========
const passwordContentDialogVisible = ref(false);
const passwordContentForm = ref({
  contentId: "",
  title: "密码保护内容",
  hint: "请输入密码",
  placeholder: "请输入密码",
  password: ""
});
const editingPasswordContentPos = ref(-1);
const isEditingPasswordContent = ref(false); // 是否为编辑模式

// ========== 登录后可查看内容编辑对话框 ==========
const loginRequiredContentDialogVisible = ref(false);
const loginRequiredContentForm = ref({
  contentId: "",
  title: "登录后可查看",
  hint: "此内容需要登录后才能查看"
});
const editingLoginRequiredContentPos = ref(-1);
const isEditingLoginRequiredContent = ref(false); // 是否为编辑模式

// 清理调整手柄和预览框
const cleanupImageEdit = () => {
  console.log("🧹 清理图片编辑状态");

  // 移除调整手柄
  resizeHandles.value.forEach(handle => {
    try {
      if (handle.parentNode) {
        handle.parentNode.removeChild(handle);
      }
    } catch (error) {
      console.error("移除手柄失败:", error);
    }
  });
  resizeHandles.value = [];

  // 移除预览框
  if (previewBox.value) {
    try {
      if (previewBox.value.parentNode) {
        previewBox.value.parentNode.removeChild(previewBox.value);
      }
      previewBox.value = null;
      console.log("✅ 预览框已清理");
    } catch (error) {
      console.error("移除预览框失败:", error);
    }
  }

  // 移除图片工具栏
  if (imageToolbar.value) {
    try {
      if (imageToolbar.value.parentNode) {
        imageToolbar.value.parentNode.removeChild(imageToolbar.value);
      }
      imageToolbar.value = null;
      console.log("✅ 图片工具栏已清理");
    } catch (error) {
      console.error("移除工具栏失败:", error);
    }
  }

  // 清除选中状态
  if (selectedImage.value) {
    selectedImage.value.classList.remove("image-selected");
    selectedImage.value = null;
  }
};

// 打开图片编辑对话框
const openImageEditDialog = () => {
  if (!editor.value || !selectedImage.value) return;

  const { state } = editor.value;

  // 查找当前图片的属性
  state.doc.descendants((node, nodePos) => {
    if (node.type.name === "customImage") {
      const dom = editor.value?.view.nodeDOM(nodePos);
      // dom 可能是 figure 或 img
      let isMatch = false;
      if (dom === selectedImage.value) {
        isMatch = true;
      } else if (dom instanceof HTMLElement) {
        const img = dom.querySelector("img");
        if (img === selectedImage.value) {
          isMatch = true;
        }
      }

      if (isMatch) {
        // 保存图片位置
        editingImagePos.value = nodePos;

        // 获取图片的实际显示尺寸（如果未设置则使用图片的实际尺寸）
        const currentWidth =
          node.attrs.width || selectedImage.value?.offsetWidth || null;
        const currentHeight =
          node.attrs.height || selectedImage.value?.offsetHeight || null;

        // 填充表单数据
        imageEditForm.value = {
          src: node.attrs.src || "",
          alt: node.attrs.alt || "",
          title: node.attrs.title || "",
          caption: node.attrs.caption || "",
          width: currentWidth,
          height: currentHeight,
          keepAspectRatio: node.attrs.keepAspectRatio !== false
        };

        // 计算原始宽高比
        if (currentWidth && currentHeight) {
          originalAspectRatio.value = currentWidth / currentHeight;
        } else if (selectedImage.value) {
          originalAspectRatio.value =
            selectedImage.value.naturalWidth /
            selectedImage.value.naturalHeight;
        }

        imageEditDialogVisible.value = true;

        // 隐藏调整手柄和工具栏
        resizeHandles.value.forEach(handle => {
          handle.style.display = "none";
        });
        if (imageToolbar.value) {
          imageToolbar.value.style.display = "none";
        }

        return false;
      }
    }
  });
};

// 关闭图片编辑对话框（由 v-model 触发）
const onImageEditDialogClose = () => {
  editingImagePos.value = -1;

  // 关闭对话框时清理图片编辑状态
  // 注意：如果是保存操作，会在保存完成后重新选中图片并创建新的手柄
  // 如果是取消操作，则清理所有编辑状态
  cleanupImageEdit();
};

// 取消图片编辑
const cancelImageEdit = () => {
  imageEditDialogVisible.value = false;
  // onImageEditDialogClose 会自动被 @close 触发
};

// 保存图片编辑
const saveImageEdit = () => {
  console.log("💾 开始保存图片编辑");
  console.log("  编辑表单数据:", imageEditForm.value);
  console.log("  保存的图片位置:", editingImagePos.value);

  if (!editor.value) {
    console.warn("⚠️ 编辑器不存在");
    return;
  }

  if (editingImagePos.value < 0) {
    console.error("❌ 没有保存的图片位置");
    return;
  }

  const pos = editingImagePos.value;

  console.log("⏳ 更新图片属性...");
  // 更新图片属性 - 使用 chain 确保命令正确执行
  editor.value.commands.setNodeSelection(pos);
  const updateResult = editor.value
    .chain()
    .focus()
    .updateAttributes("customImage", {
      src: imageEditForm.value.src,
      alt: imageEditForm.value.alt,
      title: imageEditForm.value.title,
      caption: imageEditForm.value.caption,
      width: imageEditForm.value.width,
      height: imageEditForm.value.height,
      keepAspectRatio: imageEditForm.value.keepAspectRatio
    })
    .run();

  console.log("✅ 更新属性结果:", updateResult);

  // 关闭对话框（onImageEditDialogClose 会自动被触发来清理状态）
  imageEditDialogVisible.value = false;

  // 等待 DOM 更新后重新选中图片
  // 使用 setTimeout 给浏览器足够的时间完成布局计算
  setTimeout(() => {
    console.log("⏰ 保存编辑后 - 开始重建手柄");

    const updatedDom = editor.value?.view.nodeDOM(pos);
    let updatedImg: HTMLImageElement | null = null;

    if (updatedDom instanceof HTMLImageElement) {
      updatedImg = updatedDom;
      console.log("  updatedDom 是 img 元素");
    } else if (updatedDom instanceof HTMLElement) {
      // 如果是 figure，提取其中的 img
      updatedImg = updatedDom.querySelector("img");
      console.log("  updatedDom 是 figure 元素，提取 img");
    }

    if (updatedImg) {
      const rect = updatedImg.getBoundingClientRect();
      console.log("📐 保存后图片位置:", {
        width: rect.width,
        height: rect.height
      });

      // 手动加载图片（如果有 data-src）
      const dataSrc = updatedImg.getAttribute("data-src");
      if (dataSrc && updatedImg.src !== dataSrc) {
        console.log("🖼️ 手动加载编辑后的图片");
        updatedImg.src = dataSrc;
        updatedImg.classList.add("lazy-loaded");
      }

      console.log("✅ 重新触发图片点击事件");
      updatedImg.click();
    } else {
      console.warn("⚠️ 未找到更新后的图片元素");
    }
  }, 50); // 50ms 足够浏览器完成布局
};

// 监听宽度变化（保持宽高比）
const onWidthChange = (newWidth: number | null) => {
  if (
    imageEditForm.value.keepAspectRatio &&
    newWidth &&
    originalAspectRatio.value
  ) {
    imageEditForm.value.height = Math.round(
      newWidth / originalAspectRatio.value
    );
  }
};

// 监听高度变化（保持宽高比）
const onHeightChange = (newHeight: number | null) => {
  if (
    imageEditForm.value.keepAspectRatio &&
    newHeight &&
    originalAspectRatio.value
  ) {
    imageEditForm.value.width = Math.round(
      newHeight * originalAspectRatio.value
    );
  }
};

// 创建图片工具栏
const createImageToolbar = (img: HTMLImageElement) => {
  console.log("🎨 开始创建图片工具栏");
  const editorWrapper = img.closest(".editor-wrapper");
  if (!editorWrapper) {
    console.warn("⚠️ 未找到 editor-wrapper 元素");
    return;
  }

  const wrapperRect = editorWrapper.getBoundingClientRect();
  const imgRect = img.getBoundingClientRect();

  console.log("📦 Wrapper 位置:", {
    left: wrapperRect.left,
    top: wrapperRect.top,
    width: wrapperRect.width,
    height: wrapperRect.height
  });
  console.log("🖼️ 图片位置:", {
    left: imgRect.left,
    top: imgRect.top,
    width: imgRect.width,
    height: imgRect.height
  });
  console.log("📜 编辑器滚动:", editorWrapper.scrollTop);

  // 创建工具栏容器
  const toolbar = document.createElement("div");
  toolbar.className = "image-toolbar";
  toolbar.style.position = "absolute";
  // 计算相对于 editor-wrapper 的位置
  const toolbarLeft = imgRect.left - wrapperRect.left + imgRect.width / 2;
  const toolbarTop =
    imgRect.top - wrapperRect.top + editorWrapper.scrollTop - 50;
  toolbar.style.left = `${toolbarLeft}px`;
  toolbar.style.top = `${toolbarTop}px`;
  toolbar.style.transform = "translateX(-50%)";

  console.log("🎯 工具栏计算位置:", {
    left: toolbarLeft,
    top: toolbarTop
  });

  // 获取当前图片的对齐方式
  const getCurrentAlign = () => {
    if (!editor.value || !selectedImage.value) return "center";
    const { state } = editor.value;
    let align = "center";

    state.doc.descendants((node, nodePos) => {
      if (node.type.name === "customImage") {
        const dom = editor.value?.view.nodeDOM(nodePos);
        // dom 可能是 figure 或 img
        let isMatch = false;
        if (dom === img) {
          isMatch = true;
        } else if (dom instanceof HTMLElement) {
          const domImg = dom.querySelector("img");
          if (domImg === img) {
            isMatch = true;
          }
        }

        if (isMatch) {
          align = node.attrs.align || "center";
          return false;
        }
      }
    });

    return align;
  };

  const currentAlign = getCurrentAlign();

  // 创建对齐按钮
  const alignButtons = [
    { align: "left", icon: "align-left", title: "左对齐" },
    { align: "center", icon: "align-center", title: "居中对齐" },
    { align: "right", icon: "align-right", title: "右对齐" }
  ];

  alignButtons.forEach(({ align, icon, title }) => {
    const button = document.createElement("button");
    button.className = `toolbar-btn ${currentAlign === align ? "active" : ""}`;
    button.title = title;
    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        ${
          align === "left"
            ? '<line x1="17" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="17" y1="18" x2="3" y2="18"></line>'
            : align === "center"
              ? '<line x1="18" y1="10" x2="6" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="18" y1="18" x2="6" y2="18"></line>'
              : '<line x1="21" y1="10" x2="7" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="7" y2="18"></line>'
        }
      </svg>
    `;

    button.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();

      console.log(`🎨 ======== 设置图片对齐: ${align} ========`);

      // 更新图片对齐
      if (editor.value && selectedImage.value) {
        console.log("📝 当前选中的图片:", selectedImage.value);
        console.log("📝 图片当前 className:", selectedImage.value.className);

        // 先找到当前图片对应的节点位置
        const { state } = editor.value;
        let pos = -1;

        state.doc.descendants((node, nodePos) => {
          if (node.type.name === "customImage") {
            const dom = editor.value?.view.nodeDOM(nodePos);
            // dom 可能是 figure 或 img
            let isMatch = false;
            if (dom === selectedImage.value) {
              isMatch = true;
            } else if (dom instanceof HTMLElement) {
              const img = dom.querySelector("img");
              if (img === selectedImage.value) {
                isMatch = true;
              }
            }

            if (isMatch) {
              pos = nodePos;
              console.log("📍 找到图片节点，当前 align:", node.attrs.align);
              return false;
            }
          }
        });

        if (pos >= 0) {
          console.log("⏳ 找到节点位置:", pos, "设置对齐:", align);

          // 记录对齐前的图片位置
          const beforeRect = selectedImage.value.getBoundingClientRect();
          console.log("📐 对齐前图片位置:", {
            left: beforeRect.left,
            top: beforeRect.top,
            width: beforeRect.width,
            height: beforeRect.height
          });

          // 先选中节点，再更新属性
          editor.value.commands.setNodeSelection(pos);
          (editor.value.chain().focus() as any).setImageAlign(align).run();
          console.log("✅ setImageAlign 调用完成");

          // 等待 DOM 更新和布局完成后重新获取图片元素并更新位置
          // 使用 setTimeout 给浏览器足够的时间完成布局计算
          setTimeout(() => {
            console.log("⏰ 对齐更新后 - 开始更新位置");

            // 重新获取更新后的图片元素
            const updatedDom = editor.value?.view.nodeDOM(pos);
            let updatedImg: HTMLImageElement | null = null;

            if (updatedDom instanceof HTMLImageElement) {
              updatedImg = updatedDom;
              console.log("✅ updatedDom 是 img 元素");
            } else if (updatedDom instanceof HTMLElement) {
              updatedImg = updatedDom.querySelector("img");
              console.log("✅ updatedDom 是容器，提取了 img");
            }

            if (updatedImg) {
              const afterRect = updatedImg.getBoundingClientRect();
              console.log("📐 对齐后图片位置:", {
                left: afterRect.left,
                top: afterRect.top,
                width: afterRect.width,
                height: afterRect.height
              });

              // 手动加载图片（如果有 data-src）
              const dataSrc = updatedImg.getAttribute("data-src");
              if (dataSrc && updatedImg.src !== dataSrc) {
                console.log("🖼️ 手动加载对齐后的图片");
                updatedImg.src = dataSrc;
                updatedImg.classList.add("lazy-loaded");
              }

              // 重新触发图片点击事件，让它重新创建手柄和工具栏
              // 这比手动更新位置更可靠，因为图片元素已经被重新渲染
              console.log("🔄 重新触发图片点击事件");
              updatedImg.click();
              console.log("✅ 手柄和工具栏已通过点击事件重新创建");
            } else {
              console.warn("⚠️ 未找到更新后的图片元素");
            }
          }, 50); // 50ms 足够浏览器完成布局
        } else {
          console.warn("❌ 未找到节点位置");
        }
      }
    });

    toolbar.appendChild(button);
  });

  // 添加分割线
  const divider = document.createElement("div");
  divider.className = "toolbar-divider";
  divider.style.width = "1px";
  divider.style.height = "20px";
  divider.style.margin = "0 4px";
  divider.style.background = "var(--anzhiyu-border-color)";
  toolbar.appendChild(divider);

  // 创建编辑按钮
  const editButton = document.createElement("button");
  editButton.className = "toolbar-btn";
  editButton.title = "编辑图片";
  editButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  `;

  editButton.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();
    openImageEditDialog();
  });

  toolbar.appendChild(editButton);

  editorWrapper.appendChild(toolbar);
  imageToolbar.value = toolbar;
  console.log("🎨 创建图片工具栏");

  // 确保按钮状态正确
  nextTick(() => {
    updateToolbarButtonState();
  });
};

// 更新工具栏按钮状态
const updateToolbarButtonState = () => {
  if (!imageToolbar.value || !editor.value || !selectedImage.value) return;

  const { state } = editor.value;
  let currentAlign = "center";

  // 查找当前图片的对齐方式
  state.doc.descendants((node, nodePos) => {
    if (node.type.name === "customImage") {
      const dom = editor.value?.view.nodeDOM(nodePos);
      // dom 可能是 figure 或 img，需要判断
      let isMatch = false;
      if (dom === selectedImage.value) {
        isMatch = true;
      } else if (dom instanceof HTMLElement) {
        // 如果 dom 是 figure，检查其中是否包含当前选中的 img
        const img = dom.querySelector("img");
        if (img === selectedImage.value) {
          isMatch = true;
        }
      }

      if (isMatch) {
        currentAlign = node.attrs.align || "center";
        return false;
      }
    }
  });

  console.log("📊 当前对齐方式:", currentAlign);

  // 更新所有按钮状态
  const buttons = imageToolbar.value.querySelectorAll(".toolbar-btn");
  buttons.forEach((btn, index) => {
    const alignTypes = ["left", "center", "right"];
    if (alignTypes[index] === currentAlign) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
};

// 更新工具栏位置
const updateToolbarPosition = () => {
  console.log("🔄 更新工具栏位置");
  if (!imageToolbar.value || !selectedImage.value) {
    console.warn("⚠️ 工具栏或图片不存在");
    return;
  }

  const editorWrapper = selectedImage.value.closest(".editor-wrapper");
  if (!editorWrapper) {
    console.warn("⚠️ 未找到 editor-wrapper");
    return;
  }

  const wrapperRect = editorWrapper.getBoundingClientRect();
  const imgRect = selectedImage.value.getBoundingClientRect();

  console.log("📦 Wrapper 位置:", {
    left: wrapperRect.left,
    top: wrapperRect.top
  });
  console.log("🖼️ 图片位置:", {
    left: imgRect.left,
    top: imgRect.top,
    width: imgRect.width,
    height: imgRect.height
  });

  const toolbarLeft = imgRect.left - wrapperRect.left + imgRect.width / 2;
  const toolbarTop =
    imgRect.top - wrapperRect.top + editorWrapper.scrollTop - 50;
  imageToolbar.value.style.left = `${toolbarLeft}px`;
  imageToolbar.value.style.top = `${toolbarTop}px`;

  console.log("🎯 工具栏更新后位置:", {
    left: toolbarLeft,
    top: toolbarTop
  });
};

// 创建调整手柄
const createResizeHandles = (img: HTMLImageElement) => {
  console.log("🎯 ======== 开始创建调整手柄 ========");
  console.log("🖼️ 目标图片:", img);
  console.log("📝 图片 className:", img.className);
  cleanupImageEdit();

  selectedImage.value = img;
  img.classList.add("image-selected");

  const editorWrapper = img.closest(".editor-wrapper");
  if (!editorWrapper) {
    console.warn("⚠️ 未找到 editor-wrapper 元素");
    return;
  }

  const corners = ["nw", "ne", "sw", "se"];
  const wrapperRect = editorWrapper.getBoundingClientRect();
  const imgRect = img.getBoundingClientRect();
  const scrollTop = editorWrapper.scrollTop;

  console.log("📦 Wrapper 位置:", {
    left: wrapperRect.left,
    top: wrapperRect.top,
    width: wrapperRect.width,
    height: wrapperRect.height
  });
  console.log("🖼️ 图片位置:", {
    left: imgRect.left,
    top: imgRect.top,
    right: imgRect.right,
    bottom: imgRect.bottom,
    width: imgRect.width,
    height: imgRect.height
  });
  console.log("📜 编辑器滚动:", scrollTop);

  // 创建工具栏
  createImageToolbar(img);

  corners.forEach(corner => {
    const handle = document.createElement("div");
    handle.className = `image-resize-handle image-resize-handle-${corner}`;
    handle.style.position = "absolute";

    // 设置手柄位置（相对于 editor-wrapper）
    let handleTop = 0;
    let handleLeft = 0;

    switch (corner) {
      case "nw":
        handleTop = imgRect.top - wrapperRect.top + scrollTop;
        handleLeft = imgRect.left - wrapperRect.left;
        break;
      case "ne":
        handleTop = imgRect.top - wrapperRect.top + scrollTop;
        handleLeft = imgRect.right - wrapperRect.left;
        break;
      case "sw":
        handleTop = imgRect.bottom - wrapperRect.top + scrollTop;
        handleLeft = imgRect.left - wrapperRect.left;
        break;
      case "se":
        handleTop = imgRect.bottom - wrapperRect.top + scrollTop;
        handleLeft = imgRect.right - wrapperRect.left;
        break;
    }

    handle.style.top = `${handleTop}px`;
    handle.style.left = `${handleLeft}px`;

    // 添加拖拽事件
    handle.addEventListener("mousedown", e =>
      handleResizeStart(e, corner, img)
    );

    editorWrapper.appendChild(handle);
    resizeHandles.value.push(handle);
    console.log(`✅ 创建手柄 ${corner}:`, {
      top: handleTop,
      left: handleLeft,
      计算:
        corner === "nw"
          ? "左上"
          : corner === "ne"
            ? "右上"
            : corner === "sw"
              ? "左下"
              : "右下"
    });
  });

  console.log(`🎉 共创建 ${resizeHandles.value.length} 个手柄`);
};

// 创建预览框
const createPreviewBox = (img: HTMLImageElement) => {
  const editorWrapper = img.closest(".editor-wrapper");
  if (!editorWrapper) {
    console.warn("⚠️ 未找到 editor-wrapper 元素");
    return null;
  }

  const box = document.createElement("div");
  box.className = "image-resize-preview";
  box.style.position = "absolute";
  box.style.border = "2px dashed var(--anzhiyu-main)";
  box.style.background = "rgba(74, 144, 226, 0.1)";
  box.style.pointerEvents = "none";
  box.style.zIndex = "999";

  const wrapperRect = editorWrapper.getBoundingClientRect();
  const imgRect = img.getBoundingClientRect();
  const scrollTop = editorWrapper.scrollTop;

  box.style.top = `${imgRect.top - wrapperRect.top + scrollTop}px`;
  box.style.left = `${imgRect.left - wrapperRect.left}px`;
  box.style.width = `${imgRect.width}px`;
  box.style.height = `${imgRect.height}px`;

  editorWrapper.appendChild(box);
  return box;
};

// 开始调整大小
const handleResizeStart = (
  e: MouseEvent,
  corner: string,
  img: HTMLImageElement
) => {
  e.preventDefault();
  e.stopPropagation();

  const startX = e.clientX;
  const startY = e.clientY;
  const startWidth = img.offsetWidth;
  const startHeight = img.offsetHeight;
  const aspectRatio = startHeight / startWidth;
  const imgRect = img.getBoundingClientRect();

  // 创建预览框
  previewBox.value = createPreviewBox(img);

  // 禁用文本选择
  document.body.style.userSelect = "none";

  const editorWrapper = img.closest(".editor-wrapper");
  if (!editorWrapper) return;

  const wrapperRect = editorWrapper.getBoundingClientRect();
  const scrollTop = editorWrapper.scrollTop;

  const onMouseMove = (e: MouseEvent) => {
    if (!previewBox.value) return;

    let deltaX = 0;
    let deltaY = 0;

    // 根据拖动的角计算增量
    switch (corner) {
      case "se": // 右下角
        deltaX = e.clientX - startX;
        deltaY = e.clientY - startY;
        break;
      case "sw": // 左下角
        deltaX = -(e.clientX - startX);
        deltaY = e.clientY - startY;
        break;
      case "ne": // 右上角
        deltaX = e.clientX - startX;
        deltaY = -(e.clientY - startY);
        break;
      case "nw": // 左上角
        deltaX = -(e.clientX - startX);
        deltaY = -(e.clientY - startY);
        break;
    }

    // 使用变化较大的方向作为基准，保持宽高比
    const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
    const newWidth = Math.max(100, startWidth + delta);
    const newHeight = Math.round(newWidth * aspectRatio);

    // 更新预览框位置和大小
    previewBox.value.style.width = `${newWidth}px`;
    previewBox.value.style.height = `${newHeight}px`;

    // 根据角落调整预览框位置（相对于 editor-wrapper）
    if (corner.includes("w")) {
      // 左侧角落需要调整left位置
      previewBox.value.style.left = `${imgRect.right - wrapperRect.left - newWidth}px`;
    }
    if (corner.includes("n")) {
      // 上侧角落需要调整top位置
      previewBox.value.style.top = `${imgRect.bottom - wrapperRect.top + scrollTop - newHeight}px`;
    }
  };

  const onMouseUp = () => {
    console.log("松开鼠标");

    // 恢复文本选择
    document.body.style.userSelect = "";

    // 移除事件监听
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);

    if (!previewBox.value) return;

    // 获取新尺寸，确保是有效的数字
    const newWidth = parseInt(previewBox.value.style.width) || 0;
    const newHeight = parseInt(previewBox.value.style.height) || 0;

    // 验证尺寸有效性
    if (
      newWidth <= 0 ||
      newHeight <= 0 ||
      isNaN(newWidth) ||
      isNaN(newHeight)
    ) {
      console.warn("❌ 无效的尺寸值:", newWidth, "x", newHeight);
      // 清理预览框
      if (previewBox.value.parentNode) {
        previewBox.value.parentNode.removeChild(previewBox.value);
      }
      previewBox.value = null;
      return;
    }

    console.log("📦 准备应用新尺寸:", newWidth, "x", newHeight);

    // 立即移除预览框
    try {
      if (previewBox.value.parentNode) {
        previewBox.value.parentNode.removeChild(previewBox.value);
      }
      previewBox.value = null;
      console.log("✅ 预览框已立即移除");
    } catch (error) {
      console.error("❌ 移除预览框失败:", error);
    }

    // 应用最终尺寸到图片
    if (editor.value) {
      // 找到图片在编辑器中的位置
      const { state } = editor.value;
      let pos = -1;

      state.doc.descendants((node, nodePos) => {
        if (node.type.name === "customImage") {
          const dom = editor.value?.view.nodeDOM(nodePos);
          // dom 可能是 figure 或 img
          let isMatch = false;
          if (dom === img) {
            isMatch = true;
          } else if (dom instanceof HTMLElement) {
            const domImg = dom.querySelector("img");
            if (domImg === img) {
              isMatch = true;
            }
          }

          if (isMatch) {
            pos = nodePos;
            return false;
          }
        }
      });

      if (pos >= 0) {
        console.log("💾 应用尺寸:", newWidth, "x", newHeight);

        // 应用新尺寸（不要提前清理，等点击事件时会自动清理和重建）
        console.log("⏳ 调用 setImageSize...");
        editor.value.commands.setNodeSelection(pos);
        (editor.value.chain().focus() as any)
          .setImageSize({ width: newWidth, height: newHeight })
          .run();
        console.log("✅ setImageSize 调用完成");

        // 等待 DOM 更新完成后，重新触发图片点击事件
        // 使用 setTimeout 给浏览器足够的时间完成布局计算
        setTimeout(() => {
          console.log("⏰ 调整大小后 - 开始重建手柄");

          // 重新获取更新后的 DOM 元素引用
          const updatedDom = editor.value?.view.nodeDOM(pos);
          console.log(
            "📦 updatedDom 类型:",
            updatedDom instanceof HTMLElement ? updatedDom.tagName : "unknown",
            updatedDom instanceof HTMLElement ? updatedDom.className : ""
          );
          let updatedImg: HTMLImageElement | null = null;

          if (updatedDom instanceof HTMLImageElement) {
            updatedImg = updatedDom;
            console.log("✅ updatedDom 是 img 元素");
          } else if (updatedDom instanceof HTMLElement) {
            // 如果是 figure，提取其中的 img
            updatedImg = updatedDom.querySelector("img");
            console.log(
              "✅ updatedDom 是容器，img:",
              updatedImg?.src?.slice(-20)
            );
          }

          if (updatedImg) {
            const rect = updatedImg.getBoundingClientRect();
            const imgStyle = window.getComputedStyle(updatedImg);
            console.log("📐 调整后图片位置:", {
              width: rect.width,
              height: rect.height,
              imgWidth: updatedImg.width,
              imgHeight: updatedImg.height,
              styleWidth: imgStyle.width,
              styleHeight: imgStyle.height
            });

            // 手动加载图片（如果有 data-src）
            const dataSrc = updatedImg.getAttribute("data-src");
            if (dataSrc && updatedImg.src !== dataSrc) {
              console.log("🖼️ 手动加载调整尺寸后的图片");
              updatedImg.src = dataSrc;
              updatedImg.classList.add("lazy-loaded");
            }

            console.log("🔄 重新触发图片点击事件");
            // 手动触发点击事件，重新初始化手柄
            updatedImg.click();
            console.log("✅ 手柄已通过点击事件重新创建");
          } else {
            console.warn("⚠️ 未找到更新后的图片元素");
          }
        }, 50); // 50ms 足够浏览器完成布局
      }
    }
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};

// 更新手柄位置的通用函数
const updateHandlePositions = (immediate = false) => {
  console.log("🔄 ======== 更新手柄位置 ========");
  console.log("⚡ immediate模式:", immediate);

  if (!selectedImage.value) {
    console.warn("⚠️ selectedImage 不存在");
    return;
  }

  const editorWrapper = selectedImage.value.closest(".editor-wrapper");
  if (!editorWrapper) {
    console.warn("⚠️ 未找到 editor-wrapper");
    return;
  }

  const wrapperRect = editorWrapper.getBoundingClientRect();
  const imgRect = selectedImage.value.getBoundingClientRect();
  const scrollTop = editorWrapper.scrollTop;

  console.log("📦 Wrapper 位置:", {
    left: wrapperRect.left,
    top: wrapperRect.top
  });
  console.log("🖼️ 图片位置:", {
    left: imgRect.left,
    top: imgRect.top,
    right: imgRect.right,
    bottom: imgRect.bottom,
    width: imgRect.width,
    height: imgRect.height
  });
  console.log("📜 编辑器滚动:", scrollTop);
  console.log("🔢 手柄数量:", resizeHandles.value.length);

  resizeHandles.value.forEach((handle, index) => {
    // 如果需要立即更新（无动画），临时禁用过渡效果
    if (immediate) {
      handle.style.transition = "none";
    }

    const corner = ["nw", "ne", "sw", "se"][index];
    let handleTop = 0;
    let handleLeft = 0;

    switch (corner) {
      case "nw":
        handleTop = imgRect.top - wrapperRect.top + scrollTop;
        handleLeft = imgRect.left - wrapperRect.left;
        break;
      case "ne":
        handleTop = imgRect.top - wrapperRect.top + scrollTop;
        handleLeft = imgRect.right - wrapperRect.left;
        break;
      case "sw":
        handleTop = imgRect.bottom - wrapperRect.top + scrollTop;
        handleLeft = imgRect.left - wrapperRect.left;
        break;
      case "se":
        handleTop = imgRect.bottom - wrapperRect.top + scrollTop;
        handleLeft = imgRect.right - wrapperRect.left;
        break;
    }

    handle.style.top = `${handleTop}px`;
    handle.style.left = `${handleLeft}px`;

    console.log(`✅ 更新手柄 ${corner}:`, {
      top: handleTop,
      left: handleLeft
    });

    // 如果禁用了过渡效果，需要在下一帧重新启用
    if (immediate) {
      requestAnimationFrame(() => {
        handle.style.transition = "";
      });
    }
  });

  // 同时更新工具栏位置和按钮状态
  updateToolbarPosition();
  updateToolbarButtonState();
};

// 监听编辑器内的图片点击
const setupImageClickListener = () => {
  nextTick(() => {
    const editorElement = document.querySelector(".frontend-editor-content");
    if (!editorElement) {
      console.warn("⚠️ 未找到编辑器元素 .frontend-editor-content");
      return;
    }

    console.log("✅ 已设置图片点击监听器");

    // 监听点击事件（使用事件委托）
    editorElement.addEventListener("click", (e: Event) => {
      const target = e.target as HTMLElement;
      console.log("点击目标:", target.tagName, target.className);

      // 如果点击的是 article-image
      if (target.classList.contains("article-image")) {
        console.log("🖼️ 点击了图片");
        e.preventDefault();
        e.stopPropagation();
        createResizeHandles(target as HTMLImageElement);
      } else if (target.tagName === "FIGCAPTION") {
        // 如果点击的是 figcaption，触发其父 figure 中的 img
        console.log("📝 点击了 figcaption");
        const figure = target.closest("figure");
        if (figure) {
          const img = figure.querySelector("img.article-image");
          if (img) {
            console.log("🖼️ 找到 figure 中的图片，触发选择");
            e.preventDefault();
            e.stopPropagation();
            createResizeHandles(img as HTMLImageElement);
          }
        }
      } else if (target.tagName === "FIGURE") {
        // 如果点击的是 figure 本身，也触发图片选择
        console.log("🖼️ 点击了 figure");
        const img = target.querySelector("img.article-image");
        if (img) {
          console.log("🖼️ 找到 figure 中的图片，触发选择");
          e.preventDefault();
          e.stopPropagation();
          createResizeHandles(img as HTMLImageElement);
        }
      } else {
        // 点击其他地方，清理编辑状态（但如果编辑对话框打开，则不清理）
        if (!imageEditDialogVisible.value) {
          console.log("👆 点击了其他地方，清理编辑状态");
          cleanupImageEdit();
        }
      }
    });

    // 监听编辑器内部滚动事件，更新手柄位置
    let scrollTimer: number | null = null;
    editorElement.addEventListener("scroll", () => {
      if (!selectedImage.value) return;

      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }

      // 暂时隐藏手柄和工具栏
      resizeHandles.value.forEach(handle => {
        handle.style.opacity = "0";
      });
      if (imageToolbar.value) {
        imageToolbar.value.style.opacity = "0";
      }

      scrollTimer = window.setTimeout(() => {
        updateHandlePositions();
        resizeHandles.value.forEach(handle => {
          handle.style.opacity = "1";
        });
        if (imageToolbar.value) {
          imageToolbar.value.style.opacity = "1";
        }
      }, 100);
    });
  });
};

// 销毁编辑器
onBeforeUnmount(() => {
  cleanupImageEdit();

  // 清理懒加载资源
  cleanupLazyLoad();

  if (editor.value) {
    try {
      editor.value.destroy();
    } catch (error) {
      console.warn("Failed to destroy editor:", error);
    }
  }
});
</script>

<template>
  <div class="frontend-editor">
    <!-- 工具栏 -->
    <div v-if="!readonly && editor" class="editor-toolbar">
      <div class="toolbar-group">
        <button
          v-tippy="'一级标题'"
          :class="{ 'is-active': isActive('heading', { level: 1 }) }"
          @click="setHeading(1)"
        >
          <span class="icon-text">H1</span>
        </button>
        <button
          v-tippy="'二级标题'"
          :class="{ 'is-active': isActive('heading', { level: 2 }) }"
          @click="setHeading(2)"
        >
          <span class="icon-text">H2</span>
        </button>
        <button
          v-tippy="'三级标题'"
          :class="{ 'is-active': isActive('heading', { level: 3 }) }"
          @click="setHeading(3)"
        >
          <span class="icon-text">H3</span>
        </button>
      </div>

      <div class="toolbar-divider" />

      <div class="toolbar-group">
        <button
          v-tippy="'粗体'"
          :class="{ 'is-active': isActive('bold') }"
          @click="toggleBold"
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
            <path
              d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"
            />
          </svg>
        </button>
        <button
          v-tippy="'斜体'"
          :class="{ 'is-active': isActive('italic') }"
          @click="toggleItalic"
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
            <line x1="19" x2="10" y1="4" y2="4" />
            <line x1="14" x2="5" y1="20" y2="20" />
            <line x1="15" x2="9" y1="4" y2="20" />
          </svg>
        </button>
        <button
          v-tippy="'下划线'"
          :class="{ 'is-active': isActive('underline') }"
          @click="toggleUnderline"
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
            <path d="M6 4v6a6 6 0 0 0 12 0V4" />
            <line x1="4" x2="20" y1="20" y2="20" />
          </svg>
        </button>
        <button
          v-tippy="'删除线'"
          :class="{ 'is-active': isActive('strike') }"
          @click="toggleStrike"
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
            <path d="M16 4H9a3 3 0 0 0-2.83 4" />
            <path d="M14 12a4 4 0 0 1 0 8H6" />
            <line x1="4" x2="20" y1="12" y2="12" />
          </svg>
        </button>
      </div>

      <div class="toolbar-divider" />

      <div class="toolbar-group">
        <button
          v-tippy="'无序列表'"
          :class="{ 'is-active': isActive('bulletList') }"
          @click="toggleBulletList"
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
            <path d="M3 12h.01" />
            <path d="M3 18h.01" />
            <path d="M3 6h.01" />
            <path d="M8 12h13" />
            <path d="M8 18h13" />
            <path d="M8 6h13" />
          </svg>
        </button>
        <button
          v-tippy="'有序列表'"
          :class="{ 'is-active': isActive('orderedList') }"
          @click="toggleOrderedList"
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
            <path d="M10 12h11" />
            <path d="M10 18h11" />
            <path d="M10 6h11" />
            <path d="M4 10h2" />
            <path d="M4 6h1v4" />
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
          </svg>
        </button>
        <button
          v-tippy="'引用'"
          :class="{ 'is-active': isActive('blockquote') }"
          @click="toggleBlockquote"
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
            <path
              d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"
            />
            <path
              d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"
            />
          </svg>
        </button>
        <button
          v-tippy="'代码块'"
          :class="{ 'is-active': isActive('codeBlock') }"
          @click="toggleCodeBlock"
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
            <path d="M10 9.5 8 12l2 2.5" />
            <path d="m14 9.5 2 2.5-2 2.5" />
            <rect width="18" height="18" x="3" y="3" rx="2" />
          </svg>
        </button>
      </div>

      <div class="toolbar-divider" />

      <div class="toolbar-group">
        <button
          v-tippy="'左对齐'"
          :class="{ 'is-active': isActive({ textAlign: 'left' }) }"
          @click="setTextAlign('left')"
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
            <line x1="21" x2="3" y1="6" y2="6" />
            <line x1="15" x2="3" y1="12" y2="12" />
            <line x1="17" x2="3" y1="18" y2="18" />
          </svg>
        </button>
        <button
          v-tippy="'居中'"
          :class="{ 'is-active': isActive({ textAlign: 'center' }) }"
          @click="setTextAlign('center')"
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
            <line x1="21" x2="3" y1="6" y2="6" />
            <line x1="17" x2="7" y1="12" y2="12" />
            <line x1="19" x2="5" y1="18" y2="18" />
          </svg>
        </button>
        <button
          v-tippy="'右对齐'"
          :class="{ 'is-active': isActive({ textAlign: 'right' }) }"
          @click="setTextAlign('right')"
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
            <line x1="21" x2="3" y1="6" y2="6" />
            <line x1="21" x2="9" y1="12" y2="12" />
            <line x1="21" x2="7" y1="18" y2="18" />
          </svg>
        </button>
      </div>

      <div class="toolbar-divider" />

      <div class="toolbar-group">
        <button v-tippy="'插入图片'" @click="openImageInsertDialog">
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
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>
        <button
          v-tippy="'添加链接'"
          :class="{ 'is-active': isActive('link') }"
          @click="addLink"
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
            <path
              d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
            />
            <path
              d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
            />
          </svg>
        </button>
        <button
          v-if="isActive('link')"
          v-tippy="'移除链接'"
          @click="removeLink"
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
            <path
              d="m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71"
            />
            <path
              d="m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71"
            />
            <line x1="8" x2="8" y1="2" y2="5" />
            <line x1="2" x2="5" y1="8" y2="8" />
            <line x1="16" x2="16" y1="19" y2="22" />
            <line x1="19" x2="22" y1="16" y2="16" />
          </svg>
        </button>
      </div>

      <div class="toolbar-divider" />

      <div class="toolbar-group">
        <button v-tippy="'付费内容'" @click="openPaidContentDialog">
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
            <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
            <path d="M12 18V6" />
          </svg>
        </button>
        <button v-tippy="'密码保护'" @click="openPasswordContentDialog">
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
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </button>
        <button
          v-tippy="'登录后可查看'"
          @click="openLoginRequiredContentDialog"
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
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </div>

      <div class="toolbar-divider" />

      <div class="toolbar-group">
        <button v-tippy="'撤销'" @click="undo">
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
            <polyline points="9 17 4 12 9 7" />
            <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
          </svg>
        </button>
        <button v-tippy="'重做'" @click="redo">
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
            <polyline points="15 17 20 12 15 7" />
            <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 编辑区域 -->
    <EditorContent :editor="editor" class="editor-wrapper" />

    <!-- 链接插入对话框 -->
    <AnDialog
      v-model="linkDialogVisible"
      title="插入链接"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="linkForm" label-width="100px">
        <el-form-item label="链接描述">
          <el-input
            v-model="linkForm.text"
            placeholder="请输入链接描述（可选）"
            clearable
          />
          <div
            style="
              margin-top: 8px;
              font-size: 12px;
              color: var(--anzhiyu-secondtext);
            "
          >
            如果不填写，将使用链接地址作为显示文本
          </div>
        </el-form-item>

        <el-form-item label="链接地址">
          <el-input
            v-model="linkForm.url"
            placeholder="请输入链接地址（如：https://example.com）"
            clearable
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancelLink">取消</el-button>
          <el-button type="primary" @click="handleInsertLink">插入</el-button>
        </div>
      </template>
    </AnDialog>

    <!-- 图片插入对话框 -->
    <el-dialog
      v-model="imageInsertDialogVisible"
      title="插入图片"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-radio-group v-model="imageUploadMode" style="margin-bottom: 20px">
        <el-radio-button value="url">图片链接</el-radio-button>
        <el-radio-button value="upload">上传图片</el-radio-button>
      </el-radio-group>

      <div v-if="imageUploadMode === 'url'">
        <el-input
          v-model="imageInsertForm.url"
          placeholder="请输入图片链接（如：https://example.com/image.jpg）"
          clearable
        />
      </div>

      <div v-else>
        <el-upload
          :auto-upload="false"
          :show-file-list="true"
          :limit="1"
          accept="image/*"
          :on-change="handleImageFileChange"
          drag
        >
          <div class="upload-content">
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
              style="margin-bottom: 10px; color: var(--anzhiyu-main)"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <div style="color: var(--anzhiyu-fontcolor)">
              点击或拖拽图片到此处上传
            </div>
            <div
              style="
                margin-top: 8px;
                font-size: 12px;
                color: var(--anzhiyu-secondtext);
              "
            >
              支持 JPG、PNG、GIF 格式，大小不超过 5MB
            </div>
          </div>
        </el-upload>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelImageInsert">取消</el-button>
          <el-button
            type="primary"
            :loading="isUploadingImage"
            @click="insertImage"
          >
            {{ isUploadingImage ? "上传中..." : "插入" }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 图片编辑对话框 -->
    <el-dialog
      v-model="imageEditDialogVisible"
      title="编辑图片"
      width="600px"
      :close-on-click-modal="false"
      @close="onImageEditDialogClose"
    >
      <el-form :model="imageEditForm" label-width="100px">
        <el-form-item label="图片来源">
          <el-input
            v-model="imageEditForm.src"
            placeholder="请输入图片URL"
            clearable
          />
        </el-form-item>

        <el-form-item label="图片说明">
          <el-input
            v-model="imageEditForm.alt"
            placeholder="请输入图片说明（alt属性）"
            clearable
          />
        </el-form-item>

        <el-form-item label="图片标题">
          <el-input
            v-model="imageEditForm.title"
            placeholder="请输入图片标题（鼠标悬停显示）"
            clearable
          />
        </el-form-item>

        <el-form-item label="图片描述">
          <el-input
            v-model="imageEditForm.caption"
            placeholder="请输入图片描述（显示在图片下方）"
            type="textarea"
            :rows="2"
            clearable
          />
        </el-form-item>

        <el-form-item label="图片尺寸">
          <div class="size-inputs">
            <el-input-number
              v-model="imageEditForm.width"
              :min="0"
              placeholder="宽度"
              controls-position="right"
              @change="onWidthChange"
            />
            <span class="size-separator">×</span>
            <el-input-number
              v-model="imageEditForm.height"
              :min="0"
              placeholder="高度"
              controls-position="right"
              @change="onHeightChange"
            />
          </div>
        </el-form-item>

        <el-form-item label="保持比例">
          <el-switch v-model="imageEditForm.keepAspectRatio" />
          <span style="margin-left: 10px; color: var(--anzhiyu-secondtext)">
            开启后调整宽度或高度将自动调整另一维度
          </span>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelImageEdit">取消</el-button>
          <el-button type="primary" @click="saveImageEdit">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 付费内容插入对话框 -->
    <AnDialog
      v-model="paidContentDialogVisible"
      :title="isEditingPaidContent ? '编辑付费内容' : '插入付费内容'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="paidContentForm" label-width="100px">
        <el-form-item label="内容标题">
          <el-input
            v-model="paidContentForm.title"
            placeholder="请输入付费内容标题"
            clearable
          />
        </el-form-item>

        <el-form-item label="币种">
          <el-input
            v-model="paidContentForm.currency"
            placeholder="例如：¥、$、€、£"
            clearable
            style="width: 100%"
          />
          <div
            style="
              margin-top: 8px;
              font-size: 12px;
              color: var(--anzhiyu-secondtext);
            "
          >
            常用币种符号：¥ (人民币)、$ (美元)、€ (欧元)、£ (英镑)
          </div>
        </el-form-item>

        <el-form-item label="价格" required>
          <el-input-number
            v-model="paidContentForm.price"
            :min="0"
            :precision="2"
            :step="1"
            placeholder="请输入价格"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="原价">
          <el-input-number
            v-model="paidContentForm.originalPrice"
            :min="0"
            :precision="2"
            :step="1"
            placeholder="选填，用于展示优惠价格"
            controls-position="right"
            style="width: 100%"
          />
          <div
            style="
              margin-top: 8px;
              font-size: 12px;
              color: var(--anzhiyu-secondtext);
            "
          >
            如果设置原价，将显示为：
            <span style="color: var(--anzhiyu-red)">
              {{ paidContentForm.currency }}{{ paidContentForm.price }}
            </span>
            <span style="text-decoration: line-through">
              {{ paidContentForm.currency
              }}{{ paidContentForm.originalPrice || "0" }}
            </span>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelPaidContentInsert">取消</el-button>
          <el-button type="primary" @click="insertPaidContent">
            {{ isEditingPaidContent ? "更新" : "插入" }}
          </el-button>
        </div>
      </template>
    </AnDialog>

    <!-- 密码保护内容插入/编辑对话框 -->
    <AnDialog
      v-model="passwordContentDialogVisible"
      :title="
        isEditingPasswordContent ? '编辑密码保护内容' : '插入密码保护内容'
      "
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="passwordContentForm" label-width="100px">
        <el-form-item label="内容标题">
          <el-input
            v-model="passwordContentForm.title"
            placeholder="请输入内容标题"
            clearable
          />
        </el-form-item>

        <el-form-item label="内容 ID">
          <el-input
            v-model="passwordContentForm.contentId"
            placeholder="内容唯一标识（自动生成）"
            readonly
            disabled
          />
          <div
            style="
              margin-top: 8px;
              font-size: 12px;
              color: var(--anzhiyu-secondtext);
            "
          >
            此 ID 用于标识密码保护的内容，自动生成无需修改
          </div>
        </el-form-item>

        <el-form-item label="访问密码" required>
          <el-input
            v-model="passwordContentForm.password"
            type="password"
            show-password
            placeholder="请设置访问密码"
            clearable
          />
          <div
            style="
              margin-top: 8px;
              font-size: 12px;
              color: var(--anzhiyu-secondtext);
            "
          >
            读者需要输入正确的密码才能查看内容
          </div>
        </el-form-item>

        <el-form-item label="密码提示">
          <el-input
            v-model="passwordContentForm.hint"
            placeholder="请输入密码提示（如：请联系作者获取密码）"
            clearable
          />
        </el-form-item>

        <el-form-item label="占位符">
          <el-input
            v-model="passwordContentForm.placeholder"
            placeholder="密码输入框的占位符文本"
            clearable
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelPasswordContentInsert">取消</el-button>
          <el-button type="primary" @click="insertPasswordContent">
            {{ isEditingPasswordContent ? "保存" : "插入" }}
          </el-button>
        </div>
      </template>
    </AnDialog>

    <!-- 登录后可查看内容插入/编辑对话框 -->
    <AnDialog
      v-model="loginRequiredContentDialogVisible"
      :title="
        isEditingLoginRequiredContent
          ? '编辑登录后可查看内容'
          : '插入登录后可查看内容'
      "
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="loginRequiredContentForm" label-width="100px">
        <el-form-item label="内容标题">
          <el-input
            v-model="loginRequiredContentForm.title"
            placeholder="请输入内容标题"
            clearable
          />
        </el-form-item>

        <el-form-item label="内容 ID">
          <el-input
            v-model="loginRequiredContentForm.contentId"
            placeholder="内容唯一标识（自动生成）"
            readonly
            disabled
          />
          <div
            style="
              margin-top: 8px;
              font-size: 12px;
              color: var(--anzhiyu-secondtext);
            "
          >
            此 ID 用于标识登录后可查看的内容，自动生成无需修改
          </div>
        </el-form-item>

        <el-form-item label="提示信息">
          <el-input
            v-model="loginRequiredContentForm.hint"
            placeholder="请输入提示信息（如：此内容需要登录后才能查看）"
            clearable
          />
          <div
            style="
              margin-top: 8px;
              font-size: 12px;
              color: var(--anzhiyu-secondtext);
            "
          >
            读者在未登录状态下看到的提示信息
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelLoginRequiredContentInsert">取消</el-button>
          <el-button type="primary" @click="insertLoginRequiredContent">
            {{ isEditingLoginRequiredContent ? "保存" : "插入" }}
          </el-button>
        </div>
      </template>
    </AnDialog>
  </div>
</template>

<style lang="scss">
@use "@/style/article-content-base.scss" as *;

.frontend-editor {
  display: flex;
  flex-direction: column;
  width: 100%;
  background: var(--anzhiyu-card-bg);
  border: 1px solid var(--anzhiyu-border-color);
  border-radius: 8px;
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  padding: 12px;
  background: var(--anzhiyu-secondbg);
  border-bottom: 1px solid var(--anzhiyu-border-color);

  .toolbar-group {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .toolbar-divider {
    width: 1px;
    height: 24px;
    margin: 0 4px;
    background: var(--anzhiyu-border-color);
  }

  .toolbar-label {
    margin-right: 4px;
    font-size: 12px;
    font-weight: 600;
    color: var(--anzhiyu-main);
    white-space: nowrap;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    color: var(--anzhiyu-fontcolor);
    cursor: pointer;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;
    transition: all 0.3s;

    &:hover {
      background: var(--anzhiyu-background);
      border-color: var(--anzhiyu-border-color);
    }

    &.is-active {
      color: var(--anzhiyu-white);
      background: var(--anzhiyu-main);
      border-color: var(--anzhiyu-main);
    }

    .icon-text {
      font-size: 14px;
      font-weight: 600;
    }

    svg {
      display: block;
    }
  }
}

.editor-wrapper {
  position: relative;
  flex: 1;
  overflow-y: auto;
}

/* 编辑器内容样式 */
.editor-wrapper .ProseMirror {
  padding: 20px;
  overflow-y: auto;
  outline: none;
  line-height: 1.8;
  word-wrap: break-word;
  overflow-wrap: break-word;

  // 应用文章内容基础样式（包含嵌套规则）
  @include article-content-base;

  /* 占位符样式 */
  .is-editor-empty:first-child::before {
    float: left;
    height: 0;
    color: var(--anzhiyu-secondtext);
    pointer-events: none;
    content: attr(data-placeholder);
  }

  /* 编辑器特定优化：图片不使用放大效果 */
  img:not(a img) {
    cursor: default !important;
  }

  /* PreserveHTML 包装器样式 */
  .preserve-html-wrapper {
    display: contents; /* 让包装器不影响布局 */

    > * {
      margin: 0; /* 移除额外的 margin */
    }
  }
}

/* 修复 ProseMirror-hideselection 导致的文本不可见问题 */
.editor-wrapper .ProseMirror.ProseMirror-hideselection {
  /* 保持正常的文本颜色，不隐藏 */
  * {
    color: inherit !important;
    opacity: 1 !important;
  }

  /* 保持选区可见 */
  ::selection {
    background: var(--anzhiyu-main-op-deep) !important;
    color: inherit !important;
  }

  /* 确保所有文本元素可见 */
  p,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  li,
  blockquote,
  code,
  pre,
  span,
  div,
  a,
  strong,
  em,
  s,
  u {
    color: inherit !important;
    opacity: 1 !important;
  }

  /* 确保代码块内的文本也可见 */
  .md-editor-code-block,
  .hljs {
    * {
      opacity: 1 !important;
    }
  }

  /* 确保自定义内容块内的文本可见 */
  .paid-content-editor-preview,
  .password-content-editor-preview,
  .login-required-content-editor-preview {
    * {
      color: inherit !important;
      opacity: 1 !important;
    }
  }
}

/* 编辑器中的图片样式 - 独占一行 */
.editor-wrapper .ProseMirror .article-image {
  display: block;
  max-width: 100%;
  /* 移除 width: auto 和 height: auto，让 HTML 属性生效 */
  border-radius: 8px;
  transition: all 0.3s;
  cursor: pointer;
  clear: both;
}

/* 选中图片时的高亮效果 */
.editor-wrapper .ProseMirror .article-image.image-selected {
  outline: 3px solid var(--anzhiyu-main) !important;
  outline-offset: 3px !important;
  box-shadow: 0 8px 24px rgba(74, 144, 226, 0.3) !important;
  border-radius: 8px !important;
}

/* 带描述的图片 figure 样式 */
.editor-wrapper .ProseMirror .image-figure {
  display: block;
  width: fit-content; /* 宽度收缩到内容宽度 */
  text-align: center;
  cursor: pointer;
  max-width: 100%;

  img {
    margin: 0;
    max-width: 100%;
    height: auto;
    display: block;
  }

  figcaption {
    margin-top: 0.5rem;
    font-size: 14px;
    color: var(--anzhiyu-secondtext);
    font-style: italic;
    line-height: 1.6;
    text-align: center;
    display: block;
  }

  &:hover {
    figcaption {
      color: var(--anzhiyu-main);
    }
  }
}

/* 图片对齐样式 - 放在 figure 后面以提高优先级 */
.editor-wrapper .ProseMirror .article-image.image-align-left {
  margin: 1.5rem auto 1.5rem 0 !important;
}

.editor-wrapper .ProseMirror .article-image.image-align-center {
  margin: 1.5rem auto !important;
}

.editor-wrapper .ProseMirror .article-image.image-align-right {
  margin: 1.5rem 0 1.5rem auto !important;
}

/* figure 的对齐样式 - 更高优先级 */
.editor-wrapper .ProseMirror .image-figure.image-align-left {
  margin-left: 0 !important;
  margin-right: auto !important;
  margin-top: 1.5rem !important;
  margin-bottom: 1.5rem !important;
}

.editor-wrapper .ProseMirror .image-figure.image-align-center {
  margin-left: auto !important;
  margin-right: auto !important;
  margin-top: 1.5rem !important;
  margin-bottom: 1.5rem !important;
}

.editor-wrapper .ProseMirror .image-figure.image-align-right {
  margin-left: auto !important;
  margin-right: 0 !important;
  margin-top: 1.5rem !important;
  margin-bottom: 1.5rem !important;
}

/* 图片工具栏 */
.image-toolbar {
  position: absolute;
  background: var(--anzhiyu-white);
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  display: flex;
  gap: 4px;
  z-index: 9;
  animation: toolbar-fade-in 0.2s ease-out;
  transition: opacity 0.2s;
}

@keyframes toolbar-fade-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.image-toolbar .toolbar-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--anzhiyu-fontcolor);
}

.image-toolbar .toolbar-btn:hover {
  background: var(--anzhiyu-card-bg);
  transform: scale(1.1);
}

.image-toolbar .toolbar-btn.active {
  background: var(--anzhiyu-main);
  color: var(--anzhiyu-white);
}

.image-toolbar .toolbar-btn:active {
  transform: scale(0.95);
}

/* 动态创建的调整手柄样式（添加到 editor-wrapper 中）*/
.image-resize-handle {
  position: absolute;
  width: 14px;
  height: 14px;
  background: var(--anzhiyu-white);
  border: 3px solid var(--anzhiyu-main);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition:
    all 0.2s,
    opacity 0.2s;
  user-select: none;
  pointer-events: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 1001;
}

.image-resize-handle:hover {
  background: var(--anzhiyu-main);
  transform: translate(-50%, -50%) scale(1.3);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
}

/* 左上角 */
.image-resize-handle-nw {
  cursor: nw-resize;
}

/* 右上角 */
.image-resize-handle-ne {
  cursor: ne-resize;
}

/* 左下角 */
.image-resize-handle-sw {
  cursor: sw-resize;
}

/* 右下角 */
.image-resize-handle-se {
  cursor: se-resize;
}

/* 预览框样式 */
.image-resize-preview {
  position: absolute;
  border-radius: 8px;
  transition: opacity 0.2s;
  z-index: 999;
}

/* 手柄脉动动画 */
@keyframes pulse {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.15);
  }
}

/* 图片编辑对话框样式 */
.size-inputs {
  display: flex;
  align-items: center;
  gap: 8px;

  .size-separator {
    font-size: 18px;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor);
  }

  .el-input-number {
    flex: 1;
  }
}

@media (width <= 768px) {
  .editor-toolbar {
    padding: 8px;

    button {
      width: 28px;
      height: 28px;
    }
  }

  .editor-wrapper :deep(.ProseMirror) {
    padding: 15px;
  }
}

/* 图片上传对话框样式 */
.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

/* ========== 自定义内容块样式（与文章内样式保持一致）========== */

/* 付费内容预览样式 - 与 pro-content-features.scss 保持一致 */
.editor-wrapper .ProseMirror .paid-content-editor-preview {
  margin: 1rem 0;
  overflow: hidden;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border-always);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
  transition: all 0.3s;

  &:hover {
    border-color: var(--anzhiyu-main);
    box-shadow: var(--anzhiyu-shadow-main);
  }

  .paid-content-header {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    padding: 0.75rem 1rem;
    background: var(--anzhiyu-secondbg);
    border-bottom: var(--style-border-always);

    .paid-icon {
      line-height: 1;

      .md-editor-icon,
      svg {
        width: 1.5em;
        height: 1.5em;
        vertical-align: middle;
      }

      svg path[fill="#FFFFFF"] {
        fill: var(--anzhiyu-white);
      }
    }

    .paid-title {
      font-size: 1.05em;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
    }

    .paid-price,
    .paid-price-group {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      margin-left: auto;
    }

    .paid-price,
    .paid-current-price {
      font-size: 1.8em;
      font-weight: 700;
      line-height: 1;
      color: var(--anzhiyu-red);
    }

    .paid-current-price {
      display: flex;
      gap: 2px;
      align-items: baseline;

      .paid-current-price-currency {
        font-size: 0.6em;
        text-align: right;
      }
    }

    .paid-original-price {
      margin-right: 4px;
      font-size: 0.7em;
      font-weight: 400;
      color: var(--anzhiyu-secondtext);
      text-align: right;
      text-decoration: line-through;
      opacity: 0.7;
    }
  }

  .paid-content-body {
    padding: 1rem 1.5rem;

    > :first-child {
      margin-top: 0;
    }

    > :last-child {
      margin-bottom: 0;
    }
  }
}

/* 密码保护内容预览样式 - 与 pro-content-features.scss 保持一致 */
.editor-wrapper .ProseMirror .password-content-editor-preview {
  margin: 1rem 0;
  overflow: hidden;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border-always);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--anzhiyu-main);
  }

  .password-content-header {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    padding: 0.75rem 1rem;
    background: var(--anzhiyu-secondbg);
    border-bottom: var(--style-border-always);

    .password-icon {
      line-height: 1;

      .md-editor-icon,
      svg {
        width: 1.5em;
        height: 1.5em;
        vertical-align: middle;
      }

      svg path[fill="#5470C6"] {
        fill: var(--anzhiyu-main);
      }
    }

    .password-title {
      font-size: 1.05em;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
    }

    .password-badge,
    .password-pro-badge {
      padding: 0.2em 0.6em;
      margin-left: auto;
      font-size: 0.7em;
      font-weight: 700;
      color: var(--anzhiyu-white);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: var(--anzhiyu-main);
      border-radius: 12px;
      box-shadow: var(--anzhiyu-shadow-lightblack);
    }
  }

  .password-content-info {
    display: flex;
    gap: 1rem;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    color: var(--anzhiyu-secondtext);
    background: var(--anzhiyu-background);
    border-bottom: var(--style-border-always);

    .password-hint,
    .password-id {
      display: flex;
      align-items: center;
    }

    .password-id {
      font-family: monospace;
      color: var(--anzhiyu-main);
    }
  }

  .password-content-body {
    padding: 1rem 1.5rem;

    > :first-child {
      margin-top: 0;
    }

    > :last-child {
      margin-bottom: 0;
    }
  }
  .password-content-meta {
    cursor: auto;
  }
}

/* 登录后可查看内容预览样式 - 与其他保护内容样式保持一致 */
.editor-wrapper .ProseMirror .login-required-content-editor-preview {
  margin: 1rem 0;
  overflow: hidden;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border-always);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--anzhiyu-main);
  }

  .login-required-content-header {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    padding: 0.75rem 1rem;
    background: var(--anzhiyu-secondbg);
    border-bottom: var(--style-border-always);

    .login-required-icon {
      line-height: 1;

      .anzhiyufont {
        font-size: 1.5em;
        color: var(--anzhiyu-main);
      }
    }

    .login-required-title {
      font-size: 1.05em;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
    }

    .login-required-header-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      margin-left: auto;
    }

    .login-required-badge {
      padding: 0.2em 0.6em;
      font-size: 0.7em;
      font-weight: 700;
      color: var(--anzhiyu-white);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: var(--anzhiyu-main);
      border-radius: 12px;
      box-shadow: var(--anzhiyu-shadow-lightblack);
    }

    .login-required-settings-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      padding: 0;
      color: var(--anzhiyu-fontcolor);
      cursor: pointer;
      background: transparent;
      border: 1px solid var(--anzhiyu-border-color);
      border-radius: 6px;
      transition: all 0.3s;

      &:hover {
        color: var(--anzhiyu-white);
        background: var(--anzhiyu-main);
        border-color: var(--anzhiyu-main);
        transform: scale(1.1);
      }

      .anzhiyufont {
        font-size: 14px;
      }
    }
  }

  .login-required-content-body {
    padding: 1rem 1.5rem;

    > :first-child {
      margin-top: 0;
    }

    > :last-child {
      margin-bottom: 0;
    }
  }

  .login-required-content-meta {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    color: var(--anzhiyu-secondtext);
    background: var(--anzhiyu-background);
    border-top: var(--style-border-always);
    cursor: auto;

    .content-length {
      margin-right: 0.5rem;
    }

    .login-required-info {
      opacity: 0.8;
    }
  }
}
</style>
