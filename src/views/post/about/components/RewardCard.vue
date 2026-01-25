<!--
 * @Description: 赞赏名单卡片组件
 * @Author: 安知鱼
 * @Date: 2025-10-28
-->
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { listPublishedDonationsApi, type DonationItem } from "@/api/donation";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import AnDialog from "@/components/AnDialog";

defineOptions({
  name: "RewardCard"
});

const siteConfigStore = useSiteConfigStore();

const donations = ref<DonationItem[]>([]);
const loading = ref(true);
const total = ref(0);
const showRewardDialog = ref(false);

// 获取打赏列表
const fetchDonations = async () => {
  try {
    loading.value = true;
    const res = await listPublishedDonationsApi({ page: 1, page_size: 100 });
    if (res.code === 200 && res.data) {
      donations.value = res.data.list || [];
      total.value = res.data.total || 0;
    }
  } catch (error) {
    console.error("获取打赏列表失败:", error);
  } finally {
    loading.value = false;
  }
};

// 按日期排序获取最新更新时间
const latestUpdate = computed(() => {
  if (!donations.value || donations.value.length === 0) return null;
  const sorted = [...donations.value].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return sorted[0];
});

// 格式化日期 - 使用本地时间
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 判断是否为大额赞赏
const isLargeAmount = (amount: number) => {
  return amount >= 50;
};

// 打开打赏弹窗
const handleOpenReward = () => {
  showRewardDialog.value = true;
};

// 获取打赏配置
const rewardConfig = computed(() => {
  return siteConfigStore.getSiteConfig?.post?.reward || {};
});

onMounted(() => {
  fetchDonations();
});
</script>

