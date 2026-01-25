/**
 * @Description: 编辑器工具栏按钮注册逻辑
 * @Author: 安知鱼
 * @Date: 2025-12-27
 */
import type { Ref } from "vue";

export interface ToolbarButton {
  className: string;
  title: string;
  icon: string;
  iconColor?: string;
  labelColor?: string;
  labelWeight?: string;
  label: string;
  onClick: () => void;
  position?: "start" | "end";
}

/**
 * 创建工具栏按钮元素
 */
const createToolbarButton = (config: ToolbarButton): HTMLElement => {
  const btn = document.createElement("div");
  btn.className = `md-editor-toolbar-item ${config.className}`;
  btn.title = config.title;

  const iconStyle = config.iconColor
    ? `style="color: ${config.iconColor};"`
    : "";
  const labelStyle = [
    config.labelColor ? `color: ${config.labelColor}` : "",
    config.labelWeight ? `font-weight: ${config.labelWeight}` : ""
  ]
    .filter(Boolean)
    .join("; ");

  btn.innerHTML = [
    '<div class="md-editor-toolbar-item-content">',
    `<span class="md-editor-icon" ${iconStyle}>${config.icon}</span>`,
    `<span class="md-editor-toolbar-item-name"${labelStyle ? ` style="${labelStyle}"` : ""}>${config.label}</span>`,
    "</div>"
  ].join("");

  // 添加点击事件
  btn.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();
    config.onClick();
  });

  // 添加样式
  btn.style.cssText = [
    "display: flex",
    "align-items: center",
    "justify-content: center",
    "cursor: pointer",
    "border-radius: 4px",
    "transition: background-color 0.2s",
    "margin-left: 4px",
    "position: relative"
  ].join("; ");

  btn.addEventListener("mouseenter", () => {
    btn.style.backgroundColor = "var(--md-bk-color-outstand)";
  });

  btn.addEventListener("mouseleave", () => {
    btn.style.backgroundColor = "transparent";
  });

  return btn;
};

/**
 * 添加工具栏按钮
 */
const addToolbarButton = (
  containerRef: Ref<HTMLElement | null>,
  config: ToolbarButton,
  retryCount = 0
): void => {
  if (!containerRef.value) return;

  const toolbar = containerRef.value.querySelector(".md-editor-toolbar-right");
  if (!toolbar) {
    if (retryCount < 10) {
      setTimeout(
        () => addToolbarButton(containerRef, config, retryCount + 1),
        200
      );
    }
    return;
  }

  // 检查是否已添加
  if (toolbar.querySelector(`.${config.className}`)) return;

  const btn = createToolbarButton(config);

  if (config.position === "start") {
    toolbar.insertBefore(btn, toolbar.firstChild);
  } else {
    toolbar.appendChild(btn);
  }
};

/**
 * AI 写作按钮图标
 */
const AI_WRITING_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="md-editor-icon" style="color: var(--anzhiyu-main);"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 12l8.5-8.5"/><circle cx="12" cy="12" r="2"/></svg>`;

/**
 * 付费内容按钮图标
 */
const PAID_CONTENT_ICON = `<svg t="1757587236982" class="md-editor-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9670" width="200" height="200"><path d="M512 0c283.569231 0 512 228.430769 512 512s-228.430769 512-512 512S0 795.569231 0 512 228.430769 0 512 0z" fill="#FCAE54" p-id="9671"></path><path d="M689.230769 267.815385c-7.876923-7.876923-19.692308-11.815385-31.507692-11.815385-11.815385 0-23.630769 3.938462-31.507692 11.815385L512 389.907692l-110.276923-122.092307c-11.815385-7.876923-23.630769-11.815385-35.446154-11.815385-11.815385 0-23.630769 3.938462-31.507692 11.815385-19.692308 19.692308-19.692308 47.261538 0 66.953846l66.953846 74.830769H326.892308c-7.876923 0-11.815385 3.938462-11.815385 11.815385v59.076923c0 7.876923 3.938462 11.815385 11.815385 11.815384H472.615385v78.769231H366.276923c-7.876923 0-11.815385 3.938462-11.815385 11.815385v55.138461c0 7.876923 3.938462 11.815385 11.815385 11.815385H472.615385v74.830769c0 23.630769 15.753846 47.261538 39.384615 47.261539 27.569231 0 43.323077-19.692308 43.323077-47.261539v-74.830769h106.338461c7.876923 0 11.815385-3.938462 11.815385-11.815385v-55.138461c0-7.876923-3.938462-11.815385-11.815385-11.815385h-106.338461v-78.769231h141.784615c7.876923 0 11.815385-3.938462 11.815385-11.815384v-59.076923c0-7.876923-3.938462-11.815385-11.815385-11.815385h-70.892307l66.953846-74.830769c15.753846-19.692308 15.753846-47.261538-3.938462-66.953846z" fill="#FFFFFF" p-id="9672"></path></svg>`;

