/*
 * @Description: 付费内容自定义扩展 - 支持在前台编辑器中显示和编辑付费内容（与文章内样式完全一致）
 * @Author: 安知鱼
 * @Date: 2025-10-24 16:00:00
 */
import { Node, mergeAttributes } from "@tiptap/core";

export interface PaidContentOptions {
  HTMLAttributes: Record<string, any>;
}

export const PaidContent = Node.create<PaidContentOptions>({
  name: "paidContent",

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
        default: "付费内容",
        parseHTML: element => element.getAttribute("data-title"),
        renderHTML: attributes => {
          return { "data-title": attributes.title };
        }
      },
      price: {
        default: "0",
        parseHTML: element => element.getAttribute("data-price"),
        renderHTML: attributes => {
          return { "data-price": attributes.price };
        }
      },
      originalPrice: {
        default: null,
        parseHTML: element => element.getAttribute("data-original-price"),
        renderHTML: attributes => {
          if (!attributes.originalPrice) return {};
          return { "data-original-price": attributes.originalPrice };
        }
      },
      currency: {
        default: "¥",
        parseHTML: element => element.getAttribute("data-currency") || "¥",
        renderHTML: attributes => {
          return { "data-currency": attributes.currency };
        }
      },
      contentLength: {
        default: "0",
        parseHTML: element =>
          element.getAttribute("data-content-length") || "0",
        renderHTML: attributes => {
          return { "data-content-length": attributes.contentLength };
        }
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[class~="paid-content-editor-preview"]',
        getAttrs: element => {
          const el = element as HTMLElement;
          return {
            title: el.getAttribute("data-title") || "付费内容",
            price: el.getAttribute("data-price") || "0",
            originalPrice: el.getAttribute("data-original-price"),
            currency: el.getAttribute("data-currency") || "¥",
            contentLength: el.getAttribute("data-content-length") || "0"
          };
        },
        contentElement: element => {
          const el = element as HTMLElement;

          // 查找 paid-content-body 容器
          const bodyContainer = el.querySelector(".paid-content-body");
          if (bodyContainer) {
            // 查找内容预览容器
            const previewContainer = bodyContainer.querySelector(
              ".paid-content-preview"
            ) as HTMLElement;
            if (previewContainer) {
              // 🧹 清理占位符HTML（如果存在）
              // 避免将后端生成的占位符当作编辑内容
              const placeholder = previewContainer.querySelector(
                ".paid-content-placeholder"
              );
              if (placeholder) {
                console.warn("🧹 [PaidContent] 检测到占位符HTML，将被移除");
                placeholder.remove();
              }

              // ✨ 保留完整的代码块 HTML 结构（包括 details 容器）
              // 交互式代码块扩展会处理这些元素，保留展开/收起、复制等功能
              console.log(
                "✨ [PaidContent] 保留代码块完整结构，由 InteractiveCodeBlock 处理"
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
    const { title, price, originalPrice, currency, contentLength } = node.attrs;

    const attrs = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      class: "paid-content-editor-preview",
      "data-title": title,
      "data-price": price,
      "data-currency": currency,
      "data-content-length": contentLength
    });

    if (originalPrice) {
      attrs["data-original-price"] = originalPrice;
    }

    // 构建价格显示部分（与 pro-content-features.scss 完全一致）
    const priceDisplay = originalPrice
      ? [
          "div",
          { class: "paid-price-group" },
          [
            "div",
            { class: "paid-current-price" },
            ["span", { class: "paid-current-price-currency" }, currency],
            price
          ],
          [
            "span",
            { class: "paid-original-price" },
            `${currency}${originalPrice}`
          ]
        ]
      : [
          "div",
          { class: "paid-price" },
          ["span", { class: "paid-current-price-currency" }, currency],
          price
        ];

    // TipTap 的数组格式对 SVG 支持不好，使用字体图标
    return [
      "div",
      attrs,
      [
        "div",
        {
          class: "paid-content-header",
          contenteditable: "false" // 禁止编辑 header 部分
        },
        [
          "span",
          { class: "paid-icon" },
          ["i", { class: "anzhiyufont anzhiyu-icon-rmb" }, ""]
        ],
        ["span", { class: "paid-title" }, title],
        [
          "div", // 新容器用于价格和设置按钮
          { class: "paid-header-actions" },
          priceDisplay,
          [
            "button",
            {
              class: "paid-settings-btn",
              type: "button"
            },
            ["i", { class: "anzhiyufont anzhiyu-icon-list-ul" }, ""]
          ]
        ]
      ],
      [
        "div",
        { class: "paid-content-body" },
        ["div", { class: "paid-content-preview" }, 0], // 0 表示内容插槽
        [
          "div",
          {
            class: "paid-content-meta",
            contenteditable: "false" // 禁止编辑 meta 部分
          },
          ["span", { class: "content-length" }, `约 ${contentLength || "0"} 字`]
        ]
      ]
    ];
  }
});
