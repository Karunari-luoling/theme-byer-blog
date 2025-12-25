// src/views/system/settings-management/settings.descriptor.ts
import { constant } from "@/constant";
import type { SettingKey } from "@/constant";

/**
 * @description 单个设置的描述符接口
 * @param frontendPath - 在前端 form 对象中的路径 (e.g., 'site.siteName')
 * @param backendKey - 在后端API中的键名 (e.g., 'APP_NAME')
 * @param defaultValue - 该项的默认值
 * @param type - 数据类型，用于自动转换。'string' | 'boolean' | 'number' | 'json'
 */
export interface SettingDescriptor {
  frontendPath: string;
  backendKey: SettingKey;
  defaultValue: any;
  type: "string" | "boolean" | "number" | "json";
}

const siteDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "site.siteName",
    backendKey: constant.KeyAppName,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.subTitle",
    backendKey: constant.KeySubTitle,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.siteDescription",
    backendKey: constant.KeySiteDescription,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.siteKeywords",
    backendKey: constant.KeySiteKeywords,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.primaryUrl",
    backendKey: constant.KeySiteURL,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.announcement",
    backendKey: constant.KeySiteAnnouncement,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.logoDay",
    backendKey: constant.KeyLogoHorizontalDay,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.logoNight",
    backendKey: constant.KeyLogoHorizontalNight,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.favicon",
    backendKey: constant.KeyIconURL,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.iconMedium",
    backendKey: constant.KeyLogoURL192,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.iconLarge",
    backendKey: constant.KeyLogoURL512,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.icpNumber",
    backendKey: constant.KeyIcpNumber,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.policeRecordNumber",
    backendKey: constant.KeyPoliceRecordNumber,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.policeRecordIcon",
    backendKey: constant.KeyPoliceRecordIcon,
    defaultValue: "https://www.beian.gov.cn/img/new/gongan.png",
    type: "string"
  },
  {
    frontendPath: "site.gravatarURL",
    backendKey: constant.KeyGravatarURL,
    defaultValue: "https://cdn.sep.cc/",
    type: "string"
  },
  {
    frontendPath: "site.defaultGravatarType",
    backendKey: constant.KeyDefaultGravatarType,
    defaultValue: "mp",
    type: "string"
  },
  {
    frontendPath: "site.enableRegistration",
    backendKey: constant.KeyEnableRegistration,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "site.defaultThemeMode",
    backendKey: constant.KeyDefaultThemeMode,
    defaultValue: "light",
    type: "string"
  }
];

const pageDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "page.enableExternalLinkWarning",
    backendKey: constant.KeyEnableExternalLinkWarning,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "page.albumApiURL",
    backendKey: constant.KeyApiURL,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "page.defaultThumbParam",
    backendKey: constant.KeyDefaultThumbParam,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "page.defaultBigParam",
    backendKey: constant.KeyDefaultBigParam,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "page.customHeaderHTML",
    backendKey: constant.KeyCustomHeaderHTML,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "page.customFooterHTML",
    backendKey: constant.KeyCustomFooterHTML,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "page.customCSS",
    backendKey: constant.KeyCustomCSS,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "page.customJS",
    backendKey: constant.KeyCustomJS,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "page.customPostTopHTML",
    backendKey: constant.KeyCustomPostTopHTML,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "page.customPostBottomHTML",
    backendKey: constant.KeyCustomPostBottomHTML,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "page.oneImageConfig",
    backendKey: constant.KeyPageOneImageConfig,
    defaultValue: {},
    type: "json"
  },
  {
    frontendPath: "page.hitokotoAPI",
    backendKey: constant.KeyHitokotoAPI,
    defaultValue: "https://v1.hitokoto.cn/",
    type: "string"
  },
  {
    frontendPath: "page.typingSpeed",
    backendKey: constant.KeyTypingSpeed,
    defaultValue: 100,
    type: "number"
  }
];

const fileDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "file.uploadAllowedExtensions",
    backendKey: constant.KeyUploadAllowedExtensions,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "file.uploadDeniedExtensions",
    backendKey: constant.KeyUploadDeniedExtensions,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "file.enableVipsGenerator",
    backendKey: constant.KeyEnableVipsGenerator,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "file.vipsPath",
    backendKey: constant.KeyVipsPath,
    defaultValue: "vips",
    type: "string"
  },
  {
    frontendPath: "file.vipsMaxFileSize",
    backendKey: constant.KeyVipsMaxFileSize,
    defaultValue: "0",
    type: "string"
  }, // 使用字符串以匹配el-input
  {
    frontendPath: "file.vipsSupportedExts",
    backendKey: constant.KeyVipsSupportedExts,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "file.enableMusicCoverGenerator",
    backendKey: constant.KeyEnableMusicCoverGenerator,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "file.musicCoverMaxFileSize",
    backendKey: constant.KeyMusicCoverMaxFileSize,
    defaultValue: "0",
    type: "string"
  },
  {
    frontendPath: "file.musicCoverSupportedExts",
    backendKey: constant.KeyMusicCoverSupportedExts,
    defaultValue: "mp3,m4a,ogg,flac",
    type: "string"
  },
  {
    frontendPath: "file.enableFfmpegGenerator",
    backendKey: constant.KeyEnableFfmpegGenerator,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "file.ffmpegPath",
    backendKey: constant.KeyFfmpegPath,
    defaultValue: "ffmpeg",
    type: "string"
  },
  {
    frontendPath: "file.ffmpegMaxFileSize",
    backendKey: constant.KeyFfmpegMaxFileSize,
    defaultValue: "0",
    type: "string"
  },
  {
    frontendPath: "file.ffmpegSupportedExts",
    backendKey: constant.KeyFfmpegSupportedExts,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "file.ffmpegCaptureTime",
    backendKey: constant.KeyFfmpegCaptureTime,
    defaultValue: "00:00:01.00",
    type: "string"
  },
  {
    frontendPath: "file.enableBuiltinGenerator",
    backendKey: constant.KeyEnableBuiltinGenerator,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "file.builtinMaxFileSize",
    backendKey: constant.KeyBuiltinMaxFileSize,
    defaultValue: "0",
    type: "string"
  },
  {
    frontendPath: "file.builtinDirectServeExts",
    backendKey: constant.KeyBuiltinDirectServeExts,
    defaultValue: "avif,webp",
    type: "string"
  },
  {
    frontendPath: "file.queueThumbConcurrency",
    backendKey: constant.KeyQueueThumbConcurrency,
    defaultValue: 15,
    type: "number"
  },
  {
    frontendPath: "file.queueThumbMaxExecTime",
    backendKey: constant.KeyQueueThumbMaxExecTime,
    defaultValue: 300,
    type: "number"
  },
  {
    frontendPath: "file.queueThumbBackoffFactor",
    backendKey: constant.KeyQueueThumbBackoffFactor,
    defaultValue: 2,
    type: "number"
  },
  {
    frontendPath: "file.queueThumbMaxBackoff",
    backendKey: constant.KeyQueueThumbMaxBackoff,
    defaultValue: 60,
    type: "number"
  },
  {
    frontendPath: "file.queueThumbMaxRetries",
    backendKey: constant.KeyQueueThumbMaxRetries,
    defaultValue: 3,
    type: "number"
  },
  {
    frontendPath: "file.queueThumbRetryDelay",
    backendKey: constant.KeyQueueThumbRetryDelay,
    defaultValue: 5,
    type: "number"
  },
  {
    frontendPath: "file.enableExifExtractor",
    backendKey: constant.KeyEnableExifExtractor,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "file.exifMaxSizeLocal",
    backendKey: constant.KeyExifMaxSizeLocal,
    defaultValue: "0",
    type: "string"
  },
  {
    frontendPath: "file.exifMaxSizeRemote",
    backendKey: constant.KeyExifMaxSizeRemote,
    defaultValue: "0",
    type: "string"
  },
  {
    frontendPath: "file.exifUseBruteForce",
    backendKey: constant.KeyExifUseBruteForce,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "file.enableMusicExtractor",
    backendKey: constant.KeyEnableMusicExtractor,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "file.musicMaxSizeLocal",
    backendKey: constant.KeyMusicMaxSizeLocal,
    defaultValue: "0",
    type: "string"
  },
  {
    frontendPath: "file.musicMaxSizeRemote",
    backendKey: constant.KeyMusicMaxSizeRemote,
    defaultValue: "0",
    type: "string"
  }
];

const postDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "post.ipApi",
    backendKey: constant.KeyIPAPI,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "post.ipApiToken",
    backendKey: constant.KeyIPAPIToKen,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "post.expirationTime",
    backendKey: constant.KeyPostExpirationTime,
    defaultValue: null,
    type: "number"
  },
  {
    frontendPath: "post.default.defaultCover",
    backendKey: constant.KeyDefaultCover,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "post.default.doubleColumn",
    backendKey: constant.KeyDoubleColumn,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "post.default.pageSize",
    backendKey: constant.KeyPostDefaultPageSize,
    defaultValue: 12,
    type: "number"
  },
  {
    frontendPath: "post.page404.defaultImage",
    backendKey: constant.Key404PageDefaultImage,
    defaultValue: "/static/img/background-effect.gif",
    type: "string"
  },
  {
    frontendPath: "post.reward.enable",
    backendKey: constant.KeyPostRewardEnable,
    defaultValue: 12,
    type: "boolean"
  },
  {
    frontendPath: "post.reward.weChat",
    backendKey: constant.KeyPostRewardWeChatQR,
    defaultValue: 12,
    type: "string"
  },
  {
    frontendPath: "post.reward.aliPay",
    backendKey: constant.KeyPostRewardAlipayQR,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "post.reward.weChatEnable",
    backendKey: constant.KeyPostRewardWeChatEnable,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "post.reward.aliPayEnable",
    backendKey: constant.KeyPostRewardAlipayEnable,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "post.reward.buttonText",
    backendKey: constant.KeyPostRewardButtonText,
    defaultValue: "打赏作者",
    type: "string"
  },
  {
    frontendPath: "post.reward.title",
    backendKey: constant.KeyPostRewardTitle,
    defaultValue: "感谢你赐予我前进的力量",
    type: "string"
  },
  {
    frontendPath: "post.reward.weChatLabel",
    backendKey: constant.KeyPostRewardWeChatLabel,
    defaultValue: "微信",
    type: "string"
  },
  {
    frontendPath: "post.reward.aliPayLabel",
    backendKey: constant.KeyPostRewardAlipayLabel,
    defaultValue: "支付宝",
    type: "string"
  },
  {
    frontendPath: "post.reward.listButtonText",
    backendKey: constant.KeyPostRewardListButtonText,
    defaultValue: "打赏者名单",
    type: "string"
  },
  {
    frontendPath: "post.reward.listButtonDesc",
    backendKey: constant.KeyPostRewardListButtonDesc,
    defaultValue: "因为你们的支持让我意识到写文章的价值",
    type: "string"
  },
  {
    frontendPath: "post.codeBlock.codeMaxLines",
    backendKey: constant.KeyPostCodeBlockCodeMaxLines,
    defaultValue: 10,
    type: "number"
  },
  {
    frontendPath: "post.copy.enable",
    backendKey: constant.KeyPostCopyEnable,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "post.copy.copyrightEnable",
    backendKey: constant.KeyPostCopyCopyrightEnable,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "post.copy.copyrightOriginal",
    backendKey: constant.KeyPostCopyCopyrightOriginal,
    defaultValue:
      "本文来自 {siteName}，作者 {author}，转载请注明出处。\n原文地址：{url}",
    type: "string"
  },
  {
    frontendPath: "post.copy.copyrightReprint",
    backendKey: constant.KeyPostCopyCopyrightReprint,
    defaultValue:
      "本文转载自 {originalAuthor}，原文地址：{originalUrl}\n当前页面：{currentUrl}",
    type: "string"
  },
  {
    frontendPath: "post.toc.hashUpdateMode",
    backendKey: constant.KeyPostTocHashUpdateMode,
    defaultValue: "replace",
    type: "string"
  },
  {
    frontendPath: "post.cdn.enable",
    backendKey: constant.KeyCDNEnable,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "post.cdn.provider",
    backendKey: constant.KeyCDNProvider,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "post.cdn.secretID",
    backendKey: constant.KeyCDNSecretID,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "post.cdn.secretKey",
    backendKey: constant.KeyCDNSecretKey,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "post.cdn.region",
    backendKey: constant.KeyCDNRegion,
    defaultValue: "ap-beijing",
    type: "string"
  },
  {
    frontendPath: "post.cdn.domain",
    backendKey: constant.KeyCDNDomain,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "post.cdn.zoneID",
    backendKey: constant.KeyCDNZoneID,
    defaultValue: "",
    type: "string"
  },
  // --- 多人共创配置 - PRO 专属 ---
  {
    frontendPath: "post.multiAuthor.enable",
    backendKey: constant.KeyMultiAuthorEnable,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "post.multiAuthor.needReview",
    backendKey: constant.KeyMultiAuthorNeedReview,
    defaultValue: false,
    type: "boolean"
  },
  // --- 文章审核通知配置 - PRO 专属 ---
  {
    frontendPath: "post.reviewNotify.enable",
    backendKey: constant.KeyArticleReviewNotifyEnable,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "post.reviewNotify.email",
    backendKey: constant.KeyArticleReviewNotifyEmail,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "post.reviewNotify.push",
    backendKey: constant.KeyArticleReviewNotifyPush,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "post.reviewNotify.pushChannel",
    backendKey: constant.KeyArticleReviewPushChannel,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "post.reviewNotify.pushURL",
    backendKey: constant.KeyArticleReviewPushURL,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "post.reviewNotify.webhookRequestBody",
    backendKey: constant.KeyArticleReviewWebhookRequestBody,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "post.reviewNotify.webhookHeaders",
    backendKey: constant.KeyArticleReviewWebhookHeaders,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "post.reviewNotify.mailSubjectApproved",
    backendKey: constant.KeyArticleReviewMailSubjectApproved,
    defaultValue: "【{{.SiteName}}】您的文章已通过审核",
    type: "string"
  },
  {
    frontendPath: "post.reviewNotify.mailTemplateApproved",
    backendKey: constant.KeyArticleReviewMailTemplateApproved,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "post.reviewNotify.mailSubjectRejected",
    backendKey: constant.KeyArticleReviewMailSubjectRejected,
    defaultValue: "【{{.SiteName}}】您的文章审核未通过",
    type: "string"
  },
  {
    frontendPath: "post.reviewNotify.mailTemplateRejected",
    backendKey: constant.KeyArticleReviewMailTemplateRejected,
    defaultValue: "",
    type: "string"
  }
];

const equipmentDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "frontDesk.equipment.banner.background",
    backendKey: constant.KeyPostEquipmentBannerBackground,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.equipment.banner.title",
    backendKey: constant.KeyPostEquipmentBannerTitle,
    defaultValue: "好物",
    type: "string"
  },
  {
    frontendPath: "frontDesk.equipment.banner.description",
    backendKey: constant.KeyPostEquipmentBannerDescription,
    defaultValue: "实物装备推荐",
    type: "string"
  },
  {
    frontendPath: "frontDesk.equipment.banner.tip",
    backendKey: constant.KeyPostEquipmentBannerTip,
    defaultValue: "跟 安知鱼 一起享受科技带来的乐趣",
    type: "string"
  },
  {
    frontendPath: "frontDesk.equipment.list",
    backendKey: constant.KeyPostEquipmentList,
    defaultValue: [],
    type: "json"
  }
];

const recentCommentsDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "frontDesk.recentComments.banner.background",
    backendKey: constant.KeyRecentCommentsBannerBackground,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.recentComments.banner.title",
    backendKey: constant.KeyRecentCommentsBannerTitle,
    defaultValue: "评论",
    type: "string"
  },
  {
    frontendPath: "frontDesk.recentComments.banner.description",
    backendKey: constant.KeyRecentCommentsBannerDescription,
    defaultValue: "最近评论",
    type: "string"
  },
  {
    frontendPath: "frontDesk.recentComments.banner.tip",
    backendKey: constant.KeyRecentCommentsBannerTip,
    defaultValue: "发表你的观点和看法，让更多人看到",
    type: "string"
  }
];

const aboutPageDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "frontDesk.about.name",
    backendKey: constant.KeyAboutPageName,
    defaultValue: "安知鱼",
    type: "string"
  },
  {
    frontendPath: "frontDesk.about.description",
    backendKey: constant.KeyAboutPageDescription,
    defaultValue: "是一名 前端工程师、学生、独立开发者、博主",
    type: "string"
  },
  {
    frontendPath: "frontDesk.about.avatarImg",
    backendKey: constant.KeyAboutPageAvatarImg,
    defaultValue:
      "https://npm.elemecdn.com/anzhiyu-blog-static@1.0.4/img/avatar.jpg",
    type: "string"
  },
  {
    frontendPath: "frontDesk.about.subtitle",
    backendKey: constant.KeyAboutPageSubtitle,
    defaultValue: "生活明朗，万物可爱✨",
    type: "string"
  },
  {
    frontendPath: "frontDesk.about.avatarSkillsLeft",
    backendKey: constant.KeyAboutPageAvatarSkillsLeft,
    defaultValue: [
      "🤖️ 数码科技爱好者",
      "🔍 分享与热心帮助",
      "🏠 智能家居小能手",
      "🔨 设计开发一条龙"
    ],
    type: "json"
  },
  {
    frontendPath: "frontDesk.about.avatarSkillsRight",
    backendKey: constant.KeyAboutPageAvatarSkillsRight,
    defaultValue: [
      "专修交互与设计 🤝",
      "脚踏实地行动派 🏃",
      "团队小组发动机 🧱",
      "壮汉人狠话不多 💢"
    ],
    type: "json"
  },
  {
    frontendPath: "frontDesk.about.aboutSiteTips",
    backendKey: constant.KeyAboutPageAboutSiteTips,
    defaultValue: {
      tips: "追求",
      title1: "源于",
      title2: "热爱而去 感受",
      word: ["学习", "生活", "程序", "体验"]
    },
    type: "json"
  },
  {
    frontendPath: "frontDesk.about.map",
    backendKey: constant.KeyAboutPageMap,
    defaultValue: {
      background:
        "https://img02.anheyu.com/adminuploads/1/2022/09/24/632e6f48981d8.jpg",
      backgroundDark:
        "https://img02.anheyu.com/adminuploads/1/2022/09/26/6330ebf1f3e65.jpg",
      strengthenTitle: "中国，长沙市",
      title: "我现在住在"
    },
    type: "json"
  },
  {
    frontendPath: "frontDesk.about.selfInfo",
    backendKey: constant.KeyAboutPageSelfInfo,
    defaultValue: {
      tips1: "生于",
      contentYear: "2002",
      tips2: "湖南信息学院",
      content2: "软件工程",
      tips3: "现在职业",
      content3: "软件工程师👨"
    },
    type: "json"
  },
  {
    frontendPath: "frontDesk.about.personalities",
    backendKey: constant.KeyAboutPagePersonalities,
    defaultValue: {
      authorName: "执政官",
      nameUrl: "https://www.16personalities.com/ch/esfj-%E4%BA%BA%E6%A0%BC",
      personalityImg:
        "https://npm.elemecdn.com/anzhiyu-blog@2.0.8/img/svg/ESFJ-A.svg",
      personalityType: "ESFJ-A",
      personalityTypeColor: "#ac899c",
      photoUrl:
        "https://img02.anheyu.com/adminuploads/1/2022/09/24/632e9643611ec.jpg",
      tips: "性格"
    },
    type: "json"
  },
  {
    frontendPath: "frontDesk.about.maxim",
    backendKey: constant.KeyAboutPageMaxim,
    defaultValue: {
      top: "生活明朗，",
      bottom: "万物可爱。",
      tips: "座右铭"
    },
    type: "json"
  },
  {
    frontendPath: "frontDesk.about.buff",
    backendKey: constant.KeyAboutPageBuff,
    defaultValue: {
      top: "脑回路新奇的 酸菜鱼",
      bottom: "二次元指数 MAX",
      tips: "特长"
    },
    type: "json"
  },
  {
    frontendPath: "frontDesk.about.game",
    backendKey: constant.KeyAboutPageGame,
    defaultValue: {
      background:
        "https://img02.anheyu.com/adminuploads/1/2022/12/19/63a079ca63c8a.webp",
      title: "原神",
      uid: "UID: 125766904",
      tips: "爱好游戏"
    },
    type: "json"
  },
  {
    frontendPath: "frontDesk.about.comic",
    backendKey: constant.KeyAboutPageComic,
    defaultValue: {
      title: "追番",
      tips: "爱好番剧",
      list: [
        {
          cover:
            "https://img02.anheyu.com/adminuploads/1/2022/12/13/63988658aa1b1.webp",
          href: "https://www.bilibili.com/bangumi/media/md5267750/?spm_id_from=666.25.b_6d656469615f6d6f64756c65.1",
          name: "约定的梦幻岛"
        },
        {
          cover:
            "https://img02.anheyu.com/adminuploads/1/2022/12/13/6398864e572ed.webp",
          href: "https://www.bilibili.com/bangumi/media/md28229899/?spm_id_from=666.25.b_6d656469615f6d6f64756c65.1",
          name: "咒术回战"
        },
        {
          cover:
            "https://img02.anheyu.com/adminuploads/1/2022/12/13/639886315d658.webp",
          href: "https://www.bilibili.com/bangumi/media/md8892/?spm_id_from=666.25.b_6d656469615f6d6f64756c65.1",
          name: "紫罗兰永恒花园"
        },
        {
          cover:
            "https://img02.anheyu.com/adminuploads/1/2022/12/13/639886403d472.webp",
          href: "https://www.bilibili.com/bangumi/media/md22718131/?spm_id_from=666.25.b_6d656469615f6d6f64756c65.1",
          name: "鬼灭之刃"
        },
        {
          cover:
            "https://img02.anheyu.com/adminuploads/1/2022/12/13/6398862649585.webp",
          href: "https://www.bilibili.com/bangumi/media/md135652/?spm_id_from=666.25.b_6d656469615f6d6f64756c65.1",
          name: "JOJO的奇妙冒险 黄金之风"
        }
      ]
    },
    type: "json"
  },
  {
    frontendPath: "frontDesk.about.like",
    backendKey: constant.KeyAboutPageLike,
    defaultValue: {
      background:
        "https://img02.anheyu.com/adminuploads/1/2022/09/24/632f0dd8f33c6.webp",
      title: "数码科技",
      bottom: "手机、电脑软硬件",
      tips: "关注偏好"
    },
    type: "json"
  },
  {
    frontendPath: "frontDesk.about.music",
    backendKey: constant.KeyAboutPageMusic,
    defaultValue: {
      background:
        "https://p2.music.126.net/Mrg1i7DwcwjWBvQPIMt_Mg==/79164837213438.jpg",
      title: "许嵩、民谣、华语流行",
      link: "/music",
      tips: "音乐偏好"
    },
    type: "json"
  },
  {
    frontendPath: "frontDesk.about.careers",
    backendKey: constant.KeyAboutPageCareers,
    defaultValue: {
      img: "https://img02.anheyu.com/adminuploads/1/2022/09/26/6330e9bcc39cc.png",
      title: "无限进步",
      tips: "生涯",
      list: [
        {
          color: "#357ef5",
          desc: "EDU,软件工程专业"
        }
      ]
    },
    type: "json"
  },
  {
    frontendPath: "frontDesk.about.skillsTips",
    backendKey: constant.KeyAboutPageSkillsTips,
    defaultValue: {
      title: "开启创造力",
      tips: "技能"
    },
    type: "json"
  },
  {
    frontendPath: "frontDesk.about.statisticsBackground",
    backendKey: constant.KeyAboutPageStatisticsBackground,
    defaultValue:
      "https://upload-bbs.miyoushe.com/upload/2025/08/20/125766904/0d61be5d781e63642743883eb5580024_4597572337700501322.png",
    type: "string"
  },
  {
    frontendPath: "frontDesk.about.customCode",
    backendKey: constant.KeyAboutPageCustomCode,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.about.customCodeHtml",
    backendKey: constant.KeyAboutPageCustomCodeHtml,
    defaultValue: "",
    type: "string"
  },
  // 板块开关配置
  {
    frontendPath: "frontDesk.about.enableAuthorBox",
    backendKey: constant.KeyAboutPageEnableAuthorBox,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.about.enablePageContent",
    backendKey: constant.KeyAboutPageEnablePageContent,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.about.enableSkills",
    backendKey: constant.KeyAboutPageEnableSkills,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.about.enableCareers",
    backendKey: constant.KeyAboutPageEnableCareers,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.about.enableStatistic",
    backendKey: constant.KeyAboutPageEnableStatistic,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.about.enableMapAndInfo",
    backendKey: constant.KeyAboutPageEnableMapAndInfo,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.about.enablePersonality",
    backendKey: constant.KeyAboutPageEnablePersonality,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.about.enablePhoto",
    backendKey: constant.KeyAboutPageEnablePhoto,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.about.enableMaxim",
    backendKey: constant.KeyAboutPageEnableMaxim,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.about.enableBuff",
    backendKey: constant.KeyAboutPageEnableBuff,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.about.enableGame",
    backendKey: constant.KeyAboutPageEnableGame,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.about.enableComic",
    backendKey: constant.KeyAboutPageEnableComic,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.about.enableLikeTech",
    backendKey: constant.KeyAboutPageEnableLikeTech,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.about.enableMusic",
    backendKey: constant.KeyAboutPageEnableMusic,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.about.enableCustomCode",
    backendKey: constant.KeyAboutPageEnableCustomCode,
    defaultValue: true,
    type: "boolean"
  }
];

const frontDeskDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "frontDesk.home.siteOwnerName",
    backendKey: constant.KeyFrontDeskSiteOwnerName,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.siteOwnerEmail",
    backendKey: constant.KeyFrontDeskSiteOwnerEmail,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerOwnerName",
    backendKey: constant.KeyFooterOwnerName,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerOwnerSince",
    backendKey: constant.KeyFooterOwnerSince,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerRuntimeEnable",
    backendKey: constant.KeyFooterRuntimeEnable,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.home.footerRuntimeLaunchTime",
    backendKey: constant.KeyFooterRuntimeLaunchTime,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerRuntimeWorkImg",
    backendKey: constant.KeyFooterRuntimeWorkImg,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerRuntimeWorkDesc",
    backendKey: constant.KeyFooterRuntimeWorkDesc,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerRuntimeOffDutyImg",
    backendKey: constant.KeyFooterRuntimeOffDutyImg,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerRuntimeOffDutyDesc",
    backendKey: constant.KeyFooterRuntimeOffDutyDesc,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerSocialBarCenterImg",
    backendKey: constant.KeyFooterSocialBarCenterImg,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerListRandomFriends",
    backendKey: constant.KeyFooterListRandomFriends,
    defaultValue: "0",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerBarAuthorLink",
    backendKey: constant.KeyFooterBarAuthorLink,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerBarCCLink",
    backendKey: constant.KeyFooterBarCCLink,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.navTravel",
    backendKey: constant.KeyHeaderNavTravel,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.home.navClock",
    backendKey: constant.KeyHeaderNavClock,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.home.homeTop",
    backendKey: constant.KeyHomeTop,
    defaultValue: {},
    type: "json"
  },
  {
    frontendPath: "frontDesk.home.creativity",
    backendKey: constant.KeyCreativity,
    defaultValue: {},
    type: "json"
  },
  {
    frontendPath: "frontDesk.home.footerBadgesEnable",
    backendKey: constant.KeyFooterBadgeEnable,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.home.footerBadges",
    backendKey: constant.KeyFooterBadge,
    defaultValue: [],
    type: "json"
  },
  {
    frontendPath: "frontDesk.home.footerSocialBarLeft",
    backendKey: constant.KeyFooterSocialBarLeft,
    defaultValue: [],
    type: "json"
  },
  {
    frontendPath: "frontDesk.home.footerSocialBarRight",
    backendKey: constant.KeyFooterSocialBarRight,
    defaultValue: [],
    type: "json"
  },
  {
    frontendPath: "frontDesk.home.footerList",
    backendKey: constant.KeyFooterList,
    defaultValue: [],
    type: "json"
  },
  {
    frontendPath: "frontDesk.home.footerBarLinkList",
    backendKey: constant.KeyFooterBarLinkList,
    defaultValue: [],
    type: "json"
  },
  {
    frontendPath: "frontDesk.home.menu",
    backendKey: constant.KeyHeaderMenu,
    defaultValue: [],
    type: "json"
  },
  {
    frontendPath: "frontDesk.home.navMenuItems",
    backendKey: constant.KeyHeaderNavMenu,
    defaultValue: [],
    type: "json"
  },
  {
    frontendPath: "frontDesk.home.music.player.enable",
    backendKey: constant.KeyMusicPlayerEnable,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.home.music.player.playlist_id",
    backendKey: constant.KeyMusicPlayerPlaylistID,
    defaultValue: "8152976493",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.music.player.custom_playlist",
    backendKey: constant.KeyMusicPlayerCustomPlaylist,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.music.api.base_url",
    backendKey: constant.KeyMusicAPIBaseURL,
    defaultValue: "https://metings.qjqq.cn",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.music.vinyl.background",
    backendKey: constant.KeyMusicVinylBackground,
    defaultValue: "/static/img/music-vinyl-background.png",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.music.vinyl.outer",
    backendKey: constant.KeyMusicVinylOuter,
    defaultValue: "/static/img/music-vinyl-outer.png",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.music.vinyl.inner",
    backendKey: constant.KeyMusicVinylInner,
    defaultValue: "/static/img/music-vinyl-inner.png",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.music.vinyl.needle",
    backendKey: constant.KeyMusicVinylNeedle,
    defaultValue: "/static/img/music-vinyl-needle.png",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.music.vinyl.groove",
    backendKey: constant.KeyMusicVinylGroove,
    defaultValue: "/static/img/music-vinyl-groove.png",
    type: "string"
  }
];

const sidebarDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "frontDesk.sidebar.authorEnable",
    backendKey: constant.KeySidebarAuthorEnable,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.sidebar.userAvatar",
    backendKey: constant.KeyUserAvatar,
    defaultValue: "/static/img/avatar.jpg",
    type: "string"
  },
  {
    frontendPath: "frontDesk.sidebar.authorDescription",
    backendKey: constant.KeySidebarAuthorDescription,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.sidebar.authorStatusImg",
    backendKey: constant.KeySidebarAuthorStatusImg,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.sidebar.authorSkills",
    backendKey: constant.KeySidebarAuthorSkills,
    defaultValue: [],
    type: "json"
  },
  {
    frontendPath: "frontDesk.sidebar.authorSocial",
    backendKey: constant.KeySidebarAuthorSocial,
    defaultValue: {},
    type: "json"
  },
  {
    frontendPath: "frontDesk.sidebar.wechatEnable",
    backendKey: constant.KeySidebarWechatEnable,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.sidebar.wechatFace",
    backendKey: constant.KeySidebarWechatFace,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.sidebar.wechatBackFace",
    backendKey: constant.KeySidebarWechatBackFace,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.sidebar.wechatBlurredBackground",
    backendKey: constant.KeySidebarWechatBlurredBackground,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.sidebar.tagsEnable",
    backendKey: constant.KeySidebarTagsEnable,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.sidebar.tagsHighlight",
    backendKey: constant.KeySidebarTagsHighlight,
    defaultValue: [],
    type: "json"
  },
  {
    frontendPath: "frontDesk.sidebar.siteInfoTotalPostCount",
    backendKey: constant.KeySidebarSiteInfoTotalPostCount,
    defaultValue: true,
    type: "number"
  },
  {
    frontendPath: "frontDesk.sidebar.siteInfoRuntimeEnable",
    backendKey: constant.KeySidebarSiteInfoRuntimeEnable,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.sidebar.siteInfoTotalWordCount",
    backendKey: constant.KeySidebarSiteInfoTotalWordCount,
    defaultValue: true,
    type: "number"
  },
  {
    frontendPath: "frontDesk.sidebar.archiveDisplayMonths",
    backendKey: constant.KeySidebarArchiveDisplayMonths,
    defaultValue: 6,
    type: "number"
  },
  {
    frontendPath: "frontDesk.sidebar.seriesPostCount",
    backendKey: constant.KeySidebarSeriesPostCount,
    defaultValue: 6,
    type: "number"
  },
  {
    frontendPath: "frontDesk.sidebar.weatherEnable",
    backendKey: constant.KeyWeatherEnable,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.sidebar.weatherEnablePage",
    backendKey: constant.KeyWeatherEnablePage,
    defaultValue: "all",
    type: "string"
  },
  {
    frontendPath: "frontDesk.sidebar.weatherQweatherKey",
    backendKey: constant.KeyWeatherQweatherKey,
    defaultValue: "b16a1fa0e63c46a4b8f28abfb06ae3fe",
    type: "string"
  },
  {
    frontendPath: "frontDesk.sidebar.weatherQweatherAPIHost",
    backendKey: constant.KeyWeatherQweatherAPIHost,
    defaultValue: "nj6r6pm8pt.re.qweatherapi.com",
    type: "string"
  },
  {
    frontendPath: "frontDesk.sidebar.weatherIPAPIKey",
    backendKey: constant.KeyWeatherIPAPIKey,
    defaultValue: "Kq1pRjB3WyDja7rhKcWV9f5QU8",
    type: "string"
  },
  {
    frontendPath: "frontDesk.sidebar.weatherLoading",
    backendKey: constant.KeyWeatherLoading,
    defaultValue:
      "https://cdn.cbd.int/hexo-butterfly-clock-anzhiyu/lib/loading.gif",
    type: "string"
  },
  {
    frontendPath: "frontDesk.sidebar.weatherDefaultRectangle",
    backendKey: constant.KeyWeatherDefaultRect,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.sidebar.weatherRectangle",
    backendKey: constant.KeyWeatherRectangle,
    defaultValue: "112.6534116,27.96920845",
    type: "string"
  },
  {
    frontendPath: "frontDesk.sidebar.customSidebarBlocks",
    backendKey: constant.KeyCustomSidebar,
    defaultValue: [],
    type: "json"
  },
  {
    frontendPath: "frontDesk.sidebar.tocCollapseMode",
    backendKey: constant.KeySidebarTocCollapseMode,
    defaultValue: false,
    type: "boolean"
  }
];

const commentDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "frontDesk.comment.enable",
    backendKey: constant.KeyCommentEnable,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.comment.loginRequired",
    backendKey: constant.KeyCommentLoginRequired,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.comment.pageSize",
    backendKey: constant.KeyCommentPageSize,
    defaultValue: 10,
    type: "number"
  },
  {
    frontendPath: "frontDesk.comment.masterTag",
    backendKey: constant.KeyCommentMasterTag,
    defaultValue: "博主",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.placeholder",
    backendKey: constant.KeyCommentPlaceholder,
    defaultValue: "欢迎留下宝贵的建议啦～",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.emojiCDN",
    backendKey: constant.KeyCommentEmojiCDN,
    defaultValue:
      "https://npm.elemecdn.com/anzhiyu-theme-static@1.1.3/twikoo/twikoo.json",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.bloggerEmail",
    backendKey: constant.KeyCommentBloggerEmail,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.anonymousEmail",
    backendKey: constant.KeyCommentAnonymousEmail,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.showUA",
    backendKey: constant.KeyCommentShowUA,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.comment.showRegion",
    backendKey: constant.KeyCommentShowRegion,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.comment.allowImageUpload",
    backendKey: constant.KeyCommentAllowImageUpload,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.comment.limitPerMinute",
    backendKey: constant.KeyCommentLimitPerMinute,
    defaultValue: 5,
    type: "number"
  },
  {
    frontendPath: "frontDesk.comment.limitLength",
    backendKey: constant.KeyCommentLimitLength,
    defaultValue: 10000,
    type: "number"
  },
  {
    frontendPath: "frontDesk.comment.forbiddenWords",
    backendKey: constant.KeyCommentForbiddenWords,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.aiDetectEnable",
    backendKey: constant.KeyCommentAIDetectEnable,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.comment.aiDetectAPIURL",
    backendKey: constant.KeyCommentAIDetectAPIURL,
    defaultValue: "https://v1.nsuuu.com/api/AiDetect",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.aiDetectAction",
    backendKey: constant.KeyCommentAIDetectAction,
    defaultValue: "pending",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.aiDetectRiskLevel",
    backendKey: constant.KeyCommentAIDetectRiskLevel,
    defaultValue: "medium",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.qqAPIURL",
    backendKey: constant.KeyCommentQQAPIURL,
    defaultValue: "https://v1.nsuuu.com/api/qqname",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.qqAPIKey",
    backendKey: constant.KeyCommentQQAPIKey,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.notifyAdmin",
    backendKey: constant.KeyCommentNotifyAdmin,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.comment.notifyReply",
    backendKey: constant.KeyCommentNotifyReply,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.comment.pushooChannel",
    backendKey: constant.KeyPushooChannel,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.pushooURL",
    backendKey: constant.KeyPushooURL,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.webhookRequestBody",
    backendKey: constant.KeyWebhookRequestBody,
    defaultValue: `{"title":"#{TITLE}","content":"#{BODY}","site_name":"#{SITE_NAME}","comment_author":"#{NICK}","comment_content":"#{COMMENT}","parent_author":"#{PARENT_NICK}","parent_content":"#{PARENT_COMMENT}","post_url":"#{POST_URL}","author_email":"#{MAIL}","author_ip":"#{IP}","time":"#{TIME}"}`,
    type: "json"
  },
  {
    frontendPath: "frontDesk.comment.webhookHeaders",
    backendKey: constant.KeyWebhookHeaders,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.scMailNotify",
    backendKey: constant.KeyScMailNotify,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.comment.mailSubject",
    backendKey: constant.KeyCommentMailSubject,
    defaultValue: "您在 [${SITE_NAME}] 上的评论收到了回复",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.mailSubjectAdmin",
    backendKey: constant.KeyCommentMailSubjectAdmin,
    defaultValue: "[${SITE_NAME}] 上有新评论了",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.mailTemplate",
    backendKey: constant.KeyCommentMailTemplate,
    defaultValue:
      "您在文章《${POST_TITLE}》下的评论收到了来自 ${NICK} 的回复：<br/>${COMMENT}<br/>点击查看：${POST_URL}",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.mailTemplateAdmin",
    backendKey: constant.KeyCommentMailTemplateAdmin,
    defaultValue:
      "文章《${POST_TITLE}》下有来自 ${NICK} 的新评论：<br/>${COMMENT}<br/>点击管理：${MANAGE_URL}",
    type: "string"
  }
];

const emailDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "frontDesk.email.resetPasswordSubject",
    backendKey: constant.KeyResetPasswordSubject,
    defaultValue: "【{{.AppName}}】重置您的账户密码",
    type: "string"
  },
  {
    frontendPath: "frontDesk.email.resetPasswordTemplate",
    backendKey: constant.KeyResetPasswordTemplate,
    defaultValue: `<!DOCTYPE html><html><head><title>重置密码</title></head><body><p>您好, {{.Nickname}}！</p><p>您正在请求重置您在 <strong>{{.AppName}}</strong> 的账户密码。</p><p>请点击以下链接以完成重置（此链接24小时内有效）：</p><p><a href="{{.ResetLink}}">重置我的密码</a></p><p>如果链接无法点击，请将其复制到浏览器地址栏中打开。</p><p>如果您没有请求重置密码，请忽略此邮件。</p><br/><p>感谢, <br/>{{.AppName}} 团队</p></body></html>`,
    type: "string"
  },
  {
    frontendPath: "frontDesk.email.activateAccountSubject",
    backendKey: constant.KeyActivateAccountSubject,
    defaultValue: "【{{.AppName}}】激活您的账户",
    type: "string"
  },
  {
    frontendPath: "frontDesk.email.activateAccountTemplate",
    backendKey: constant.KeyActivateAccountTemplate,
    defaultValue: `<!DOCTYPE html><html><head><title>激活您的账户</title></head><body><p>您好, {{.Nickname}}！</p><p>欢迎注册 <strong>{{.AppName}}</strong>！</p><p>请点击以下链接以激活您的账户（此链接24小时内有效）：</p><p><a href="{{.ActivateLink}}">激活我的账户</a></p><p>如果链接无法点击，请将其复制到浏览器地址栏中打开。</p><p>如果您并未注册，请忽略此邮件。</p><br/><p>感谢, <br/>{{.AppName}} 团队</p></body></html>`,
    type: "string"
  },
  {
    frontendPath: "frontDesk.email.enableUserActivation",
    backendKey: constant.KeyEnableUserActivation,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.email.smtpHost",
    backendKey: constant.KeySmtpHost,
    defaultValue: "smtp.example.com",
    type: "string"
  },
  {
    frontendPath: "frontDesk.email.smtpPort",
    backendKey: constant.KeySmtpPort,
    defaultValue: 587,
    type: "number"
  },
  {
    frontendPath: "frontDesk.email.smtpUsername",
    backendKey: constant.KeySmtpUsername,
    defaultValue: "user@example.com",
    type: "string"
  },
  {
    frontendPath: "frontDesk.email.smtpPassword",
    backendKey: constant.KeySmtpPassword,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.email.smtpSenderName",
    backendKey: constant.KeySmtpSenderName,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.email.smtpSenderEmail",
    backendKey: constant.KeySmtpSenderEmail,
    defaultValue: "noreply@example.com",
    type: "string"
  },
  {
    frontendPath: "frontDesk.email.smtpReplyToEmail",
    backendKey: constant.KeySmtpReplyToEmail,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.email.smtpForceSSL",
    backendKey: constant.KeySmtpForceSSL,
    defaultValue: false,
    type: "boolean"
  }
];

const fLinkDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "frontDesk.fLink.friendLinkDefaultCategory",
    backendKey: constant.KeyFriendLinkDefaultCategory,
    defaultValue: 2,
    type: "number"
  },
  {
    frontendPath: "frontDesk.fLink.friendLinkApplyCondition",
    backendKey: constant.KeyFriendLinkApplyCondition,
    defaultValue: [
      "我已添加 <b>安知鱼</b> 博客的友情链接",
      "我的链接主体为 <b>个人</b>，网站类型为<b>博客</b>",
      "我的网站现在可以在中国大陆区域正常访问",
      "网站内容符合中国大陆法律法规",
      "我的网站可以在1分钟内加载完成首屏"
    ],
    type: "json"
  },
  {
    frontendPath: "frontDesk.fLink.friendLinkApplyCustomCode",
    backendKey: constant.KeyFriendLinkApplyCustomCode,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.fLink.friendLinkApplyCustomCodeHtml",
    backendKey: constant.KeyFriendLinkApplyCustomCodeHtml,
    defaultValue: "",
    type: "string"
  },
  // 友链申请表单 placeholder 配置
  {
    frontendPath: "frontDesk.fLink.placeholderName",
    backendKey: constant.KeyFriendLinkPlaceholderName,
    defaultValue: "例如：安知鱼",
    type: "string"
  },
  {
    frontendPath: "frontDesk.fLink.placeholderURL",
    backendKey: constant.KeyFriendLinkPlaceholderURL,
    defaultValue: "https://blog.anheyu.com/",
    type: "string"
  },
  {
    frontendPath: "frontDesk.fLink.placeholderLogo",
    backendKey: constant.KeyFriendLinkPlaceholderLogo,
    defaultValue:
      "https://npm.elemecdn.com/anzhiyu-blog-static@1.0.4/img/avatar.jpg",
    type: "string"
  },
  {
    frontendPath: "frontDesk.fLink.placeholderDescription",
    backendKey: constant.KeyFriendLinkPlaceholderDescription,
    defaultValue: "生活明朗，万物可爱",
    type: "string"
  },
  {
    frontendPath: "frontDesk.fLink.placeholderSiteshot",
    backendKey: constant.KeyFriendLinkPlaceholderSiteshot,
    defaultValue: "https://example.com/siteshot.png (可选)",
    type: "string"
  },
  // 友链通知配置
  {
    frontendPath: "frontDesk.fLink.notifyAdmin",
    backendKey: constant.KeyFriendLinkNotifyAdmin,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.fLink.scMailNotify",
    backendKey: constant.KeyFriendLinkScMailNotify,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.fLink.pushooChannel",
    backendKey: constant.KeyFriendLinkPushooChannel,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.fLink.pushooURL",
    backendKey: constant.KeyFriendLinkPushooURL,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.fLink.webhookRequestBody",
    backendKey: constant.KeyFriendLinkWebhookRequestBody,
    defaultValue: "",
    type: "json"
  },
  {
    frontendPath: "frontDesk.fLink.webhookHeaders",
    backendKey: constant.KeyFriendLinkWebhookHeaders,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.fLink.mailSubjectAdmin",
    backendKey: constant.KeyFriendLinkMailSubjectAdmin,
    defaultValue: "{{.SITE_NAME}} 收到了来自 {{.LINK_NAME}} 的友链申请",
    type: "string"
  },
  {
    frontendPath: "frontDesk.fLink.mailTemplateAdmin",
    backendKey: constant.KeyFriendLinkMailTemplateAdmin,
    defaultValue:
      '<p>您好，</p><p>您的网站收到了来自 <strong>{{.LINK_NAME}}</strong> 的友链申请：</p><p>网站名称: <strong>{{.LINK_NAME}}</strong></p><p>网站地址: <a href="{{.LINK_URL}}">{{.LINK_URL}}</a></p><p>网站描述: {{.LINK_DESC}}</p><p>申请时间: {{.TIME}}</p><p>点击管理: <a href="{{.ADMIN_URL}}">{{.ADMIN_URL}}</a></p>',
    type: "string"
  },
  // 友链审核邮件通知配置
  {
    frontendPath: "frontDesk.fLink.reviewMailEnable",
    backendKey: constant.KeyFriendLinkReviewMailEnable,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.fLink.reviewMailSubjectApproved",
    backendKey: constant.KeyFriendLinkReviewMailSubjectApproved,
    defaultValue: "【{{.SITE_NAME}}】友链申请已通过",
    type: "string"
  },
  {
    frontendPath: "frontDesk.fLink.reviewMailTemplateApproved",
    backendKey: constant.KeyFriendLinkReviewMailTemplateApproved,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.fLink.reviewMailSubjectRejected",
    backendKey: constant.KeyFriendLinkReviewMailSubjectRejected,
    defaultValue: "【{{.SITE_NAME}}】友链申请未通过",
    type: "string"
  },
  {
    frontendPath: "frontDesk.fLink.reviewMailTemplateRejected",
    backendKey: constant.KeyFriendLinkReviewMailTemplateRejected,
    defaultValue: "",
    type: "string"
  }
];

// --- 即刻（说说）配置描述符 - PRO 专属 ---
const essayDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "frontDesk.essay.title",
    backendKey: constant.KeyEssayTitle,
    defaultValue: "即刻短文",
    type: "string"
  },
  {
    frontendPath: "frontDesk.essay.subTitle",
    backendKey: constant.KeyEssaySubTitle,
    defaultValue: "咸鱼的日常生活。",
    type: "string"
  },
  {
    frontendPath: "frontDesk.essay.tips",
    backendKey: constant.KeyEssayTips,
    defaultValue: "随时随地，分享生活",
    type: "string"
  },
  {
    frontendPath: "frontDesk.essay.buttonText",
    backendKey: constant.KeyEssayButtonText,
    defaultValue: "关于我",
    type: "string"
  },
  {
    frontendPath: "frontDesk.essay.buttonLink",
    backendKey: constant.KeyEssayButtonLink,
    defaultValue: "/about",
    type: "string"
  },
  {
    frontendPath: "frontDesk.essay.limit",
    backendKey: constant.KeyEssayLimit,
    defaultValue: 30,
    type: "number"
  },
  {
    frontendPath: "frontDesk.essay.homeEnable",
    backendKey: constant.KeyEssayHomeEnable,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.essay.topBackground",
    backendKey: constant.KeyEssayTopBackground,
    defaultValue:
      "https://img02.anheyu.com/adminuploads/1/2022/08/21/630249e2df20f.jpg",
    type: "string"
  }
];

