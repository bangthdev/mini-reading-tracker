import { createRouter, createWebHistory } from 'vue-router'
import SearchView from '../views/SearchView.vue'
import BookDetailView from '../views/BookDetailView.vue'
import ShelfView from '../views/ShelfView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: SearchView },
    { path: '/books/:id', component: BookDetailView },
    { path: '/shelf', component: ShelfView },
  ],
})

export default router