/**
 * 密码保护按钮图标
 */
const PASSWORD_CONTENT_ICON = `<svg t="1757587236982" class="md-editor-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="15847" width="200" height="200"><path d="M832 464h-68V240c0-70.7-57.3-128-128-128H388c-70.7 0-128 57.3-128 128v224h-68c-17.7 0-32 14.3-32 32v384c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V496c0-17.7-14.3-32-32-32zM332 240c0-30.9 25.1-56 56-56h248c30.9 0 56 25.1 56 56v224H332V240z m460 600H232V536h560v304z" fill="#5470C6" p-id="15848"></path><path d="M484 701v53c0 4.4 3.6 8 8 8h40c4.4 0 8-3.6 8-8v-53c12.1-8.7 20-22.9 20-39 0-26.5-21.5-48-48-48s-48 21.5-48 48c0 16.1 7.9 30.3 20 39z" fill="#5470C6" p-id="15849"></path></svg>`;

/**
 * 登录可见按钮图标
 */
const LOGIN_REQUIRED_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="md-editor-icon"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

/**
 * 编辑器工具栏hook
 */
export const useEditorToolbar = (
  containerRef: Ref<HTMLElement | null>,
  options: {
    hidePremiumFeatures?: boolean;
    onAIWriting?: () => void;
    onPaidContent?: () => void;
    onPasswordContent?: () => void;
    onLoginRequired?: () => void;
  }
) => {
  /**
   * 添加 AI 写作按钮
   */
  const addAIWritingButton = () => {
    if (!options.onAIWriting) return;

    addToolbarButton(containerRef, {
      className: "ai-writing-btn",
      title: "AI 写作助手",
      icon: AI_WRITING_ICON,
      iconColor: "var(--anzhiyu-main)",
      labelColor: "var(--anzhiyu-main)",
      labelWeight: "600",
      label: "AI写作",
      onClick: options.onAIWriting,
      position: "start"
    });
  };

  /**
   * 添加付费内容按钮
   */
  const addPaidContentButton = () => {
    if (options.hidePremiumFeatures || !options.onPaidContent) return;

    addToolbarButton(containerRef, {
      className: "paid-content-btn",
      title: "插入付费内容",
      icon: PAID_CONTENT_ICON,
      label: "付费内容",
      onClick: options.onPaidContent
    });
  };

  /**
   * 添加密码保护按钮
   */
  const addPasswordContentButton = () => {
    if (options.hidePremiumFeatures || !options.onPasswordContent) return;

    addToolbarButton(containerRef, {
      className: "password-content-btn",
      title: "插入密码保护内容（PRO版本）",
      icon: PASSWORD_CONTENT_ICON,
      label: "密码保护",
      onClick: options.onPasswordContent
    });
  };

  /**
   * 添加登录可见按钮
   */
  const addLoginRequiredButton = () => {
    if (options.hidePremiumFeatures || !options.onLoginRequired) return;

    addToolbarButton(containerRef, {
      className: "login-required-content-btn",
      title: "插入登录后可见内容（PRO版本）",
      icon: LOGIN_REQUIRED_ICON,
      label: "登录可见",
      onClick: options.onLoginRequired
    });
  };

  /**
   * 初始化所有自定义工具栏按钮
   */
  const initToolbarButtons = () => {
    addAIWritingButton();
    addPaidContentButton();
    addPasswordContentButton();
    addLoginRequiredButton();
  };

  return {
    initToolbarButtons,
    addAIWritingButton,
    addPaidContentButton,
    addPasswordContentButton,
    addLoginRequiredButton
  };
};