<template>
  <div v-if="!loading && donations.length > 0" class="author-content">
    <div class="author-content-item single reward">
      <div class="author-content-item-tips">致谢</div>
      <span class="author-content-item-title">赞赏名单</span>
      <div class="author-content-item-description">
        感谢因为有你们，让我更加有创作的动力。
      </div>

      <div class="reward-list-all">
        <div v-for="item in donations" :key="item.id" class="reward-list-item">
          <div class="reward-list-item-name">{{ item.name }}</div>
          <div class="reward-list-bottom-group">
            <div
              class="reward-list-item-money"
              :class="{ large: isLargeAmount(item.amount) }"
            >
              ¥{{ item.amount }}{{ item.suffix }}
            </div>
            <div class="reward-list-item-time">
              {{ formatDate(item.created_at) }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="latestUpdate" class="reward-list-updateDate">
        最新更新时间：
        <time class="reward-list-updateDate-time">
          {{ formatDate(latestUpdate.created_at) }}
        </time>
      </div>

      <!-- 充电动画 -->
      <div class="about-reward">
        <div id="con" />
        <div id="TA-con" @click="handleOpenReward">
          <div id="text-con">
            <div id="linght" />
            <div id="TA">为TA充电</div>
          </div>
        </div>
        <div id="tube-con">
          <svg
            viewBox="0 0 1028 385"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 77H234.226L307.006 24H790"
              stroke="#e5e9ef"
              stroke-width="20"
            />
            <path
              d="M0 140H233.035L329.72 71H1028"
              stroke="#e5e9ef"
              stroke-width="20"
            />
            <path
              d="M1 255H234.226L307.006 307H790"
              stroke="#e5e9ef"
              stroke-width="20"
            />
            <path
              d="M0 305H233.035L329.72 375H1028"
              stroke="#e5e9ef"
              stroke-width="20"
            />
            <rect y="186" width="236" height="24" fill="#e5e9ef" />
            <ellipse cx="790" cy="25.5" rx="25" ry="25.5" fill="#e5e9ef" />
            <circle r="14" transform="matrix(1 0 0 -1 790 25)" fill="white" />
            <ellipse cx="790" cy="307.5" rx="25" ry="25.5" fill="#e5e9ef" />
            <circle r="14" transform="matrix(1 0 0 -1 790 308)" fill="white" />
          </svg>
          <div id="mask">
            <svg
              viewBox="0 0 1028 385"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 77H234.226L307.006 24H790"
                stroke="#f25d8e"
                stroke-width="20"
              />
              <path
                d="M0 140H233.035L329.72 71H1028"
                stroke="#f25d8e"
                stroke-width="20"
              />
              <path
                d="M1 255H234.226L307.006 307H790"
                stroke="#f25d8e"
                stroke-width="20"
              />
              <path
                d="M0 305H233.035L329.72 375H1028"
                stroke="#f25d8e"
                stroke-width="20"
              />
              <rect y="186" width="236" height="24" fill="#f25d8e" />
              <ellipse cx="790" cy="25.5" rx="25" ry="25.5" fill="#f25d8e" />
              <circle r="14" transform="matrix(1 0 0 -1 790 25)" fill="white" />
              <ellipse cx="790" cy="307.5" rx="25" ry="25.5" fill="#f25d8e" />
              <circle
                r="14"
                transform="matrix(1 0 0 -1 790 308)"
                fill="white"
              />
            </svg>
          </div>
          <div id="orange-mask">
            <svg
              viewBox="0 0 1028 385"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 77H234.226L307.006 24H790"
                stroke="#ffd52b"
                stroke-width="20"
              />
              <path
                d="M0 140H233.035L329.72 71H1028"
                stroke="#ffd52b"
                stroke-width="20"
              />
              <path
                d="M1 255H234.226L307.006 307H790"
                stroke="#ffd52b"
                stroke-width="20"
              />
              <path
                d="M0 305H233.035L329.72 375H1028"
                stroke="#ffd52b"
                stroke-width="20"
              />
              <rect y="186" width="236" height="24" fill="#ffd52b" />
              <ellipse cx="790" cy="25.5" rx="25" ry="25.5" fill="#ffd52b" />
              <circle r="14" transform="matrix(1 0 0 -1 790 25)" fill="white" />
              <ellipse cx="790" cy="307.5" rx="25" ry="25.5" fill="#ffd52b" />
              <circle
                r="14"
                transform="matrix(1 0 0 -1 790 308)"
                fill="white"
              />
            </svg>
          </div>
        </div>
        <p id="people">
          共<b>{{ total }}</b
          >人
        </p>
      </div>
    </div>
  </div>

  <div v-else-if="loading" class="reward-loading">
    <div class="loading-text">加载中...</div>
  </div>

  <!-- 打赏弹窗 -->
  <AnDialog
    v-model="showRewardDialog"
    title="打赏支持"
    width="500px"
    hide-footer
  >
    <div class="reward-dialog-content">
      <p class="reward-tips">感谢您的支持，您的鼓励是我创作的最大动力！</p>
      <div class="qr-codes">
        <div v-if="rewardConfig.wechat_qr" class="qr-code-item">
          <img :src="rewardConfig.wechat_qr" alt="微信打赏" class="qr-image" />
          <div class="qr-label">微信</div>
        </div>
        <div v-if="rewardConfig.alipay_qr" class="qr-code-item">
          <img
            :src="rewardConfig.alipay_qr"
            alt="支付宝打赏"
            class="qr-image"
          />
          <div class="qr-label">支付宝</div>
        </div>
      </div>
      <p
        v-if="!rewardConfig.wechat_qr && !rewardConfig.alipay_qr"
        class="no-qr"
      >
        暂未配置打赏二维码
      </p>
    </div>
  </AnDialog>
</template>

<style lang="scss" scoped>
@keyframes move1 {
  0% {
    transform: translateX(-15px);
  }

  100% {
    transform: translateX(140px);
  }
}

@keyframes movetwo {
  0% {
    transform: translateX(15px);
  }

  100% {
    transform: translateX(-140px);
  }
}

.reward {
  width: 100%;

  .reward-list-all {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;
    margin: 20px 0;
  }

  .reward-list-item {
    padding: 12px;
    background: var(--anzhiyu-card-bg);
    border: 1px solid var(--anzhiyu-card-border);
    border-radius: 8px;
    transition: all 0.3s ease;

    .reward-list-item-name {
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
    }

    .reward-list-bottom-group {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;

      .reward-list-item-money {
        padding: 2px 4px;
        font-size: 12px;
        font-weight: bold;
        color: #fff;
        background: var(--font-color);
        border-radius: 4px;

        &.large {
          background: #ffc93e;
        }
      }

      .reward-list-item-time {
        font-size: 12px;
        color: var(--anzhiyu-secondtext);
      }
    }
  }

  .reward-list-updateDate {
    margin-top: 16px;
    font-size: 14px;
    color: var(--anzhiyu-secondtext);
  }

  // 充电动画样式
  .about-reward {
    position: absolute;
    top: 1rem;
    right: 2rem;

    #con {
      width: 350px;
      height: 85px;
      position: relative;
      border-radius: 4px;
    }

    #TA-con {
      width: 157px;
      height: 50px;
      background-color: #f25d8e;
      box-shadow: 0 4px 4px rgba(255, 112, 159, 0.3);
      position: absolute;
      top: 50%;
      left: 10%;
      transform: translateY(-50%);
      border-radius: 4px;
      cursor: pointer;

      &:hover {
        background-color: #ff6b9a;
        & + #tube-con > #mask {
          width: 157px;
        }
        & + #tube-con > #orange-mask {
          animation: move1 0.5s linear 0.2s infinite;
        }
        + #tube-con > #orange-mask svg {
          animation: movetwo 0.5s linear 0.2s infinite;
        }
      }

      #text-con {
        width: 100px;
        height: 100%;
        margin: 0 auto;
        position: relative;

        #linght {
          width: 0;
          height: 0;
          position: absolute;
          top: 36%;
          left: 4px;
          border-color: transparent;
          border-style: solid;
          border-width: 10px;
          border-top: 10px solid #fff;
          border-radius: 4px;
          transform: rotate(-55deg);
          &::after {
            position: absolute;
            top: -13px;
            left: -11px;
            content: "";
            width: 0;
            height: 0;
            border-color: transparent;
            border-style: solid;
            border-width: 10px;
            border-top: 10px solid #fff;
            transform: rotate(180deg);
            border-radius: 4px;
          }
        }

        #TA {
          float: right;
          line-height: 50px;
          font-size: 15px;
          color: #fff;
        }
      }
    }

    #tube-con {
      width: 157px;
      height: 55px;
      position: absolute;
      right: -5px;
      top: 15px;

      svg {
        width: 100%;
        height: 100%;
      }

      #mask {
        width: 0;
        height: 100%;
        overflow: hidden;
        position: absolute;
        top: 0;
        left: 0;
        transition: all 0.5s;
        svg {
          width: 157px;
          height: 55px;
        }
      }

      #orange-mask {
        width: 18px;
        height: 100%;
        overflow: hidden;
        position: absolute;
        left: -15px;
        top: 0;
        svg {
          position: absolute;
          top: 0;
          left: 15px;
          width: 157px;
          height: 55px;
        }
      }
    }

    #people {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 12px;
      font-family: "雅黑";
      color: #aaa;

      b {
        color: #777;
      }
    }
  }
}

