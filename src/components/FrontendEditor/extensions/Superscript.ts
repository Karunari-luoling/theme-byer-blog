/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-10-24 11:09:24
 * @LastEditTime: 2025-10-24 11:11:51
 * @LastEditors: 安知鱼
 */
import { Mark, mergeAttributes } from "@tiptap/core";

/**
 * Superscript 扩展 - 支持上标文本
 */
export const Superscript = Mark.create({
  name: "superscript",

  parseHTML() {
    return [{ tag: "sup" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["sup", mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      toggleSuperscript:
        () =>
        ({ commands }: any) => {
          return commands.toggleMark(this.name);
        }
    } as any;
  }
});
