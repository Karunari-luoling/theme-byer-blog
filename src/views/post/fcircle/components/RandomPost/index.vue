<!--
 * @Description: 友链的随机文章（钓鱼功能）
 * @Author: 安知鱼
 * @Date: 2025-10-08
-->
<script lang="ts" setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getRandomPost } from "@/api/moments";
import type { RandomPostData } from "@/api/moments";
import { ElMessage } from "element-plus";

const route = useRoute();
const router = useRouter();

// 是否在友链页面
const isLinkPage = computed(() => route.path === "/link");

// 友链随机文章前面的tips
const randomPostTipsOne = ref("");
// 友链随机文章信息
const randomPostInfo = ref<RandomPostData>({
  author: "",
  avatar: "",
  created: "",
  link: "",
  title: "",
  updated: ""
});
// 加载状态
const loading = ref(true);
// 称号
const honor = ref("");
// 过于饥饿
const hungerError = ref(false);
// 钓鱼次数
const randomPostTimes = ref(0);
// 是否正在钓鱼
const randomPostWorking = ref(false);
// 点击次数
let randomPostClick = 0;
// 是否透明（防止连点）
const isOpacity = ref(false);

// 友链随机文章提示语
const randomPostTips = [
  "钓到了绝世好文！",
  "在河边打了个喷嚏，吓跑了",
  "你和小伙伴抢夺着",
  "你击败了巨龙，在巢穴中发现了",
  "挖掘秦始皇坟时找到了",
  "在路边闲逛的时候随手买了一个",
  "从学校班主任那拿来了孩子上课偷偷看的",
  "你的同桌无情的从你的语文书中撕下了那篇你最喜欢的",
  "考古学家近日发现了",
  "外星人降临地球学习地球文化，落地时被你塞了",
  "从图书馆顶层的隐秘角落里发现了闪着金光的",
  "徒弟修炼走火入魔，为师立刻掏出了",
  "在大山中唱山歌，隔壁的阿妹跑来了，带着",
  "隔壁家的孩子数学考了满分，都是因为看了",
  "隔壁家的孩子英语考了满分，都是因为看了",
  "小米研发了全新一代MIX手机，据说灵感",
  "修炼渡劫成功，还好提前看了",
  "库克坐上了苹果CEO的宝座，因为他面试的时候看了",
  "阿里巴巴大喊芝麻开门，映入眼帘的就是",
  "师傅说练武要先炼心，然后让我好生研读",
  "科考队在南极大陆发现了被冰封的",
  "飞机窗户似乎被一张纸糊上了，仔细一看是",
  "历史上满写的仁义道德四个字，透过字缝里却全是",
  "十几年前的录音机似乎还能够使用，插上电发现正在播的是",
  "新版语文书拟增加一篇熟读并背诵的",
  "经调查，99%的受访者都没有背诵过",
  "今年的高考满分作文是",
  "唐僧揭开了佛祖压在五指山上的",
  "科学家发现能够解决衰老的秘密，就是每日研读",
  "英特尔发布了全新的至强处理器，其芯片的制造原理都是",
  "新的iPhone产能很足，新的进货渠道是",
  "今年亩产突破了八千万斤，多亏了",
  "陆隐一统天上宗，在无数祖境高手的目光下宣读了",
  "黑钻风跟白钻风说道，吃了唐僧肉能长生不老，他知道是因为看了",
  "上卫生间没带纸，直接提裤跑路也不愿意玷污手中",
  "种下一篇文章就会产生很多很多文章，我种下了",
  "三十年河东，三十年河西，莫欺我没有看过",
  "踏破铁血无觅处，得来全靠",
  "今日双色球中了两千万，预测全靠",
  "因为卷子上没写名字，老师罚抄",
  "为了抗议世间的不公，割破手指写下了",
  "在艺术大街上被贴满了相同的纸，走近一看是",
  "这区区迷阵岂能难得住我？其实能走出来多亏了",
  "今日被一篇文章顶上了微博热搜，它是",
  "你送给乞丐一个暴富秘籍，它是",
  "UZI一个走A拿下五杀，在事后采访时说他当时回想起了",
  "科学家解刨了第一个感染丧尸病毒的人，发现丧尸抗体存在于",
  "如果你有梦想的话，就要努力去看",
  "决定我们成为什么样人的，不是我们的能力，而是是否看过",
  "有信心不一定会成功，没信心就去看",
  "你真正是谁并不重要，重要的是你看没看过",
  "玄天境重要的是锻体，为师赠你此书，好好修炼去吧，这是",
  "上百祖境高手在天威湖大战三天三夜为了抢夺",
  "这化仙池水乃上古真仙对后人的考校，要求熟读并背诵",
  "庆氏三千年根基差点竟被你小子毁于一旦，能够被我拯救全是因为我看了"
];

// 默认鱼数和饥饿鱼数
const defaultFish = 5;
const hungryFish = 10;

// 获取随机数
function getRandomNum(min: number, max?: number): number {
  if (max === undefined) {
    return Number(Math.random() * min + 1);
  }
  return Number(Math.random() * (max - min + 1) + min);
}

