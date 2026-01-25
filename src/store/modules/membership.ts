// src/store/modules/membership.ts
// 会员套餐状态管理

import { defineStore } from "pinia";
import { getActivePlansApi, type MembershipPlan } from "@/api/membership";

interface MembershipState {
  /** 可用的会员套餐列表 */
  activePlans: MembershipPlan[];
  /** 是否已加载 */
  isLoaded: boolean;
  /** 加载中 */
  loading: boolean;
}

export const useMembershipStore = defineStore("anheyu-membership", {
  state: (): MembershipState => ({
    activePlans: [],
    isLoaded: false,
    loading: false
  }),

  getters: {
    /** 是否有可用的会员套餐 */
    hasActivePlans: state => state.activePlans.length > 0,
    /** 获取可用套餐数量 */
    activePlansCount: state => state.activePlans.length,
    /** 获取可用套餐列表 */
    getActivePlans: state => state.activePlans
  },

  actions: {
    /**
     * 获取可用的会员套餐列表
     * 会缓存结果，避免重复请求
     */
    async fetchActivePlans(forceRefresh = false) {
      // 如果已加载且不强制刷新，直接返回
      if (this.isLoaded && !forceRefresh) {
        return this.activePlans;
      }

      // 避免重复请求
      if (this.loading) {
        return this.activePlans;
      }

      this.loading = true;
      try {
        const res = await getActivePlansApi();
        if (res.code === 200 && res.data?.list) {
          this.activePlans = res.data.list;
        } else {
          this.activePlans = [];
        }
        this.isLoaded = true;
        return this.activePlans;
      } catch (error) {
        console.error("获取会员套餐列表失败:", error);
        this.activePlans = [];
        return [];
      } finally {
        this.loading = false;
      }
    },

    /**
     * 清除缓存，强制下次重新获取
     */
    clearCache() {
      this.isLoaded = false;
      this.activePlans = [];
    }
  }
});

/**
 * 在 setup 外部使用的 hook
 */
export function useMembershipStoreHook() {
  return useMembershipStore();
}
