/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-22 12:19:01
 * @LastEditTime: 2025-10-22 18:08:01
 * @LastEditors: 安知鱼
 */
import { config } from "md-editor-v3";
import TabsPlugin from "./plugins/markdown-it-tabs-plugin";
import PaidContentPlugin from "./plugins/markdown-it-paid-content-plugin";
import PasswordContentPlugin from "./plugins/markdown-it-password-content-plugin";
import LoginRequiredContentPlugin from "./plugins/markdown-it-login-required-plugin";
import FoldingPlugin from "./plugins/markdown-it-folding-plugin";
import HiddenPlugin from "./plugins/markdown-it-hidden-plugin";
import InlineStylesPlugin from "./plugins/markdown-it-inline-styles-plugin";
import ButtonPlugin from "./plugins/markdown-it-button-plugin";
import BtnsPlugin from "./plugins/markdown-it-btns-plugin";
import LinkCardPlugin from "./plugins/markdown-it-link-card-plugin";
import TipPlugin from "./plugins/markdown-it-tip-plugin";
import GalleryPlugin from "./plugins/markdown-it-gallery-plugin";
import VideoGalleryPlugin from "./plugins/markdown-it-video-gallery-plugin";
import EnhancedImagePlugin from "./plugins/markdown-it-enhanced-image-plugin";
import MusicPlugin from "./plugins/markdown-it-music-plugin";

export function installMarkdownEditorExtensions() {
  console.log("🔧 Installing markdown editor extensions...");

  config({
    markdownItConfig(mdit) {
      console.log("⚙️ Configuring markdown-it with plugins...");

      try {
        mdit.use(EnhancedImagePlugin);
        console.log("✅ EnhancedImagePlugin registered");

        mdit.use(MusicPlugin);
        console.log("✅ MusicPlugin registered");

        mdit.use(TabsPlugin);
        console.log("✅ TabsPlugin registered");

        mdit.use(FoldingPlugin);
        console.log("✅ FoldingPlugin registered");

        mdit.use(HiddenPlugin);
        console.log("✅ HiddenPlugin registered");

        mdit.use(InlineStylesPlugin);
        console.log("✅ InlineStylesPlugin registered");

        mdit.use(ButtonPlugin);
        console.log("✅ ButtonPlugin registered");

        mdit.use(BtnsPlugin);
        console.log("✅ BtnsPlugin registered");

        mdit.use(LinkCardPlugin);
        console.log("✅ LinkCardPlugin registered");

        mdit.use(TipPlugin);
        console.log("✅ TipPlugin registered");

        mdit.use(GalleryPlugin);
        console.log("✅ GalleryPlugin registered");

        mdit.use(VideoGalleryPlugin);
        console.log("✅ VideoGalleryPlugin registered");

        mdit.use(PaidContentPlugin);
        console.log("✅ PaidContentPlugin registered");

        mdit.use(PasswordContentPlugin);
        console.log("✅ PasswordContentPlugin registered");

        mdit.use(LoginRequiredContentPlugin);
        console.log("✅ LoginRequiredContentPlugin registered");

        console.log("🎉 All markdown plugins configured successfully!");
      } catch (error) {
        console.error("❌ Error configuring plugins:", error);
      }
    }
  });

  console.log("✅ Markdown editor extensions installed");
}
