<template>
  <el-form label-position="top" class="oauth-settings-form">
    <el-divider content-position="left">
      <h3>第三方登录配置</h3>
    </el-divider>

    <!-- QQ互联登录配置 -->
    <div class="config-section">
      <h4 class="section-title">
        <el-icon><UserFilled /></el-icon>
        QQ互联登录
      </h4>
      <div class="config-grid">
        <el-form-item label="启用QQ互联登录">
          <el-switch
            v-model="model.qq.enable"
            active-text="开启"
            inactive-text="关闭"
          />
          <div class="form-item-help">是否启用QQ互联登录功能。</div>
        </el-form-item>
      </div>

      <template v-if="model.qq.enable">
        <div class="config-grid">
          <el-form-item label="应用ID (APP ID)">
            <el-input
              v-model="model.qq.appID"
              placeholder="请输入QQ互联应用ID"
              clearable
            />
            <div class="form-item-help">
              QQ互联应用ID，可在
              <a href="https://connect.qq.com/" target="_blank">QQ互联</a>
              申请。
            </div>
          </el-form-item>

          <el-form-item label="应用密钥 (APP KEY)">
            <el-input
              v-model="model.qq.appKey"
              placeholder="请输入QQ互联应用密钥"
              clearable
            />
            <div class="form-item-help">QQ互联应用密钥。</div>
          </el-form-item>

          <el-form-item label="回调地址（自动生成）">
            <el-input :value="qqCallbackUrl" readonly>
              <template #prepend>
                <el-icon><Link /></el-icon>
              </template>
              <template #append>
                <el-button
                  :icon="DocumentCopy"
                  @click="copyToClipboard(qqCallbackUrl)"
                />
              </template>
            </el-input>
            <div class="form-item-help">
              QQ互联回调地址（从站点URL自动生成），需在QQ互联管理面板配置此地址。此地址用于登录和用户中心绑定两个场景。
            </div>
          </el-form-item>

          <el-form-item label="自动注册">
            <el-switch
              v-model="model.qq.autoRegister"
              active-text="开启"
              inactive-text="关闭"
            />
            <div class="form-item-help">
              是否允许未绑定的QQ账号自动创建用户。<strong>开启后</strong>，首次使用QQ登录会自动创建账号，但该账号日后只能通过QQ登录，无法使用邮箱等其他方式登录；<strong>关闭后</strong>，未绑定的QQ账号无法使用此种方式登录，需要先注册账号再在用户中心手动绑定。
            </div>
          </el-form-item>
        </div>
      </template>
    </div>

    <!-- Logto SSO 登录配置 -->
    <div class="config-section">
      <h4 class="section-title">
        <el-icon><Key /></el-icon>
        Logto SSO 登录
      </h4>
      <div class="config-grid">
        <el-form-item label="启用Logto登录">
          <el-switch
            v-model="model.logto.enable"
            active-text="开启"
            inactive-text="关闭"
          />
          <div class="form-item-help">
            是否启用Logto登录功能。Logto支持多种第三方登录平台（如Apple、GitHub、Microsoft、Google等）。
          </div>
        </el-form-item>
      </div>

      <template v-if="model.logto.enable">
        <div class="config-grid">
          <el-form-item label="应用ID">
            <el-input
              v-model="model.logto.appID"
              placeholder="请输入Logto应用ID"
              clearable
            />
            <div class="form-item-help">
              Logto应用ID，可在
              <a href="https://logto.io/" target="_blank">Logto</a>
              管理面板创建应用获取。
            </div>
          </el-form-item>

          <el-form-item label="应用密钥">
            <el-input
              v-model="model.logto.appSecret"
              placeholder="请输入Logto应用密钥"
              clearable
            />
            <div class="form-item-help">Logto应用密钥。</div>
          </el-form-item>

          <el-form-item label="端点地址">
            <el-input
              v-model="model.logto.endpoint"
              placeholder="请输入Logto端点地址"
              clearable
            >
              <template #prepend>
                <el-icon><Link /></el-icon>
              </template>
            </el-input>
            <div class="form-item-help">
              Logto端点地址，从应用管理面板获取。
            </div>
          </el-form-item>

          <el-form-item label="回调地址（自动生成）">
            <el-input :value="logtoCallbackUrl" readonly>
              <template #prepend>
                <el-icon><Link /></el-icon>
              </template>
              <template #append>
                <el-button
                  :icon="DocumentCopy"
                  @click="copyToClipboard(logtoCallbackUrl)"
                />
              </template>
            </el-input>
            <div class="form-item-help">
              Logto回调地址（从站点URL自动生成），需加入到Logto管理面板的"重定向
              URIs"。此地址用于登录和用户中心绑定两个场景。
            </div>
          </el-form-item>

          <el-form-item label="显示名称">
            <el-input
              v-model="model.logto.displayName"
              placeholder="例：vas.sso"
              clearable
            />
            <div class="form-item-help">
              登录方式显示名称，支持i18next键值，默认为"vas.sso"。
            </div>
          </el-form-item>

          <el-form-item label="直达连接器标识">
            <el-input
              v-model="model.logto.directConnector"
              placeholder="例：social:google（可选）"
              clearable
            />
            <div class="form-item-help">
              直达第三方登录连接器标识（如social:google），留空则显示Logto登录界面。
            </div>
          </el-form-item>

          <el-form-item label="自动注册">
            <el-switch
              v-model="model.logto.autoRegister"
              active-text="开启"
              inactive-text="关闭"
            />
            <div class="form-item-help">
              是否允许未绑定的账号自动创建用户。<strong>开启后</strong>，首次登录会自动创建账号，但该账号日后只能通过此方式登录，无法使用邮箱等其他方式登录；<strong>关闭后</strong>，未绑定的账号无法使用此种方式登录，需要先注册账号再在用户中心手动绑定。
            </div>
          </el-form-item>
        </div>
      </template>
    </div>

    <!-- 微信登录配置 -->
    <div class="config-section">
      <h4 class="section-title">
        <el-icon><ChatDotRound /></el-icon>
        微信登录
      </h4>
      <div class="config-grid">
        <el-form-item label="启用微信登录">
          <el-switch
            v-model="model.wechat.enable"
            active-text="开启"
            inactive-text="关闭"
          />
          <div class="form-item-help">是否启用微信登录功能。</div>
        </el-form-item>
      </div>

      <template v-if="model.wechat && model.wechat.enable">
        <div class="config-grid">
          <el-form-item label="应用ID (AppID)">
            <el-input
              v-model="model.wechat.appID"
              placeholder="请输入微信应用ID"
              clearable
            />
            <div class="form-item-help">
              微信开放平台应用ID,可在
              <a href="https://open.weixin.qq.com/" target="_blank"
                >微信开放平台</a
              >
              申请。
            </div>
          </el-form-item>

          <el-form-item label="应用密钥 (AppSecret)">
            <el-input
              v-model="model.wechat.appSecret"
              placeholder="请输入微信应用密钥"
              clearable
            />
            <div class="form-item-help">微信开放平台应用密钥。</div>
          </el-form-item>

          <el-form-item label="登录模式">
            <el-select
              v-model="model.wechat.loginMode"
              placeholder="请选择登录模式"
              style="width: 100%"
            >
              <el-option label="自动检测" value="auto">
                <span>自动检测</span>
                <span style="color: var(--anzhiyu-secondtext); font-size: 12px">
                  - 默认使用扫码模式
                </span>
              </el-option>
              <el-option label="PC端扫码登录" value="qrcode">
                <span>PC端扫码登录</span>
                <span style="color: var(--anzhiyu-secondtext); font-size: 12px">
                  - 适用于电脑浏览器
                </span>
              </el-option>
              <el-option label="微信内授权登录" value="in_app">
                <span>微信内授权登录</span>
                <span style="color: var(--anzhiyu-secondtext); font-size: 12px">
                  - 仅微信内浏览器可用
                </span>
              </el-option>
            </el-select>
            <div class="form-item-help">
              <strong>自动检测:</strong> 默认使用扫码登录模式<br />
              <strong>PC端扫码:</strong>
              显示二维码,用户使用微信扫码登录,适用于电脑浏览器<br />
              <strong>微信内授权:</strong>
              仅在微信内置浏览器中可用,直接跳转授权页面
            </div>
          </el-form-item>

          <el-form-item label="服务器配置Token">
            <el-input
              v-model="model.wechat.token"
              placeholder="用于验证微信服务器请求"
              clearable
            />
            <div class="form-item-help">
              用于验证微信服务器请求,建议使用随机字符串(仅公众号扫码登录需要)。
            </div>
          </el-form-item>

          <el-form-item label="消息加解密密钥(可选)">
            <el-input
              v-model="model.wechat.encodingAESKey"
              placeholder="43位随机字符串(可选)"
              clearable
            />
            <div class="form-item-help">
              用于消息加解密,选填。如果使用明文模式可以不填。
            </div>
          </el-form-item>

          <el-form-item label="扫码登录成功消息">
            <el-input
              v-model="model.wechat.qrcodeLoginReply"
              type="textarea"
              :rows="2"
              placeholder="登录成功!欢迎使用~"
            />
            <div class="form-item-help">
              用户扫码登录成功后,公众号自动发送的欢迎消息。
            </div>
          </el-form-item>

          <el-form-item label="扫码绑定成功消息">
            <el-input
              v-model="model.wechat.qrcodeBindReply"
              type="textarea"
              :rows="2"
              placeholder="账号绑定成功!"
            />
            <div class="form-item-help">
              用户扫码绑定账号成功后,公众号自动发送的消息。
            </div>
          </el-form-item>

          <el-form-item v-if="model.wechat.token" label="服务器URL（自动生成）">
            <el-input :value="wechatServerUrl" readonly>
              <template #prepend>
                <el-icon><Link /></el-icon>
              </template>
              <template #append>
                <el-button
                  :icon="DocumentCopy"
                  @click="copyToClipboard(wechatServerUrl)"
                />
              </template>
            </el-input>
            <div class="form-item-help">
              微信公众号服务器URL(从站点URL自动生成),需要在微信公众号后台配置。<br />
              配置步骤: 微信公众号后台 → 开发 → 基本配置 → 服务器配置 →
              填写URL和Token → 提交验证
            </div>
          </el-form-item>

          <el-form-item label="回调地址（自动生成）">
            <el-input :value="wechatCallbackUrl" readonly>
              <template #prepend>
                <el-icon><Link /></el-icon>
              </template>
              <template #append>
                <el-button
                  :icon="DocumentCopy"
                  @click="copyToClipboard(wechatCallbackUrl)"
                />
              </template>
            </el-input>
            <div class="form-item-help">
              微信登录回调地址（从站点URL自动生成），需在微信开放平台管理面板配置此地址。此地址用于登录和用户中心绑定两个场景。
            </div>
          </el-form-item>

          <el-form-item label="自动注册">
            <el-switch
              v-model="model.wechat.autoRegister"
              active-text="开启"
              inactive-text="关闭"
            />
            <div class="form-item-help">
              是否允许未绑定的微信账号自动创建用户。<strong>开启后</strong>，首次使用微信登录会自动创建账号，但该账号日后只能通过微信登录，无法使用邮箱等其他方式登录；<strong>关闭后</strong>，未绑定的微信账号无法使用此种方式登录，需要先注册账号再在用户中心手动绑定。
            </div>
          </el-form-item>
        </div>
      </template>
    </div>

    <!-- OpenID Connect (OIDC) 登录配置 -->
    <div class="config-section">
      <h4 class="section-title">
        <el-icon><Connection /></el-icon>
        OpenID Connect (OIDC) 登录
      </h4>
      <div class="config-grid">
        <el-form-item label="启用OIDC登录">
          <el-switch
            v-model="model.oidc.enable"
            active-text="开启"
            inactive-text="关闭"
          />
          <div class="form-item-help">
            是否启用OpenID
            Connect登录功能。OIDC是一个开放的认证协议，支持大多数第三方身份平台。
          </div>
        </el-form-item>
      </div>

      <template v-if="model.oidc.enable">
        <div class="config-grid">
          <el-form-item label="客户端ID">
            <el-input
              v-model="model.oidc.clientID"
              placeholder="请输入OIDC客户端ID"
              clearable
            />
            <div class="form-item-help">第三方身份平台创建的应用客户端ID。</div>
          </el-form-item>

          <el-form-item label="客户端密钥">
            <el-input
              v-model="model.oidc.clientSecret"
              placeholder="请输入OIDC客户端密钥"
              clearable
            />
            <div class="form-item-help">
              第三方身份平台创建的应用客户端密钥。
            </div>
          </el-form-item>

          <el-form-item label="发现文档URL">
            <el-input
              v-model="model.oidc.wellknown"
              placeholder="例：https://provider-domain/.well-known/openid-configuration"
              clearable
            >
              <template #prepend>
                <el-icon><Link /></el-icon>
              </template>
            </el-input>
            <div class="form-item-help">
              第三方平台的.well-known/openid-configuration地址。
            </div>
          </el-form-item>

          <el-form-item label="回调地址（自动生成）">
            <el-input :value="oidcCallbackUrl" readonly>
              <template #prepend>
                <el-icon><Link /></el-icon>
              </template>
              <template #append>
                <el-button
                  :icon="DocumentCopy"
                  @click="copyToClipboard(oidcCallbackUrl)"
                />
              </template>
            </el-input>
            <div class="form-item-help">
              OIDC回调地址（从站点URL自动生成），需加入到第三方平台的"重定向
              URI"配置。此地址用于登录和用户中心绑定两个场景。
            </div>
          </el-form-item>

          <el-form-item label="显示名称">
            <el-input
              v-model="model.oidc.displayName"
              placeholder="例：vas.sso"
              clearable
            />
            <div class="form-item-help">
              登录方式显示名称，支持i18next键值，默认为"vas.sso"。
            </div>
          </el-form-item>

          <el-form-item label="额外Scope">
            <el-input
              v-model="model.oidc.scope"
              placeholder="例：profile,email（可选）"
              clearable
            />
            <div class="form-item-help">
              额外请求的Scope（逗号分隔），默认已包含openid,email,profile。
            </div>
          </el-form-item>

          <el-form-item label="自动注册">
            <el-switch
              v-model="model.oidc.autoRegister"
              active-text="开启"
              inactive-text="关闭"
            />
            <div class="form-item-help">
              是否允许未绑定的账号自动创建用户。<strong>开启后</strong>，首次登录会自动创建账号，但该账号日后只能通过此方式登录，无法使用邮箱等其他方式登录；<strong>关闭后</strong>，未绑定的账号无法使用此种方式登录，需要先注册账号再在用户中心手动绑定。
            </div>
          </el-form-item>
        </div>
      </template>
    </div>

    <!-- 彩虹聚合登录配置 -->
    <div class="config-section">
      <h4 class="section-title">
        <el-icon><Sunrise /></el-icon>
        彩虹聚合登录
      </h4>
      <div class="config-grid">
        <el-form-item label="启用彩虹聚合登录">
          <el-switch
            v-model="model.rainbow.enable"
            active-text="开启"
            inactive-text="关闭"
          />
          <div class="form-item-help">
            是否启用彩虹聚合登录功能。彩虹聚合登录支持QQ、微信、支付宝、微博、百度、GitHub、Gitee、钉钉、华为、小米、Google、Microsoft、Facebook、Twitter等多种登录方式。
          </div>
        </el-form-item>
      </div>

      <template v-if="model.rainbow.enable">
        <div class="config-grid">
          <el-form-item label="接口地址">
            <el-input
              v-model="model.rainbow.apiURL"
              placeholder="例：https://login.qjqq.cn/"
              clearable
            >
              <template #prepend>
                <el-icon><Link /></el-icon>
              </template>
            </el-input>
            <div class="form-item-help">
              彩虹聚合登录服务的接口地址，默认为 https://login.qjqq.cn/
            </div>
          </el-form-item>

          <el-form-item label="AppID">
            <el-input
              v-model="model.rainbow.appID"
              placeholder="请输入彩虹聚合AppID"
              clearable
            />
            <div class="form-item-help">在彩虹聚合登录平台申请的应用ID。</div>
          </el-form-item>

          <el-form-item label="AppKey">
            <el-input
              v-model="model.rainbow.appKey"
              placeholder="请输入彩虹聚合AppKey"
              clearable
            />
            <div class="form-item-help">在彩虹聚合登录平台申请的应用密钥。</div>
          </el-form-item>

          <el-form-item label="启用的登录方式">
            <el-select
              v-model="rainbowLoginMethodsArray"
              multiple
              placeholder="请选择要启用的登录方式"
              style="width: 100%"
              clearable
              @change="handleRainbowMethodsChange"
            >
              <el-option label="QQ登录" value="qq" />
              <el-option label="微信" value="wechat" />
              <el-option label="支付宝" value="alipay" />
              <el-option label="微博" value="weibo" />
              <el-option label="百度" value="baidu" />
              <el-option label="抖音" value="douyin" />
              <el-option label="GitHub" value="github" />
              <el-option label="Gitee" value="gitee" />
              <el-option label="钉钉" value="dingtalk" />
              <el-option label="华为" value="huawei" />
              <el-option label="小米" value="xiaomi" />
              <el-option label="Google" value="google" />
              <el-option label="Microsoft" value="microsoft" />
              <el-option label="Facebook" value="facebook" />
              <el-option label="Twitter" value="twitter" />
            </el-select>
            <div class="form-item-help">
              选择需要开启的登录方式。此处启用的方式，请确保彩虹聚合登录的服务商已提供该登录方式。允许与下方主题自带的登录方式同时启用，如果此处启用的登录方式和下方相同登录方式同时开启，则此处优先。
            </div>
          </el-form-item>

          <el-form-item label="回调地址（自动生成）">
            <el-input :value="rainbowCallbackUrl" readonly>
              <template #prepend>
                <el-icon><Link /></el-icon>
              </template>
              <template #append>
                <el-button
                  :icon="DocumentCopy"
                  @click="copyToClipboard(rainbowCallbackUrl)"
                />
              </template>
            </el-input>
            <div class="form-item-help">
              彩虹聚合登录回调地址（从站点URL自动生成），需在彩虹聚合登录管理面板配置此地址。
            </div>
          </el-form-item>
        </div>
      </template>
    </div>

    <!-- 使用说明 -->
    <div class="config-section">
      <h4 class="section-title">
        <el-icon><InfoFilled /></el-icon>
        使用说明
      </h4>
      <el-alert
        title="配置指南"
        type="info"
        :closable="false"
        style="margin-bottom: 16px"
      >
        <ul class="help-list">
          <li>
            <strong>QQ互联：</strong>前往
            <a href="https://connect.qq.com/" target="_blank"
              >https://connect.qq.com/</a
            >
            申请应用
          </li>
          <li>
            <strong>微信登录：</strong>前往
            <a href="https://open.weixin.qq.com/" target="_blank"
              >https://open.weixin.qq.com/</a
            >
            申请网站应用。支持两种登录模式:
            <ul style="margin-left: 20px; margin-top: 4px">
              <li>
                <strong>PC端扫码:</strong>
                显示二维码供用户扫码登录,适用于电脑浏览器
              </li>
              <li>
                <strong>微信内授权:</strong>
                在微信内置浏览器中直接授权,无需扫码
              </li>
              <li>
                <strong>自动检测:</strong>
                系统自动判断环境并选择合适的登录方式(默认)
              </li>
            </ul>
          </li>
          <li>
            <strong>Logto：</strong>可自建服务或使用云服务，官网
            <a href="https://logto.io/" target="_blank">https://logto.io/</a>
          </li>
          <li><strong>OIDC：</strong>支持任何标准OpenID Connect身份提供商</li>
          <li>
            <strong>彩虹聚合登录：</strong>支持多种主流第三方登录方式，可在
            <a href="https://login.qjqq.cn/" target="_blank">
              https://login.qjqq.cn/
            </a>
            申请服务
          </li>
          <li>
            <strong>回调地址</strong
            >必须在第三方平台配置相同的地址，用于OAuth授权流程
          </li>
          <li>
            回调地址同时支持<strong>登录</strong>和<strong>用户中心绑定</strong>两个场景
          </li>
          <li>
            开启<strong>自动注册</strong>后，首次登录会自动创建账号，但该账号只能使用第三方方式登录
          </li>
          <li>
            关闭<strong>自动注册</strong>后，建议用户先注册账号，再在<strong>用户中心</strong>绑定第三方账号
          </li>
          <li>
            已注册用户可以在<strong>用户中心</strong>绑定/解绑第三方账号，实现多种登录方式
          </li>
        </ul>
      </el-alert>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from "vue";
