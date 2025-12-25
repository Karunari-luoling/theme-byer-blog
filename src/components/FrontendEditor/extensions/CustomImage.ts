/*
 * @Description: 自定义图片扩展 - 支持对齐和尺寸调整
 * @Author: 安知鱼
 * @Date: 2025-10-24 11:30:00
 * @LastEditTime: 2025-10-24 15:25:04
 * @LastEditors: 安知鱼
 */
import Image from "@tiptap/extension-image";
import { mergeAttributes } from "@tiptap/core";

export const CustomImage = Image.extend({
  name: "customImage",

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element =>
          element.getAttribute("src") || element.getAttribute("data-src"),
        renderHTML: attributes => {
          if (!attributes.src) return {};
          // 使用 data-src 存储真实地址，src 使用占位图
          return {
            "data-src": attributes.src,
            src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSJ0cmFuc3BhcmVudCIvPgo8L3N2Zz4="
          };
        }
      },
      alt: {
        default: null,
        parseHTML: element => element.getAttribute("alt"),
        renderHTML: attributes => {
          if (!attributes.alt) return {};
          return {
            alt: attributes.alt
          };
        }
      },
      title: {
        default: null,
        parseHTML: element => element.getAttribute("title"),
        renderHTML: attributes => {
          if (!attributes.title) return {};
          return {
            title: attributes.title
          };
        }
      },
      caption: {
        default: null,
        parseHTML: element => {
          // 如果是 figure 元素内的图片，获取 figcaption 内容
          const figure = element.closest("figure");
          if (figure) {
            const figcaption = figure.querySelector("figcaption");
            return figcaption?.textContent || null;
          }
          return null;
        },
        renderHTML: () => {
          return {};
        }
      },
      align: {
        default: "center",
        parseHTML: element => {
          const style = element.getAttribute("style") || "";
          if (
            style.includes("margin-right: auto") &&
            style.includes("margin-left: 0")
          ) {
            return "left";
          }
          if (
            style.includes("margin-left: auto") &&
            style.includes("margin-right: 0")
          ) {
            return "right";
          }
          return "center";
        },
        renderHTML: () => {
          return {};
        }
      },
      width: {
        default: null,
        parseHTML: element => {
          const width = element.getAttribute("width");
          return width ? parseInt(width) : null;
        },
        renderHTML: attributes => {
          if (!attributes.width) return {};
          return {
            width: String(attributes.width)
          };
        }
      },
      height: {
        default: null,
        parseHTML: element => {
          const height = element.getAttribute("height");
          return height ? parseInt(height) : null;
        },
        renderHTML: attributes => {
          if (!attributes.height) return {};
          return {
            height: String(attributes.height)
          };
        }
      },
      keepAspectRatio: {
        default: true,
        parseHTML: () => true,
        renderHTML: () => {
          return {};
        }
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: "img[src]",
        getAttrs: element => {
          const el = element as HTMLElement;
          const width = el.getAttribute("width");
          const height = el.getAttribute("height");

          // 优先使用 data-src（懒加载图片的真实地址），如果不存在则使用 src
          const imgSrc = el.getAttribute("data-src") || el.getAttribute("src");

          // 检查是否在 figure 中
          const figure = el.closest("figure");
          let caption = null;
          let align = "center";

          if (figure) {
            const figcaption = figure.querySelector("figcaption");
            caption = figcaption?.textContent || null;

            // 从 figure 的 class 中提取对齐方式
            const figureClass = figure.getAttribute("class") || "";
            if (figureClass.includes("image-align-left")) {
              align = "left";
            } else if (figureClass.includes("image-align-right")) {
              align = "right";
            }
          } else {
            // 从 img 的 class 中提取对齐方式
            const imgClass = el.getAttribute("class") || "";
            if (imgClass.includes("image-align-left")) {
              align = "left";
            } else if (imgClass.includes("image-align-right")) {
              align = "right";
            }
          }

          return {
            src: imgSrc,
            alt: el.getAttribute("alt"),
            title: el.getAttribute("title"),
            caption: caption,
            align: align,
            width: width ? parseInt(width) : null,
            height: height ? parseInt(height) : null
          };
        }
      },
      // 支持直接解析 figure 元素
      {
        tag: "figure",
        getAttrs: element => {
          const el = element as HTMLElement;
          const img = el.querySelector("img[src]");
          if (!img) return false;

          const width = img.getAttribute("width");
          const height = img.getAttribute("height");
          const figcaption = el.querySelector("figcaption");

          // 优先使用 data-src（懒加载图片的真实地址），如果不存在则使用 src
          const imgSrc =
            img.getAttribute("data-src") || img.getAttribute("src");

          // 从 figure 的 class 中提取对齐方式
          const figureClass = el.getAttribute("class") || "";
          let align = "center";
          if (figureClass.includes("image-align-left")) {
            align = "left";
          } else if (figureClass.includes("image-align-right")) {
            align = "right";
          }

          return {
            src: imgSrc,
            alt: img.getAttribute("alt"),
            title: img.getAttribute("title"),
            caption: figcaption?.textContent || null,
            align: align,
            width: width ? parseInt(width) : null,
            height: height ? parseInt(height) : null
          };
        }
      }
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { align, caption } = node.attrs;

    // 构建对齐 class
    const alignClass = `image-align-${align || "center"}`;

    // 构建基础属性（不包含 width/height，这些由 addAttributes 的 renderHTML 处理）
    const baseAttrs: Record<string, any> = {
      class: `article-image editable-image lazy-image ${alignClass}`,
      draggable: "true"
    };

    // 合并属性（HTMLAttributes 已经包含了从各个属性的 renderHTML 返回的值）
    const imgAttrs = mergeAttributes(HTMLAttributes, baseAttrs);

    console.log(
      "🎨 renderHTML - src:",
      node.attrs.src?.slice(-20),
      "caption:",
      caption,
      "align:",
      align,
      "width:",
      node.attrs.width,
      "height:",
      node.attrs.height
    );
    console.log("  imgAttrs keys:", Object.keys(imgAttrs));
    console.log(
      "  imgAttrs values:",
      Object.entries(imgAttrs).map(([k, v]) => `${k}:${v}`)
    );

    // 如果有 caption，渲染为 figure 结构
    if (caption) {
      const result = [
        "figure",
        { class: `image-figure ${alignClass}` },
        ["img", imgAttrs],
        ["figcaption", {}, String(caption)]
      ];
      console.log("  返回 figure，children 数量:", result.length - 2);
      return result;
    }

    // 没有 caption 时，直接返回 img
    console.log("  返回 img");
    return ["img", imgAttrs];
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setImageAlign:
        (align: "left" | "center" | "right") =>
        ({ commands }: any) => {
          return commands.updateAttributes(this.name, { align });
        },
      setImageSize:
        (size: { width?: number; height?: number }) =>
        ({ commands }: any) => {
          return commands.updateAttributes(this.name, size);
        }
    } as any;
  }
});
