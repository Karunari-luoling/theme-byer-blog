/*
 * @Description: 密码保护内容自定义扩展 - 支持在前台编辑器中显示和编辑密码保护内容（与文章内样式完全一致）
 * @Author: 安知鱼
 * @Date: 2025-10-24 16:00:00
 */
import { Node, mergeAttributes } from "@tiptap/core";

export interface PasswordContentOptions {
  HTMLAttributes: Record<string, any>;
}

export const PasswordContent = Node.create<PasswordContentOptions>({
  name: "passwordContent",

  group: "block",

  content: "block+",

  addOptions() {
    return {
      HTMLAttributes: {}
    };
  },

  addAttributes() {
    return {
      contentId: {
        default: "",
        parseHTML: element => element.getAttribute("data-content-id"),
        renderHTML: attributes => {
          return { "data-content-id": attributes.contentId };
        }
      },
      title: {
        default: "密码保护内容",
        parseHTML: element => element.getAttribute("data-title"),
        renderHTML: attributes => {
          return { "data-title": attributes.title };
        }
      },
      hint: {
        default: "请输入密码",
        parseHTML: element => element.getAttribute("data-hint"),
        renderHTML: attributes => {
          return { "data-hint": attributes.hint };
        }
      },
      placeholder: {
        default: "请输入密码",
        parseHTML: element => element.getAttribute("data-placeholder"),
        renderHTML: attributes => {
          return { "data-placeholder": attributes.placeholder };
        }
      },
      password: {
        default: "",
        parseHTML: element => element.getAttribute("data-password"),
        renderHTML: attributes => {
          return { "data-password": attributes.password };
        }
      },
      contentLength: {
        default: "0",
        parseHTML: element => element.getAttribute("data-content-length"),
        renderHTML: attributes => {
          return { "data-content-length": attributes.contentLength };
        }
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[class~="password-content-editor-preview"]',
        getAttrs: element => {
          const el = element as HTMLElement;
          return {
            contentId: el.getAttribute("data-content-id") || "",
            title: el.getAttribute("data-title") || "密码保护内容",
            hint: el.getAttribute("data-hint") || "请输入密码",
            placeholder: el.getAttribute("data-placeholder") || "请输入密码",
            password: el.getAttribute("data-password") || "",
            contentLength: el.getAttribute("data-content-length") || "0"
          };
        },
        contentElement: element => {
          const el = element as HTMLElement;

          // 查找 password-content-body > password-content-preview 容器
          const bodyContainer = el.querySelector(".password-content-body");
          if (bodyContainer) {
            const previewContainer = bodyContainer.querySelector(
              ".password-content-preview"
            ) as HTMLElement;
            if (previewContainer) {
              // 🧹 清理密码输入占位符HTML（如果存在）
              // 避免将后端生成的占位符当作编辑内容
              const placeholder = previewContainer.querySelector(
                ".password-input-container"
              );
              if (placeholder) {
                console.warn(
                  "🧹 [PasswordContent] 检测到密码输入占位符HTML，将被移除"
                );
                placeholder.remove();
              }

              // ✨ 保留完整的代码块 HTML 结构（包括 details 容器）
              // 交互式代码块扩展会处理这些元素，保留展开/收起、复制等功能
              console.log(
                "✨ [PasswordContent] 保留代码块完整结构，由 InteractiveCodeBlock 处理"
              );

              // 返回预览容器，TipTap会解析其中的实际内容
              return previewContainer;
            }
          }

          // 默认情况：直接使用元素本身
          return null;
        }
      }
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { contentId, title, hint, placeholder, password, contentLength } =
      node.attrs;

    const attrs = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      class: "password-content-editor-preview",
      "data-content-id": contentId,
      "data-title": title,
      "data-hint": hint,
      "data-placeholder": placeholder,
      "data-password": password,
      "data-content-length": contentLength
    });

    // TipTap 的数组格式对 SVG 支持不好，使用字体图标
    return [
      "div",
      attrs,
      [
        "div",
        {
          class: "password-content-header",
          contenteditable: "false" // 禁止编辑 header 部分
        },
        [
          "span",
          { class: "password-icon" },
          ["i", { class: "anzhiyufont anzhiyu-icon-lock" }, ""]
        ],
        ["span", { class: "password-title" }, title],
        [
          "div",
          { class: "password-header-actions" },
          ["span", { class: "password-pro-badge" }, "密码保护内容"],
          [
            "button",
            {
              class: "password-settings-btn",
              "data-content-id": contentId,
              type: "button"
            },
            ["i", { class: "anzhiyufont anzhiyu-icon-list-ul" }, ""]
          ]
        ]
      ],
      [
        "div",
        { class: "password-content-body" },
        [
          "div",
          { class: "password-content-preview" },
          0 // 0 表示内容插槽
        ],
        [
          "div",
          {
            class: "password-content-meta",
            contenteditable: "false" // 禁止编辑 meta 部分
          },
          [
            "span",
            { class: "content-length" },
            `约 ${contentLength || "0"} 字`
          ],
          ["span", { class: "password-protection-info" }, "• 此内容受密码保护"]
        ]
      ]
    ];
  }
});
