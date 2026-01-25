<!--
 * @Description: AI 助手输入框 - HeroUI 风格
-->
<template>
  <div class="input-wrapper" :class="{ focused: isFocused }">
    <input
      ref="inputRef"
      :value="modelValue"
      type="text"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="
        $emit('update:modelValue', ($event.target as HTMLInputElement).value)
      "
      @keydown.enter="$emit('submit')"
      @focus="isFocused = true"
      @blur="isFocused = false"
    />
    <Transition name="send-btn">
      <button
        v-show="modelValue.trim()"
        class="send-btn"
        :disabled="disabled"
        @click="$emit('submit')"
      >
        <IconifyIconOnline icon="ri:arrow-up-line" />
      </button>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { IconifyIconOnline } from "@/components/ReIcon";

defineProps<{
  modelValue: string;
  placeholder?: string;
  disabled?: boolean;
}>();

defineEmits<{
  "update:modelValue": [value: string];
  submit: [];
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const isFocused = ref(false);

defineExpose({
  focus: () => inputRef.value?.focus()
});
</script>

<style lang="scss" scoped>
.input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 48px;
  padding: 0 6px 0 16px;
  margin-bottom: 12px;
  background: var(--anzhiyu-card-bg);
  border: 1.5px solid var(--anzhiyu-card-border);
  border-radius: 12px;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--anzhiyu-secondtext);
  }

  &.focused {
    border-color: var(--anzhiyu-main);
  }

  input {
    flex: 1;
    height: 100%;
    font-size: 14px;
    color: var(--anzhiyu-fontcolor);
    background: transparent;
    border: none;
    outline: none;

    &::placeholder {
      color: var(--anzhiyu-secondtext);
    }
  }

  .send-btn {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    font-size: 17px;
    color: var(--anzhiyu-white);
    cursor: pointer;
    background: linear-gradient(
      135deg,
      var(--anzhiyu-main) 0%,
      var(--anzhiyu-main-op-deep) 100%
    );
    border: none;
    border-radius: 50%;
    box-shadow: var(--anzhiyu-shadow-main);
    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

    &:hover {
      transform: scale(1.08);
    }

    &:active {
      transform: scale(0.92);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }
}

// 发送按钮入场动画
.send-btn-enter-active,
.send-btn-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.send-btn-enter-from {
  opacity: 0;
  transform: scale(0.5) rotate(-90deg);
}

.send-btn-leave-to {
  opacity: 0;
  transform: scale(0.5) rotate(90deg);
}

// 移动端优化
@media screen and (max-width: 640px) {
  .input-wrapper {
    height: 44px;
    padding: 0 5px 0 14px;
    margin-bottom: 10px;
    border-radius: 22px;
    background: var(--anzhiyu-secondbg);

    input {
      font-size: 15px;

      &::placeholder {
        font-size: 14px;
      }
    }

    .send-btn {
      width: 32px;
      height: 32px;
      font-size: 16px;
    }
  }
}
</style>
