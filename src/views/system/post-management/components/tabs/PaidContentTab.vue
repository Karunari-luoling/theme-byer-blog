<!--
 * @Description: 付费设置Tab组件
 * @Author: 安知鱼
 * @Date: 2025-12-27
-->
<script setup lang="ts">
// 付费设置主要是展示说明，没有表单交互
</script>

<template>
  <el-form label-position="top">
    <el-row :gutter="24">
      <el-col :span="24">
        <el-alert title="付费内容功能" type="info" :closable="false" show-icon>
          <template #default>
            <p>
              在文章中使用
              <code>:::paid-content</code> 标签包裹需要付费的内容。
            </p>
            <p>
              支持自定义付费标题和价格：使用
              <code>paid-title="标题"</code> 和 <code>price="9.99"</code> 参数。
            </p>
            <p>
              支持在付费内容中使用所有 Markdown 语法，包括代码块、图片、列表等。
            </p>
            <p>用户需要购买后才能查看被标签包裹的内容。</p>
          </template>
        </el-alert>
      </el-col>

      <el-col :span="24">
        <el-form-item label="付费内容预览">
          <div class="paid-content-preview">
            <div class="paid-content-example">
              <h4>示例：如何在文章中使用付费内容标签</h4>

              <div class="example-section">
                <h5>基础用法：</h5>
                <pre><code>:::paid-content
这里是要付费才能查看的内容。

支持多段落内容：
- 列表项
- 代码块
- 图片等

```javascript
console.log("付费代码示例");
```
:::</code></pre>
              </div>

              <div class="example-section">
                <h5>带参数的用法：</h5>
                <pre><code>:::paid-content paid-title="高级教程" price="9.99"
# 这是付费内容标题

这里是付费内容，包含：
- 高级技巧分享
- 完整代码实现
- 详细解析过程

```typescript
// 付费代码示例
function advancedFeature() {
  return "这是高级功能实现";
}
```
:::</code></pre>
              </div>

              <div class="example-section">
                <h5>参数说明：</h5>
                <pre><code>:::paid-content title="标题" price="价格"
或
:::paid-content paid-title="标题" price="价格"

- paid-title: 付费内容标题（推荐）
- title: 付费内容标题（向下兼容）
- price: 付费价格，支持小数（如：9.99）

如果同时设置 paid-title 和 title，优先使用 paid-title
:::</code></pre>
              </div>
            </div>

            <div class="paid-content-tips">
              <h5>使用提示：</h5>
              <ul>
                <li>
                  在 Markdown 编辑器中点击工具栏的 💰 按钮快速插入付费内容标签
                </li>
                <li>
                  付费内容标签必须成对出现：<code>:::paid-content</code>
                  开始，<code>:::</code> 结束
                </li>
                <li>
                  支持参数设置：使用
                  <code>paid-title="标题"</code> 设置付费内容标题，使用
                  <code>price="价格"</code> 设置价格
                </li>
                <li>
                  参数优先级：<code>paid-title</code> > <code>title</code> >
                  默认标题
                </li>
                <li>支持在付费内容中使用所有 Markdown 语法</li>
                <li>付费内容将在文章发布后生效，编辑时显示为预览状态</li>
              </ul>
            </div>
          </div>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<style scoped lang="scss">
.paid-content-preview {
  background: var(--el-fill-color-light);
  border-radius: 8px;
  padding: 16px;
}

.paid-content-example {
  h4 {
    margin: 0 0 16px 0;
    color: var(--el-text-color-primary);
  }

  h5 {
    margin: 0 0 8px 0;
    color: var(--el-text-color-regular);
    font-weight: 500;
  }

  .example-section {
    margin-bottom: 16px;

    pre {
      background: var(--el-fill-color);
      border-radius: 4px;
      padding: 12px;
      margin: 0;
      overflow-x: auto;

      code {
        font-family: "Fira Code", "Consolas", monospace;
        font-size: 13px;
        line-height: 1.5;
        color: var(--el-text-color-primary);
      }
    }
  }
}

.paid-content-tips {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);

  h5 {
    margin: 0 0 8px 0;
    color: var(--el-text-color-regular);
    font-weight: 500;
  }

  ul {
    margin: 0;
    padding-left: 20px;

    li {
      margin-bottom: 4px;
      color: var(--el-text-color-secondary);
      font-size: 13px;

      code {
        background: var(--el-fill-color);
        padding: 2px 4px;
        border-radius: 4px;
        font-family: "Fira Code", "Consolas", monospace;
        font-size: 12px;
      }
    }
  }
}
</style>
