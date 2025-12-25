/*
 * @Description: 登录后可查看内容自定义扩展 - 支持在前台编辑器中显示和编辑登录后可查看内容
 * @Author: 安知鱼
 * @Date: 2025-10-25 12:00:00
 */
import { Node, mergeAttributes } from "@tiptap/core";

export interface LoginRequiredContentOptions {
  HTMLAttributes: Record<string, any>;
}

export const LoginRequiredContent = Node.create<LoginRequiredContentOptions>({
  name: "loginRequiredContent",

  group: "block",

  content: "block+",

  addOptions() {
    return {
      HTMLAttributes: {}
    };
  },

  addAttributes() {
    return {
      title: {
        default: "登录后可查看",
        parseHTML: element => element.getAttribute("data-title"),
        renderHTML: attributes => {
          return { "data-title": attributes.title };
        }
      },
      contentId: {
        default: "",
        parseHTML: element => element.getAttribute("data-content-id"),
        renderHTML: attributes => {
          return { "data-content-id": attributes.contentId };
        }
      },
      contentLength: {
        default: "0",
        parseHTML: element =>
          element.getAttribute("data-content-length") || "0",
        renderHTML: attributes => {
          return { "data-content-length": attributes.contentLength };
        }
      },
      hint: {
        default: "此内容需要登录后才能查看",
        parseHTML: element => element.getAttribute("data-hint"),
        renderHTML: attributes => {
          return { "data-hint": attributes.hint };
        }
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[class~="login-required-content-editor-preview"]',
        getAttrs: element => {
          const el = element as HTMLElement;
          return {
            title: el.getAttribute("data-title") || "登录后可查看",
            contentId: el.getAttribute("data-content-id") || "",
            contentLength: el.getAttribute("data-content-length") || "0",
            hint: el.getAttribute("data-hint") || "此内容需要登录后才能查看"
          };
        },
        contentElement: element => {
          const el = element as HTMLElement;

          // 查找 login-required-content-body 容器
          const bodyContainer = el.querySelector(
            ".login-required-content-body"
          );
          if (bodyContainer) {
            // 查找内容预览容器
            const previewContainer = bodyContainer.querySelector(
              ".login-required-content-preview"
            ) as HTMLElement;
            if (previewContainer) {
              // 🧹 清理占位符HTML（如果存在）
              const placeholder = previewContainer.querySelector(
                ".login-required-content-placeholder"
              );
              if (placeholder) {
                console.warn(
                  "🧹 [LoginRequiredContent] 检测到占位符HTML，将被移除"
                );
                placeholder.remove();
              }

              // ✨ 保留完整的代码块 HTML 结构（包括 details 容器）
              // 交互式代码块扩展会处理这些元素，保留展开/收起、复制等功能
              console.log(
                "✨ [LoginRequiredContent] 保留代码块完整结构，由 InteractiveCodeBlock 处理"
              );

              return previewContainer;
            }
            // 如果没有preview容器，直接使用body容器
            return bodyContainer as HTMLElement;
          }

          // 默认情况：直接使用元素本身
          return null;
        }
      }
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { title, contentId, contentLength, hint } = node.attrs;

    const attrs = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      class: "login-required-content-editor-preview",
      "data-title": title,
      "data-content-id": contentId,
      "data-content-length": contentLength,
      "data-hint": hint
    });

    return [
      "div",
      attrs,
      [
        "div",
        {
          class: "login-required-content-header",
          contenteditable: "false"
        },
        [
          "span",
          { class: "login-required-icon" },
          ["i", { class: "anzhiyufont anzhiyu-icon-user" }, ""]
        ],
        ["span", { class: "login-required-title" }, title],
        [
          "div",
          { class: "login-required-header-actions" },
          ["span", { class: "login-required-badge" }, "需登录"],
          [
            "button",
            {
              class: "login-required-settings-btn",
              type: "button",
              "data-content-id": contentId
            },
            ["i", { class: "anzhiyufont anzhiyu-icon-list-ul" }, ""]
          ]
        ]
      ],
      [
        "div",
        { class: "login-required-content-body" },
        ["div", { class: "login-required-content-preview" }, 0], // 0 表示内容插槽
        [
          "div",
          {
            class: "login-required-content-meta",
            contenteditable: "false"
          },
          [
            "span",
            { class: "content-length" },
            `约 ${contentLength || "0"} 字`
          ],
          ["span", { class: "login-required-info" }, `• ${hint}`]
        ]
      ]
    ];
  }
});