.reward-loading {
  padding: 40px;
  text-align: center;

  .loading-text {
    font-size: 16px;
    color: var(--anzhiyu-secondtext);
  }
}

// 打赏弹窗样式
.reward-dialog-content {
  padding: 20px 0;

  .reward-tips {
    margin: 0 0 30px;
    font-size: 15px;
    color: var(--anzhiyu-fontcolor);
    text-align: center;
    line-height: 1.6;
  }

  .qr-codes {
    display: flex;
    justify-content: center;
    gap: 40px;
    margin-bottom: 20px;

    .qr-code-item {
      display: flex;
      flex-direction: column;
      align-items: center;

      .qr-image {
        width: 180px;
        height: 180px;
        padding: 10px;
        background: #fff;
        border: 1px solid #e5e9ef;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;

        &:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }
      }

      .qr-label {
        margin-top: 12px;
        font-size: 14px;
        font-weight: 600;
        color: var(--anzhiyu-fontcolor);
      }
    }
  }

  .no-qr {
    margin: 20px 0;
    font-size: 14px;
    color: var(--anzhiyu-secondtext);
    text-align: center;
  }
}

// 移动端适配弹窗
@media screen and (width <= 768px) {
  .reward-dialog-content {
    .qr-codes {
      flex-direction: column;
      gap: 30px;

      .qr-code-item .qr-image {
        width: 160px;
        height: 160px;
      }
    }
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0;
    transform: scale(0.8);
  }

  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

@keyframes fillUp {
  0% {
    clip-path: inset(100% 0 0 0);
  }

  50% {
    clip-path: inset(0 0 0 0);
  }

  100% {
    clip-path: inset(100% 0 0 0);
  }
}

// 平板适配
@media screen and (width <= 1024px) {
  .reward {
    .reward-list-all {
      grid-template-columns: repeat(3, 1fr);
    }
  }
}

// 移动端适配
@media screen and (width <= 768px) {
  .reward {
    .reward-list-all {
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .about-reward {
      display: none;
    }
  }
}
</style>
