import { ref, nextTick } from "vue";
import { ElMessage } from "element-plus";
import {
  listMyTicketsApi,
  getTicketApi,
  replyTicketApi,
  type Ticket,
  type TicketDetail
} from "@/api/support";

export function useTickets() {
  const tickets = ref<Ticket[]>([]);
  const loading = ref(false);
  const selectedTicket = ref<TicketDetail | null>(null);
  const detailLoading = ref(false);
  const chatContainerRef = ref<HTMLElement | null>(null);

  // 聊天输入相关
  const chatInput = ref("");
  const isSending = ref(false);

  // 获取工单列表
  const fetchTickets = async () => {
    loading.value = true;
    try {
      const res = await listMyTicketsApi({ page: 1, page_size: 50 });
      if (res.code === 200 && res.data) {
        tickets.value = res.data.list || [];
      }
    } catch (error) {
      console.error("获取工单列表失败:", error);
    } finally {
      loading.value = false;
    }
  };

  // 选择工单
  const selectTicket = async (ticket: Ticket) => {
    detailLoading.value = true;

    try {
      const res = await getTicketApi(ticket.id);
      if (res.code === 200 && res.data) {
        selectedTicket.value = res.data;
        nextTick(() => {
          scrollToBottom();
        });
      }
    } catch (error) {
      console.error("获取工单详情失败:", error);
      ElMessage.error("获取工单详情失败");
    } finally {
      detailLoading.value = false;
    }
  };

  // 发送消息
  const sendMessage = async () => {
    if (!chatInput.value.trim() || !selectedTicket.value || isSending.value)
      return;

    isSending.value = true;
    try {
      const res = await replyTicketApi(selectedTicket.value.id, {
        content: chatInput.value.trim()
      });
      if (res.code === 200 && res.data) {
        selectedTicket.value.messages.push(res.data);
        chatInput.value = "";
        nextTick(() => {
          scrollToBottom();
        });
      }
    } catch (error) {
      console.error("发送消息失败:", error);
      ElMessage.error("发送消息失败");
    } finally {
      isSending.value = false;
    }
  };

  // 滚动到聊天底部
  const scrollToBottom = () => {
    if (chatContainerRef.value) {
      chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight;
    }
  };

  // 清除选中
  const clearSelection = () => {
    selectedTicket.value = null;
  };

  // 计算待处理工单数量
  const getPendingCount = () => {
    return tickets.value.filter(t => t.status !== "CLOSED").length;
  };

  // 工具函数
  const getStatusText = (status: string) => {
    switch (status) {
      case "OPEN":
        return "待处理";
      case "REPLIED":
        return "已回复";
      case "CLOSED":
        return "已关闭";
      default:
        return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "OPEN":
        return "status-open";
      case "REPLIED":
        return "status-replied";
      case "CLOSED":
        return "status-closed";
      default:
        return "";
    }
  };

  return {
    tickets,
    loading,
    selectedTicket,
    detailLoading,
    chatContainerRef,
    chatInput,
    isSending,
    fetchTickets,
    selectTicket,
    sendMessage,
    scrollToBottom,
    clearSelection,
    getPendingCount,
    getStatusText,
    getStatusClass
  };
}
