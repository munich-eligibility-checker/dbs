<template>
  <div class="prefilled-indicator">
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
        fill="currentColor"
      />
    </svg>
    Aus Solid Pod übernommen
  </div>
</template>

<style scoped>
.prefilled-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 0.875rem;
  color: var(--mde-color-signal-success, #0d8050);
  font-weight: 500;
}

.prefilled-indicator svg {
  flex-shrink: 0;
}
</style>