// --- 朋友圈配置描述符 - PRO 专属 ---
const momentsDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "frontDesk.moments.enable",
    backendKey: constant.KeyMomentsEnable,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.moments.title",
    backendKey: constant.KeyMomentsTitle,
    defaultValue: "朋友圈",
    type: "string"
  },
  {
    frontendPath: "frontDesk.moments.subTitle",
    backendKey: constant.KeyMomentsSubTitle,
    defaultValue: "发现友链的精彩内容",
    type: "string"
  },
  {
    frontendPath: "frontDesk.moments.tips",
    backendKey: constant.KeyMomentsTips,
    defaultValue: "友链",
    type: "string"
  },
  {
    frontendPath: "frontDesk.moments.buttonText",
    backendKey: constant.KeyMomentsButtonText,
    defaultValue: "友情链接",
    type: "string"
  },
  {
    frontendPath: "frontDesk.moments.buttonLink",
    backendKey: constant.KeyMomentsButtonLink,
    defaultValue: "/link",
    type: "string"
  },
  {
    frontendPath: "frontDesk.moments.topBackground",
    backendKey: constant.KeyMomentsTopBackground,
    defaultValue:
      "https://upload-bbs.miyoushe.com/upload/2025/10/08/125766904/a56ae5efe37332c1b97e2f58f1687aff_8677681884411829295.png?x-oss-process=image/format,avif",
    type: "string"
  },
  {
    frontendPath: "frontDesk.moments.fetchInterval",
    backendKey: constant.KeyMomentsFetchInterval,
    defaultValue: 24,
    type: "number"
  },
  {
    frontendPath: "frontDesk.moments.maxItems",
    backendKey: constant.KeyMomentsMaxItems,
    defaultValue: 20,
    type: "number"
  },
  {
    frontendPath: "frontDesk.moments.displayLimit",
    backendKey: constant.KeyMomentsDisplayLimit,
    defaultValue: 50,
    type: "number"
  },
  {
    frontendPath: "frontDesk.moments.cacheDuration",
    backendKey: constant.KeyMomentsCacheDuration,
    defaultValue: 30,
    type: "number"
  },
  {
    frontendPath: "frontDesk.moments.rssTimeout",
    backendKey: constant.KeyMomentsRSSTimeout,
    defaultValue: 30,
    type: "number"
  },
  {
    frontendPath: "frontDesk.moments.minFetchInterval",
    backendKey: constant.KeyMomentsMinFetchInterval,
    defaultValue: 6,
    type: "number"
  },
  // 朋友圈通知配置
  {
    frontendPath: "frontDesk.moments.notifyAdmin",
    backendKey: constant.KeyMomentsNotifyAdmin,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.moments.scMailNotify",
    backendKey: constant.KeyMomentsScMailNotify,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.moments.pushooChannel",
    backendKey: constant.KeyMomentsPushooChannel,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.moments.pushooURL",
    backendKey: constant.KeyMomentsPushooURL,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.moments.webhookRequestBody",
    backendKey: constant.KeyMomentsWebhookRequestBody,
    defaultValue: "",
    type: "json"
  },
  {
    frontendPath: "frontDesk.moments.webhookHeaders",
    backendKey: constant.KeyMomentsWebhookHeaders,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.moments.mailSubjectAdmin",
    backendKey: constant.KeyMomentsMailSubjectAdmin,
    defaultValue: "{{.SITE_NAME}} 朋友圈有新文章",
    type: "string"
  },
  {
    frontendPath: "frontDesk.moments.mailTemplateAdmin",
    backendKey: constant.KeyMomentsMailTemplateAdmin,
    defaultValue:
      '<p>您好，</p><p>朋友圈抓取到来自 <strong>{{.LINK_NAME}}</strong> 的新文章：</p><p>文章标题: <strong>{{.POST_TITLE}}</strong></p><p>文章链接: <a href="{{.POST_URL}}">{{.POST_URL}}</a></p><p>发布时间: {{.TIME}}</p><p>查看朋友圈: <a href="{{.MOMENTS_URL}}">{{.MOMENTS_URL}}</a></p>',
    type: "string"
  }
];

// --- QQ互联登录配置描述符 - PRO 专属 ---
const qqConnectDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "frontDesk.oauth.qq.enable",
    backendKey: constant.KeyQQConnectEnable,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.oauth.qq.appID",
    backendKey: constant.KeyQQConnectAppID,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.oauth.qq.appKey",
    backendKey: constant.KeyQQConnectAppKey,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.oauth.qq.autoRegister",
    backendKey: constant.KeyQQConnectAutoRegister,
    defaultValue: false,
    type: "boolean"
  }
];

// --- 微信登录配置描述符 - PRO 专属 ---
const wechatDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "frontDesk.oauth.wechat.enable",
    backendKey: constant.KeyWechatEnable,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.oauth.wechat.appID",
    backendKey: constant.KeyWechatAppID,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.oauth.wechat.appSecret",
    backendKey: constant.KeyWechatAppSecret,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.oauth.wechat.loginMode",
    backendKey: constant.KeyWechatLoginMode,
    defaultValue: "auto",
    type: "string"
  },
  {
    frontendPath: "frontDesk.oauth.wechat.token",
    backendKey: constant.KeyWechatToken,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.oauth.wechat.encodingAESKey",
    backendKey: constant.KeyWechatEncodingAESKey,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.oauth.wechat.qrcodeLoginReply",
    backendKey: constant.KeyWechatQRCodeLoginReply,
    defaultValue: "登录成功!欢迎使用~",
    type: "string"
  },
  {
    frontendPath: "frontDesk.oauth.wechat.qrcodeBindReply",
    backendKey: constant.KeyWechatQRCodeBindReply,
    defaultValue: "账号绑定成功!",
    type: "string"
  },
  {
    frontendPath: "frontDesk.oauth.wechat.autoRegister",
    backendKey: constant.KeyWechatAutoRegister,
    defaultValue: false,
    type: "boolean"
  }
];

// --- Logto SSO 登录配置描述符 - PRO 专属 ---
const logtoDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "frontDesk.oauth.logto.enable",
    backendKey: constant.KeyLogtoEnable,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.oauth.logto.appID",
    backendKey: constant.KeyLogtoAppID,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.oauth.logto.appSecret",
    backendKey: constant.KeyLogtoAppSecret,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.oauth.logto.endpoint",
    backendKey: constant.KeyLogtoEndpoint,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.oauth.logto.directConnector",
    backendKey: constant.KeyLogtoDirectConnector,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.oauth.logto.displayName",
    backendKey: constant.KeyLogtoDisplayName,
    defaultValue: "Logto",
    type: "string"
  },
  {
    frontendPath: "frontDesk.oauth.logto.autoRegister",
    backendKey: constant.KeyLogtoAutoRegister,
    defaultValue: false,
    type: "boolean"
  }
];

// --- OpenID Connect (OIDC) 登录配置描述符 - PRO 专属 ---
const oidcDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "frontDesk.oauth.oidc.enable",
    backendKey: constant.KeyOIDCEnable,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.oauth.oidc.clientID",
    backendKey: constant.KeyOIDCClientID,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.oauth.oidc.clientSecret",
    backendKey: constant.KeyOIDCClientSecret,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.oauth.oidc.scope",
    backendKey: constant.KeyOIDCScope,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.oauth.oidc.wellknown",
    backendKey: constant.KeyOIDCWellknown,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.oauth.oidc.displayName",
    backendKey: constant.KeyOIDCDisplayName,
    defaultValue: "OIDC",
    type: "string"
  },
  {
    frontendPath: "frontDesk.oauth.oidc.autoRegister",
    backendKey: constant.KeyOIDCAutoRegister,
    defaultValue: false,
    type: "boolean"
  }
];

// --- 彩虹聚合登录配置描述符 - PRO 专属 ---
const rainbowDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "frontDesk.oauth.rainbow.enable",
    backendKey: constant.KeyRainbowEnable,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.oauth.rainbow.apiURL",
    backendKey: constant.KeyRainbowAPIURL,
    defaultValue: "https://login.qjqq.cn/",
    type: "string"
  },
  {
    frontendPath: "frontDesk.oauth.rainbow.appID",
    backendKey: constant.KeyRainbowAppID,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.oauth.rainbow.appKey",
    backendKey: constant.KeyRainbowAppKey,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.oauth.rainbow.loginMethods",
    backendKey: constant.KeyRainbowLoginMethods,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.oauth.rainbow.callbackURL",
    backendKey: constant.KeyRainbowCallbackURL,
    defaultValue: "",
    type: "string"
  }
];

// --- AI 配置描述符 - PRO 专属 ---
const aiDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "ai.summary.provider",
    backendKey: constant.KeyAISummaryProvider,
    defaultValue: "glm",
    type: "string"
  },
  {
    frontendPath: "ai.summary.apiKey",
    backendKey: constant.KeyAISummaryApiKey,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "ai.summary.apiURL",
    backendKey: constant.KeyAISummaryApiURL,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "ai.summary.model",
    backendKey: constant.KeyAISummaryModel,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "ai.summary.systemPrompt",
    backendKey: constant.KeyAISummarySystemPrompt,
    defaultValue:
      "你是一个专业的内容总结助手。请为用户提供的文章内容生成一个简洁、准确的摘要。摘要应该：1)概括文章的主要观点和核心内容；2)长度控制在100-200字之间；3)语言简洁明了；4)保持客观中性的语调；5)使用单段连续文本，不要分段、不要分点叙述。请直接输出摘要内容，不需要额外的解释或格式化。",
    type: "string"
  }
];

