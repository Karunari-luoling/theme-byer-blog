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

export async function installMarkdownEditorExtensions() {
  console.log("🔧 Installing markdown editor extensions...");

  // 动态导入 mermaid，只在进入编辑页面时才加载
  const mermaid = await import("mermaid").then(m => m.default);

  // 初始化 mermaid，启用所有图表类型
  // 注意：mermaid 11.x 需要正确的 securityLevel 才能渲染某些图表
  mermaid.initialize({
    startOnLoad: false,
    // loose 模式允许渲染更多复杂图表（如 journey、er 等）
    securityLevel: "loose",
    // 自动检测主题
    theme: document.documentElement.classList.contains("dark")
      ? "dark"
      : "default",
    // 图表通用配置
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: "basis"
    },
    sequence: {
      useMaxWidth: true,
      diagramMarginX: 50,
      diagramMarginY: 10
    },
    gantt: {
      useMaxWidth: true,
      leftPadding: 75,
      gridLineStartPadding: 35,
      barHeight: 20,
      barGap: 4
    },
    journey: {
      useMaxWidth: true,
      diagramMarginX: 50,
      diagramMarginY: 10
    },
    timeline: {
      useMaxWidth: true
    },
    class: {
      useMaxWidth: true
    },
    state: {
      useMaxWidth: true,
      dividerMargin: 10,
      sizeUnit: 5
    },
    er: {
      useMaxWidth: true,
      layoutDirection: "TB",
      minEntityWidth: 100,
      minEntityHeight: 75
    },
    pie: {
      useMaxWidth: true,
      textPosition: 0.75
    },
    quadrantChart: {
      useMaxWidth: true
    },
    requirement: {
      useMaxWidth: true
    },
    mindmap: {
      useMaxWidth: true
    },
    gitGraph: {
      useMaxWidth: true,
      mainBranchName: "main"
    },
    c4: {
      useMaxWidth: true
    },
    // 日志级别，开发时可以设为 1 查看详细日志
    logLevel: 3
  });

  // 将 mermaid 挂载到全局，供重渲染使用
  (window as any).mermaid = mermaid;

  config({
    // 使用本地 mermaid 实例，避免 CDN 加载不稳定导致图表不渲染
    editorExtensions: {
      mermaid: {
        instance: mermaid
      }
    },
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
