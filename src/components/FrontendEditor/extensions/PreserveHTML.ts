/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-10-24 11:10:33
 * @LastEditTime: 2025-10-24 11:18:49
 * @LastEditors: 安知鱼
 */
import { Node } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

/**
 * PreserveHTML 扩展 - 保留复杂的 HTML 结构
 * 用于图片组、视频画廊等需要完整保留 DOM 结构的元素
 */
export const PreserveHTML = Node.create({
  name: "preserveHTML",

  group: "block",

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      html: {
        default: "",
        parseHTML: element => element.outerHTML,
        renderHTML: attributes => {
          return {
            "data-html": attributes.html
          };
        }
      }
    };
  },

  parseHTML() {
    return [
      // 恢复保存的 preserve-html-wrapper（优先级最高）
      {
        tag: "div.preserve-html-wrapper[data-html]",
        priority: 100,
        getAttrs: element => {
          const html = (element as HTMLElement).getAttribute("data-html");
          return html ? { html } : false;
        }
      },
      // 图片组
      {
        tag: "div.gallery-container",
        getAttrs: element => ({
          html: (element as HTMLElement).outerHTML
        })
      },
      // 视频画廊
      {
        tag: "div.video-gallery-container",
        getAttrs: element => ({
          html: (element as HTMLElement).outerHTML
        })
      },
      // Figure 元素（只捕获带 figcaption 的）
      {
        tag: "figure",
        getAttrs: element => {
          const el = element as HTMLElement;
          // 只保留包含 figcaption 的 figure
          if (el.querySelector("figcaption")) {
            return {
              html: el.outerHTML
            };
          }
          return false; // 不捕获纯图片的 figure
        }
      }
    ];
  },

  renderHTML({ node }) {
    // 🔧 返回标准的 DOMOutputSpec 数组格式
    // 直接返回原始 HTML（作为一个不可见的注释节点，实际渲染由 addNodeView 处理）
    const html = node.attrs.html || "";

    // 返回一个包含 data-html 属性的 div，保存时可以恢复原始 HTML
    return [
      "div",
      {
        "data-preserve-html": "true",
        class: "preserve-html-wrapper",
        "data-html": html
      },
      // 空内容，实际内容由 addNodeView 渲染
      0
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("div");
      dom.className = "preserve-html-wrapper";
      dom.setAttribute("contenteditable", "false");
      dom.setAttribute("data-preserve-html", "true");

      // 直接插入原始 HTML
      dom.innerHTML = node.attrs.html;

      return {
        dom,
        contentDOM: null, // 不允许编辑内部内容
        ignoreMutation: () => true // 忽略所有变更
      };
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("preserveHTMLPlugin"),
        props: {
          // 确保内容不被修改
          handleDOMEvents: {
            mousedown: (view, event) => {
              const target = event.target as HTMLElement;
              const preserveNode = target.closest(
                ".gallery-container, .video-gallery-container"
              );
              // 只阻止 gallery 和 video-gallery 的交互
              // figure 交给 CustomImage 处理
              if (preserveNode) {
                // 阻止编辑这些节点
                event.preventDefault();
                return true;
              }
              return false;
            }
          }
        }
      })
    ];
  }
});