// --- AI 写作配置描述符 - PRO 专属 ---
const aiWritingDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "ai.writing.provider",
    backendKey: constant.KeyAIWritingProvider,
    defaultValue: "glm",
    type: "string"
  },
  {
    frontendPath: "ai.writing.apiKey",
    backendKey: constant.KeyAIWritingApiKey,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "ai.writing.apiURL",
    backendKey: constant.KeyAIWritingApiURL,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "ai.writing.model",
    backendKey: constant.KeyAIWritingModel,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "ai.writing.systemPrompt",
    backendKey: constant.KeyAIWritingSystemPrompt,
    defaultValue: `你是一个专业的技术博客写作助手。用户会给你一个主题或大纲，你需要根据它来撰写一篇高质量的博客文章。

写作要求：
1. 使用 Markdown 格式，结构清晰，层次分明
2. 语言流畅自然，适合中文读者阅读
3. 内容充实，有深度，避免空泛的描述
4. 适当使用代码示例（如果是技术文章）
5. 适当使用引言引出文章主题
6. 技术文章可以适当使用流程图、架构图等图表来辅助说明
7. 涉及数学或科学内容时可以使用公式来增强表达

你可以使用以下博客专属标签来增强文章的表现力：

【提示标签】用于显示悬停提示：
{tip text="悬停显示的文字" content="提示内容" position="top" theme="info"}{/tip}
- position 可选：top/bottom/left/right
- theme 可选：dark/light/info/warning/error/success

【折叠内容】用于折叠较长的内容：
:::folding
折叠框标题
这是折叠框的内容，默认是收起状态。
支持 **Markdown** 语法。
:::

:::folding open
默认展开的折叠框
这个折叠框默认是展开状态。
:::

:::folding #FF6B9D
粉色折叠框
使用十六进制颜色值自定义边框和标题背景色。
:::

**注意**：折叠框的标题（第一行）必须是纯文本，不能使用 # 等 Markdown 标题语法。

【选项卡】用于分组展示内容：
:::tabs active=1
== tab 标签1
内容1
== tab 标签2
内容2
:::

【图库】用于展示图片集：
:::gallery
![图片1描述](图片URL1)
![图片2描述](图片URL2)
:::

【链接卡片】用于展示外部链接：
{linkcard url=https://example.com title=链接标题 sitename=网站名称 icon=anzhiyu-icon-link tips=引用站外地址}{/linkcard}

icon 参数支持三种格式：
1. AnZhiYu 图标字体类名：如 anzhiyu-icon-link
2. Iconify 图标：如 ri:github-fill、mdi:home（格式为 prefix:name）
3. 图片链接：http:// 或 https:// 开头的图片 URL

【按钮】用于添加交互按钮：
{btn url=https://blog.anheyu.com text=访问博客 icon=anzhiyu-icon-link color=blue}{/btn}

icon 参数支持三种格式（同上）：
1. anzhiyu-icon-xxx
2. Iconify：ri:github-fill
3. 图片 URL：https://example.com/icon.png

【隐藏内容】用于隐藏答案/彩蛋：
:::hidden
这是默认的隐藏内容，点击"查看隐藏内容"按钮后显示。
支持 **Markdown** 语法。
:::

:::hidden display=点击查看答案 bg=#FF6B9D color=#fff
这是一道题目的答案。
:::

行内隐藏：这是一段文字，{hide display=查看}这部分内容被隐藏了{/hide}。

【按钮组】用于展示多个带描述的大按钮：
:::btns cols=3 style=card
- icon=anzhiyu-icon-link title=安知鱼博客 url=https://blog.anheyu.com desc=技术分享与生活记录 color=blue
- icon=ri:github-fill title=GitHub url=https://github.com desc=代码托管平台
:::

icon 参数支持三种格式（同上）：
1. anzhiyu-icon-xxx
2. Iconify：ri:github-fill
3. 图片 URL：https://example.com/logo.png

【视频画廊】用于网格展示视频：
:::video-gallery cols=2 ratio=16:9 gap=20px
url=https://example.com/video1.mp4 title=教程第一集 poster=https://example.com/poster1.jpg desc=基础入门
url=https://example.com/video2.mp4 title=教程第二集 poster=https://example.com/poster2.jpg desc=进阶技巧
:::

【音乐播放器】用于嵌入网易云音乐：
{music id=554241732}{/music}

【行内样式】用于强调文字：
{u}下划线{/u} / {emp}着重号{/emp} / {wavy}波浪线{/wavy} / {del}删除线{/del} / {kbd}Ctrl{/kbd} / {psw}password{/psw}

请根据用户的需求，合理使用这些标签来丰富文章内容。注意不要过度使用标签，保持文章的可读性。

**重要**：只能使用以上示例中展示的语法格式`,
    type: "string"
  },
  {
    frontendPath: "ai.writing.maxTokens",
    backendKey: constant.KeyAIWritingMaxTokens,
    defaultValue: 4096,
    type: "number"
  },
  {
    frontendPath: "ai.writing.temperature",
    backendKey: constant.KeyAIWritingTemperature,
    defaultValue: 0.7,
    type: "number"
  }
];

// --- AI 播客配置描述符 - PRO 专属 ---
const aiPodcastDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "ai.podcast.enable",
    backendKey: constant.KeyAIPodcastEnable,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "ai.podcast.appId",
    backendKey: constant.KeyAIPodcastAppId,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "ai.podcast.accessKey",
    backendKey: constant.KeyAIPodcastAccessKey,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "ai.podcast.resourceId",
    backendKey: constant.KeyAIPodcastResourceId,
    defaultValue: "volc.service_type.10050",
    type: "string"
  },
  {
    frontendPath: "ai.podcast.speaker1",
    backendKey: constant.KeyAIPodcastSpeaker1,
    defaultValue: "zh_male_dayixiansheng_v2_saturn_bigtts",
    type: "string"
  },
  {
    frontendPath: "ai.podcast.speaker2",
    backendKey: constant.KeyAIPodcastSpeaker2,
    defaultValue: "zh_female_mizaitongxue_v2_saturn_bigtts",
    type: "string"
  },
  {
    frontendPath: "ai.podcast.useHeadMusic",
    backendKey: constant.KeyAIPodcastUseHeadMusic,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "ai.podcast.useTailMusic",
    backendKey: constant.KeyAIPodcastUseTailMusic,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "ai.podcast.audioFormat",
    backendKey: constant.KeyAIPodcastAudioFormat,
    defaultValue: "mp3",
    type: "string"
  },
  {
    frontendPath: "ai.podcast.sampleRate",
    backendKey: constant.KeyAIPodcastSampleRate,
    defaultValue: 24000,
    type: "number"
  },
  {
    frontendPath: "ai.podcast.speechRate",
    backendKey: constant.KeyAIPodcastSpeechRate,
    defaultValue: 0,
    type: "number"
  },
  {
    frontendPath: "ai.podcast.buttonText",
    backendKey: constant.KeyAIPodcastButtonText,
    defaultValue: "AI 播客",
    type: "string"
  },
  {
    frontendPath: "ai.podcast.buttonIcon",
    backendKey: constant.KeyAIPodcastButtonIcon,
    defaultValue: "ri:mic-fill",
    type: "string"
  }
];

const seoDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "frontDesk.seo.autoSubmit",
    backendKey: constant.KeySEOAutoSubmit,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.seo.baidu.enable",
    backendKey: constant.KeySEOBaiduEnable,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.seo.baidu.site",
    backendKey: constant.KeySEOBaiduSite,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.seo.baidu.token",
    backendKey: constant.KeySEOBaiduToken,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.seo.bing.enable",
    backendKey: constant.KeySEOBingEnable,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.seo.bing.apiKey",
    backendKey: constant.KeySEOBingAPIKey,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.seo.bing.siteURL",
    backendKey: constant.KeySEOBingSiteURL,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.seo.google.enable",
    backendKey: constant.KeySEOGoogleEnable,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.seo.google.credential",
    backendKey: constant.KeySEOGoogleCredential,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.seo.retryTimes",
    backendKey: constant.KeySEORetryTimes,
    defaultValue: "3",
    type: "string"
  },
  {
    frontendPath: "frontDesk.seo.retryInterval",
    backendKey: constant.KeySEORetryInterval,
    defaultValue: "5",
    type: "string"
  }
];

export const allSettingDescriptors = [
  ...siteDescriptors,
  ...pageDescriptors,
  ...fileDescriptors,
  ...postDescriptors,
  ...equipmentDescriptors,
  ...recentCommentsDescriptors,
  ...aboutPageDescriptors,
  ...frontDeskDescriptors,
  ...sidebarDescriptors,
  ...commentDescriptors,
  ...emailDescriptors,
  ...fLinkDescriptors,
  ...essayDescriptors,
  ...momentsDescriptors,
  ...qqConnectDescriptors,
  ...wechatDescriptors,
  ...logtoDescriptors,
  ...oidcDescriptors,
  ...rainbowDescriptors,
  ...seoDescriptors,
  ...aiDescriptors,
  ...aiWritingDescriptors,
  ...aiPodcastDescriptors
];
