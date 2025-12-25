import { Mark, mergeAttributes } from "@tiptap/core";

/**
 * Subscript 扩展 - 支持下标文本
 */
export const Subscript = Mark.create({
  name: "subscript",

  parseHTML() {
    return [{ tag: "sub" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["sub", mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      toggleSubscript:
        () =>
        ({ commands }: any) => {
          return commands.toggleMark(this.name);
        }
    } as any;
  }
});
