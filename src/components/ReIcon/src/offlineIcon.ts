/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-15 11:31:00
 * @LastEditTime: 2025-10-02 20:13:04
 * @LastEditors: 安知鱼
 */
// 这里存放本地图标，在 src/layout/index.vue 文件中加载，避免在首启动加载
import { addIcon } from "@iconify/vue/dist/offline";

// 本地菜单图标，后端在路由的 icon 中返回对应的图标字符串并且前端在此处使用 addIcon 添加即可渲染菜单图标
// @iconify-icons/ep
import Lollipop from "@iconify-icons/ep/lollipop";
import HomeFilled from "@iconify-icons/ep/home-filled";
addIcon("ep:lollipop", Lollipop);
addIcon("ep:home-filled", HomeFilled);
// @iconify-icons/ri
import Search from "@iconify-icons/ri/search-line";
import InformationLine from "@iconify-icons/ri/information-line";
import AppsFill from "@iconify-icons/ri/apps-fill";
import Chat1Fill from "@iconify-icons/ri/chat-1-fill";
import EditFill from "@iconify-icons/ri/edit-fill";
import Lock2Fill from "@iconify-icons/ri/lock-2-fill";
import UserFill from "@iconify-icons/ri/user-fill";
import ContractRightLine from "@iconify-icons/ri/contract-right-line";
import CameraFill from "@iconify-icons/ri/camera-fill";
import Notification3Fill from "@iconify-icons/ri/notification-3-fill";
import QqFill from "@iconify-icons/ri/qq-fill";
import WechatFill from "@iconify-icons/ri/wechat-fill";
import DvdFill from "@iconify-icons/ri/dvd-fill";
import ArticleFill from "@iconify-icons/ri/article-fill";
import TimeFill from "@iconify-icons/ri/time-fill";
import SmartphoneFill from "@iconify-icons/ri/smartphone-fill";
import QrCodeFill from "@iconify-icons/ri/qr-code-fill";
import CheckFill from "@iconify-icons/ri/check-fill";
import CheckboxCircleFill from "@iconify-icons/ri/checkbox-circle-fill";
import ErrorWarningFill from "@iconify-icons/ri/error-warning-fill";
import ArrowLeftSLine from "@iconify-icons/ri/arrow-left-s-line";
import LockPasswordFill from "@iconify-icons/ri/lock-password-fill";
import MailFill from "@iconify-icons/ri/mail-fill";
// OAuth登录图标
import AlipayFill from "@iconify-icons/ri/alipay-fill";
import WeiboFill from "@iconify-icons/ri/weibo-fill";
import BaiduFill from "@iconify-icons/ri/baidu-fill";
import TiktokFill from "@iconify-icons/ri/tiktok-fill";
import GithubFill from "@iconify-icons/ri/github-fill";
import GitRepositoryFill from "@iconify-icons/ri/git-repository-fill";
import GoogleFill from "@iconify-icons/ri/google-fill";
import MicrosoftFill from "@iconify-icons/ri/microsoft-fill";
import FacebookFill from "@iconify-icons/ri/facebook-fill";
// OAuth绑定卡片使用的图标
import ShieldUserFill from "@iconify-icons/ri/shield-user-fill";
import RouterFill from "@iconify-icons/ri/router-fill";
import LinkM from "@iconify-icons/ri/link-m";
import ErrorWarningLine from "@iconify-icons/ri/error-warning-line";
// 会员中心图标
import VipCrown2Fill from "@iconify-icons/ri/vip-crown-2-fill";
import VipCrownLine from "@iconify-icons/ri/vip-crown-line";
import ShoppingCart2Line from "@iconify-icons/ri/shopping-cart-2-line";
// 用户弹窗图标
import Notification3Line from "@iconify-icons/ri/notification-3-line";
import Notification2Line from "@iconify-icons/ri/notification-2-line";
import Notification2Fill from "@iconify-icons/ri/notification-2-fill";
import ArticleLine from "@iconify-icons/ri/article-line";
import User3Line from "@iconify-icons/ri/user-3-line";
import Settings3Line from "@iconify-icons/ri/settings-3-line";
// 工单图标
import CustomerService2Fill from "@iconify-icons/ri/customer-service-2-fill";
addIcon("ri:search-line", Search);
addIcon("ri:information-line", InformationLine);
addIcon("ri:apps-fill", AppsFill);
addIcon("ri:chat-1-fill", Chat1Fill);
addIcon("ri:edit-fill", EditFill);
addIcon("ri:lock-2-fill", Lock2Fill);
addIcon("ri:user-fill", UserFill);
addIcon("ri:contract-right-line", ContractRightLine);
addIcon("ri:camera-fill", CameraFill);
addIcon("ri:notification-3-fill", Notification3Fill);
addIcon("ri:qq-fill", QqFill);
addIcon("ri:wechat-fill", WechatFill);
addIcon("ri:dvd-fill", DvdFill);
addIcon("ri:article-fill", ArticleFill);
addIcon("ri:time-fill", TimeFill);
addIcon("ri:smartphone-fill", SmartphoneFill);
addIcon("ri:qr-code-fill", QrCodeFill);
addIcon("ri:check-fill", CheckFill);
addIcon("ri:checkbox-circle-fill", CheckboxCircleFill);
addIcon("ri:error-warning-fill", ErrorWarningFill);
addIcon("ri:arrow-left-s-line", ArrowLeftSLine);
addIcon("ri:lock-password-fill", LockPasswordFill);
addIcon("ri:mail-fill", MailFill);
// OAuth登录图标注册
addIcon("ri:alipay-fill", AlipayFill);
addIcon("ri:weibo-fill", WeiboFill);
addIcon("ri:baidu-fill", BaiduFill);
addIcon("ri:tiktok-fill", TiktokFill);
addIcon("ri:github-fill", GithubFill);
addIcon("ri:git-repository-fill", GitRepositoryFill);
addIcon("ri:google-fill", GoogleFill);
addIcon("ri:microsoft-fill", MicrosoftFill);
addIcon("ri:facebook-fill", FacebookFill);
// OAuth绑定卡片图标注册
addIcon("ri:shield-user-fill", ShieldUserFill);
addIcon("ri:router-fill", RouterFill);
addIcon("ri:link-m", LinkM);
addIcon("ri:error-warning-line", ErrorWarningLine);
// 会员中心图标注册
addIcon("ri:vip-crown-2-fill", VipCrown2Fill);
addIcon("ri:vip-crown-line", VipCrownLine);
addIcon("ri:shopping-cart-2-line", ShoppingCart2Line);
// 用户弹窗图标注册
addIcon("ri:notification-3-line", Notification3Line);
addIcon("ri:notification-2-line", Notification2Line);
addIcon("ri:notification-2-fill", Notification2Fill);
addIcon("ri:article-line", ArticleLine);
addIcon("ri:user-3-line", User3Line);
addIcon("ri:settings-3-line", Settings3Line);
// 工单图标注册
addIcon("ri:customer-service-2-fill", CustomerService2Fill);
// Twitter 图标在 ri 包中不存在，使用在线图标