// 获取友链的随机文章
async function fetchRandomPost() {
  loading.value = true;
  let randomNum: number;

  if (!randomPostWorking.value && document.getElementById("random-post")) {
    randomPostWorking.value = true;
    randomPostTipsOne.value =
      randomPostTips[Math.floor(Math.random() * randomPostTips.length)];

    // 根据钓鱼次数设置称号
    honor.value =
      randomPostTimes.value > 10000
        ? "愿者上钩"
        : randomPostTimes.value > 1000
          ? "俯览天下"
          : randomPostTimes.value > 100
            ? "绝世渔夫"
            : randomPostTimes.value > 75
              ? "钓鱼王者"
              : randomPostTimes.value > 50
                ? "钓鱼宗师"
                : randomPostTimes.value > 20
                  ? "钓鱼专家"
                  : randomPostTimes.value > 5
                    ? "钓鱼高手"
                    : "钓鱼新手";

    // 立即增加旋转次数，让用户看到旋转动画
    randomPostTimes.value += 1;
    localStorage.setItem("randomPostTimes", randomPostTimes.value.toString());

    randomNum = getRandomNum(1000, 3000);
    if (randomPostTimes.value === 1) {
      randomNum = 0; // 首次立即返回
    }
    isOpacity.value = true;

    // 检查是否过于饥饿（在友链页面不会饥饿失败）
    if (
      !isLinkPage.value &&
      randomPostClick * hungryFish + defaultFish < randomPostTimes.value &&
      Math.round(Math.random()) === 0
    ) {
      hungerError.value = true;
      loading.value = false;
      randomPostWorking.value = false;
      isOpacity.value = false;
    } else {
      try {
        const response = await getRandomPost();
        if (response.code === 200 && response.data) {
          if (document.querySelector("#random-post")) {
            window.setTimeout(() => {
              randomPostInfo.value = response.data;
              loading.value = false;
              randomPostWorking.value = false;
              isOpacity.value = false;
              hungerError.value = false;
            }, randomNum);
          }
        } else {
          ElMessage.error(response.message || "获取友链随机文章失败");
          loading.value = false;
          randomPostWorking.value = false;
          isOpacity.value = false;
        }
      } catch (error) {
        ElMessage.error("获取友链随机文章失败");
        console.error(error);
        loading.value = false;
        randomPostWorking.value = false;
        isOpacity.value = false;
      }
    }
  }
}

// 初始化友链随机文章
function initRandomPost() {
  if (
    document.querySelector(".random-post-start") &&
    localStorage.randomPostTimes
  ) {
    randomPostTimes.value = parseInt(localStorage.randomPostTimes, 10);
    randomPostClick = parseInt(localStorage.randomPostClick || "0", 10);
  }
  fetchRandomPost();
}

// 点击友链随机文章链接
function handleRandomClickLink() {
  randomPostClick += 1;
  localStorage.setItem("randomPostClick", randomPostClick.toString());
}

// 跳转到友链页面
function goToLinkPage() {
  router.push("/link");
}

// 计算旋转角度
const rotationStyle = computed(() => ({
  transform: `rotate(${360 * randomPostTimes.value}deg)`,
  transitionDuration: "0.3s"
}));

onMounted(() => {
  initRandomPost();
});
</script>

<template>
  <div class="random-post-container">
    <div class="title-section">
      <div class="title-left">
        <h2>🎣 钓鱼</h2>
        <a
          :class="['random-post-start', { opacity: isOpacity }]"
          :style="rotationStyle"
          @click="fetchRandomPost"
        >
          <i class="anzhiyufont anzhiyu-icon-arrow-rotate-right" />
        </a>
      </div>
      <div v-if="!isLinkPage" class="title-right">
        <a class="random-post-all" @click="goToLinkPage">全部友链</a>
      </div>
    </div>
    <div id="random-post" class="random-post-content">
      <div v-if="loading">
        {{
          randomPostTimes >= 5
            ? `钓鱼中... （Lv.${randomPostTimes} 当前称号：${honor}）`
            : "钓鱼中..."
        }}
      </div>
      <template v-else-if="hungerError">
        因为只钓鱼不吃鱼，过分饥饿导致本次钓鱼失败...(点击任意一篇钓鱼获得的文章即可恢复）
      </template>
      <template v-else>
        {{ randomPostTipsOne }} 来自友链
        <b> {{ randomPostInfo.author }} </b> 的文章：
        <a
          class="random-friends-post"
          target="_blank"
          :href="randomPostInfo.link"
          @click="handleRandomClickLink"
        >
          {{ randomPostInfo.title }}
        </a>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.random-post-container {
  margin-bottom: 1.5rem;

  .title-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 0.5rem;
    line-height: 2;

    .title-left {
      display: flex;
      align-items: center;

      h2 {
        position: relative;
        padding-top: 0;
        margin: 0.6rem 0;
        font-weight: 700;
      }

      .random-post-start {
        margin-left: 0.5rem;
        font-weight: 700;
        color: var(--anzhiyu-fontcolor);
        cursor: pointer;
        transition:
          transform 0.3s,
          color 0.3s,
          opacity 0.3s;

        &:hover {
          color: var(--anzhiyu-main);
        }

        &.opacity {
          opacity: 0.2;
        }
      }
    }

    .title-right {
      .random-post-all {
        font-weight: 700;
        color: var(--anzhiyu-fontcolor);
        text-decoration: none;
        cursor: pointer;

        &:hover {
          color: var(--anzhiyu-main);
        }
      }
    }
  }

  .random-post-content {
    min-height: 32px;
    padding: 20px 30px;
    margin-top: 8px;
    line-height: 1.8;
    background: var(--anzhiyu-card-bg);
    border: var(--style-border);
    border-radius: 12px;
    box-shadow: var(--anzhiyu-shadow-border);

    .random-friends-post {
      padding: 0 0.2em;
      font-weight: 500;
      color: var(--anzhiyu-fontcolor);
      text-decoration: none;
      border-bottom: solid 2px var(--anzhiyu-lighttext);
      transition: all 0.3s;

      &:hover {
        color: var(--anzhiyu-white);
        background: var(--anzhiyu-main);
        border-bottom: 2px solid transparent !important;
        border-radius: 0.25em;
        box-shadow: var(--anzhiyu-shadow-lightblack);
      }
    }
  }
}
</style>
