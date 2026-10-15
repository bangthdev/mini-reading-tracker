<template>
  <div class="app">
    <header class="topbar sheet">
      <span class="tape tape--sage" aria-hidden="true"></span>

      <RouterLink to="/" class="brand">
        <span class="brand-mark" aria-hidden="true">📖</span>
        <span>
          <span class="brand-name">Mini Reading Tracker</span>
          <span class="brand-sub hand">Sổ tay theo dõi đọc sách</span>
        </span>
      </RouterLink>

      <nav class="nav">
        <RouterLink to="/">Tìm sách</RouterLink>
        <RouterLink to="/shelf">Tủ sách</RouterLink>
      </nav>
    </header>

    <main class="main">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.topbar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin: 18px auto 0;
  padding: 14px 22px;
  width: min(1060px, calc(100% - 28px));
  transform: rotate(-0.25deg);
}

.tape {
  top: -13px;
  left: 52px;
  transform: rotate(-3deg);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.brand-mark {
  font-size: 26px;
  line-height: 1;
}

.brand-name {
  display: block;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.brand-sub {
  display: block;
  font-size: 17px;
  line-height: 1.1;
}

.nav {
  display: flex;
  gap: 6px;
}

.nav a {
  padding: 6px 14px;
  border-radius: 4px;
  border: 1.5px solid transparent;
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
  color: var(--ink-soft);
}

.nav a:hover {
  color: var(--ink);
  background: var(--paper-dark);
}

/* vue-router tự gắn class này cho mục đang mở */
.nav a.router-link-active {
  color: var(--ink);
  background: var(--sticky-yellow);
  border-color: var(--ink);
  box-shadow: 2px 2px 0 rgba(45, 63, 102, 0.18);
}

.main {
  flex: 1;
  width: min(1060px, calc(100% - 28px));
  margin: 0 auto;
  padding: 26px 0 60px;
}

@media (max-width: 560px) {
  .topbar {
    transform: none;
    padding: 12px 16px;
  }
  .tape {
    left: 28px;
  }
  .brand-sub {
    display: none;
  }
}
</style>
