/*
 * @Description: 运营管理路由组（二级菜单）- PRO 专属 - 订单管理、打赏管理
 * @Author: 安知鱼
 * @Date: 2025-12-12
 */
const Layout = () => import("@/layout/index.vue");

// 运营管理 - 包含订单、打赏
export default [
  {
    path: "/business",
    component: Layout,
    redirect: "/orders-management/index",
    meta: {
      icon: "ep:data-line",
      title: "运营管理",
      rank: 5
    },
    children: [
      {
        path: "/orders-management/index",
        name: "OrdersManagement",
        component: () => import("@/views/system/orders-management/index.vue"),
        meta: {
          icon: "ep:shopping-cart",
          title: "订单管理",
          roles: ["1"]
        }
      },
      {
        path: "/admin/donation-management",
        name: "DonationManagement",
        component: () => import("@/views/system/donation-management/index.vue"),
        meta: {
          icon: "ep:coin",
          title: "打赏管理",
          roles: ["1"]
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
