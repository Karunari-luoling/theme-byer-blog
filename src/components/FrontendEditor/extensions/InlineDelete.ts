import { Mark, mergeAttributes } from "@tiptap/core";

/**
 * InlineDelete 扩展 - 支持自定义的删除线样式
 */
export const InlineDelete = Mark.create({
  name: "inlineDelete",

  parseHTML() {
    return [
      {
        tag: "span.inline-delete"
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { class: "inline-delete" }),
      0
    ];
  },

  addCommands() {
    return {
      toggleInlineDelete:
        () =>
        ({ commands }: any) => {
          return commands.toggleMark(this.name);
        }
    } as any;
  }
});
