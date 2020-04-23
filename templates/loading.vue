<template>
  <div class="toast">
    <p class="loading__spinner loading__spinner--circular">
      <svg viewBox="25 25 50 50" class="loading__circular">
        <circle
          cx="50"
          cy="50"
          r="20"
          fill="none"
          class="svg-circle"
        />
      </svg>
    </p>
  </div>
</template>

<style scoped>
.toast {
  position: fixed;
  top: 50%;
  left: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: content-box;
  width: 88px;
  height: 88px;
  padding: 16px;
  color: #fff;
  font-size: 14px;
  line-height: 20px;
  background-color: rgba(50, 50, 51, 0.88);
  border-radius: 4px;
  transform: translate3d(-50%, -50%, 0);
  z-index: 2002;
}

.loading__spinner {
  position: relative;
  display: inline-block;
  width: 30px;
  max-width: 100%;
  height: 30px;
  max-height: 100%;
  vertical-align: middle;
  animation: skeleton-rotate 0.8s linear infinite;
  color: #c8c9cc;
}

.loading__spinner--circular {
  animation-duration: 2s;
}

.loading__circular {
  display: block;
  width: 100%;
  height: 100%;
}

.svg-circle {
  stroke: currentColor;
  stroke-width: 3;
  stroke-linecap: round;
  animation: skeleton-circular 1.5s ease-in-out infinite;
}

@keyframes skeleton-circular {
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -40;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -120;
  }
}

@keyframes skeleton-rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
