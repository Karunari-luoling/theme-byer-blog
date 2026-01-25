<template>
  <div class="product-card-skeleton">
    <el-skeleton :loading="true" animated>
      <template #template>
        <div class="card-cover">
          <el-skeleton-item variant="image" style="width: 100%; height: 100%" />
        </div>
        <div class="card-content">
          <el-skeleton-item variant="h3" style="width: 80%" />
          <el-skeleton-item
            variant="text"
            style="width: 100%; margin-top: 8px"
          />
          <el-skeleton-item
            variant="text"
            style="width: 60%; margin-top: 4px"
          />
          <div class="card-footer">
            <el-skeleton-item variant="text" style="width: 70px" />
            <div class="stats-skeleton">
              <el-skeleton-item variant="text" style="width: 45px" />
              <el-skeleton-item variant="text" style="width: 45px" />
            </div>
          </div>
        </div>
      </template>
    </el-skeleton>
  </div>
</template>

<style lang="scss" scoped>
.product-card-skeleton {
  background: var(--anzhiyu-card-bg);
  border-radius: 12px;
  overflow: hidden;
  border: var(--style-border-always);
  box-shadow: var(--anzhiyu-shadow-border);

  .card-cover {
    width: 100%;
    padding-top: 56.25%;
    position: relative;

    :deep(.el-skeleton__item) {
      position: absolute;
      top: 0;
      left: 0;
    }
  }

  .card-content {
    padding: 1rem;

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.75rem;

      .stats-skeleton {
        display: flex;
        gap: 0.5rem;
      }
    }
  }
}

@media screen and (width <= 768px) {
  .product-card-skeleton {
    .card-content {
      padding: 0.75rem;
    }
  }
}
</style>