import {
  UserFilled,
  Key,
  Connection,
  Link,
  InfoFilled,
  DocumentCopy,
  Sunrise,
  ChatDotRound
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

interface OAuthSettings {
  qq: {
    enable: boolean;
    appID: string;
    appKey: string;
    autoRegister: boolean;
  };
  wechat: {
    enable: boolean;
    appID: string;
    appSecret: string;
    loginMode: string;
    token: string;
    encodingAESKey: string;
    qrcodeLoginReply: string;
    qrcodeBindReply: string;
    autoRegister: boolean;
  };
  logto: {
    enable: boolean;
    appID: string;
    appSecret: string;
    endpoint: string;
    directConnector: string;
    displayName: string;
    autoRegister: boolean;
  };
  oidc: {
    enable: boolean;
    clientID: string;
    clientSecret: string;
    scope: string;
    wellknown: string;
    displayName: string;
    autoRegister: boolean;
  };
  rainbow: {
    enable: boolean;
    apiURL: string;
    appID: string;
    appKey: string;
    loginMethods: string;
    callbackURL: string;
  };
}

const model = defineModel<OAuthSettings>({ required: true });

// 彩虹聚合登录方式数组（用于多选框）
const rainbowLoginMethodsArray = ref<string[]>([]);

// 初始化时将逗号分隔的字符串转为数组
watch(
  () => model.value.rainbow.loginMethods,
  newVal => {
    if (newVal) {
      rainbowLoginMethodsArray.value = newVal.split(",").filter(m => m.trim());
    } else {
      rainbowLoginMethodsArray.value = [];
    }
  },
  { immediate: true }
);

// 处理彩虹登录方式变更
const handleRainbowMethodsChange = (methods: string[]) => {
  model.value.rainbow.loginMethods = methods.join(",");
};

// 从父组件注入的完整设置对象，用于获取站点URL
const parentSettings = inject<any>("settingsForm", null);

// 计算回调地址
const siteUrl = computed(() => {
  // 尝试从注入的设置中获取站点URL
  const url = parentSettings?.site?.primaryUrl || "";
  // 移除末尾的斜杠
  return url.replace(/\/$/, "");
});

const qqCallbackUrl = computed(() => {
  return siteUrl.value ? `${siteUrl.value}/callback/qq` : "";
});

const wechatCallbackUrl = computed(() => {
  return siteUrl.value ? `${siteUrl.value}/callback/wechat` : "";
});

const logtoCallbackUrl = computed(() => {
  return siteUrl.value ? `${siteUrl.value}/callback/openid/0` : "";
});

const oidcCallbackUrl = computed(() => {
  return siteUrl.value ? `${siteUrl.value}/callback/openid/2` : "";
});

const rainbowCallbackUrl = computed(() => {
  return siteUrl.value ? `${siteUrl.value}/callback/rainbow` : "";
});

const wechatServerUrl = computed(() => {
  return siteUrl.value ? `${siteUrl.value}/api/pro/wechat/callback` : "";
});

// 复制回调地址到剪贴板
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success("回调地址已复制到剪贴板");
  } catch (err) {
    ElMessage.error("复制失败，请手动复制");
  }
};
</script>

<style scoped lang="scss">
.oauth-settings-form {
  max-width: 800px;
}

.el-divider {
  margin: 0 0 28px;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor);
  }
}

.config-section {
  margin-bottom: 40px;

  .section-title {
    display: flex;
    gap: 8px;
    align-items: center;
    margin: 0 0 20px;
    font-size: 16px;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor);

    .el-icon {
      color: var(--anzhiyu-theme);
    }
  }

  .config-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;

    .el-form-item {
      margin-bottom: 0;

      .form-item-help {
        width: 100%;
        margin-top: 4px;
        font-size: 12px;
        line-height: 1.4;
        color: var(--anzhiyu-secondtext);

        a {
          color: var(--anzhiyu-theme);
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }
  }
}

.help-list {
  margin: 8px 0 0;
  padding-left: 20px;
  font-size: 13px;
  line-height: 2;

  li {
    margin-bottom: 4px;

    strong {
      color: var(--anzhiyu-fontcolor);
    }

    a {
      color: var(--anzhiyu-theme);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

@media (width >= 768px) {
  .config-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

// 移动端适配
@media (width <= 768px) {
  .oauth-settings-form {
    padding: 0;
  }

  .el-divider {
    margin: 0 0 20px;

    h3 {
      font-size: 16px;
    }
  }

  .config-section {
    margin-bottom: 28px;

    .section-title {
      gap: 6px;
      margin-bottom: 16px;
      font-size: 15px;

      .el-icon {
        font-size: 18px;
      }
    }

    .config-grid {
      gap: 16px;

      .el-form-item {
        :deep(.el-form-item__label) {
          padding-bottom: 6px;
          font-size: 14px;
          line-height: 1.5;
        }

        :deep(.el-input__inner) {
          font-size: 14px;
        }

        :deep(.el-switch) {
          height: 22px;
        }

        :deep(.el-switch__label) {
          font-size: 13px;
        }

        .form-item-help {
          margin-top: 6px;
          font-size: 11px;
          line-height: 1.4;
        }
      }
    }
  }

  // 输入框前置元素
  :deep(.el-input-group__prepend) {
    padding: 0 10px;

    .el-icon {
      font-size: 14px;
    }
  }

  .help-list {
    font-size: 12px;
    line-height: 1.8;

    li {
      margin-bottom: 6px;
    }
  }
}
</style>
