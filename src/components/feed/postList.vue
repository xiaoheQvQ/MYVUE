<template>
  <div class="post-list-container" v-loading="loading">
    <div class="post-list-waterfall" v-infinite-scroll="loadMore" infinite-scroll-disabled="disabled"
      infinite-scroll-distance="10" infinite-scroll-window="false">
      <post-card v-for="post in posts" :key="post.id" :post="post" class="waterfall-item"></post-card>

      <!-- 占位防止底部被遮挡 -->
      <div style="break-inside: avoid; height: 1px;"></div>
    </div>
    <p v-if="noMore" class="no-more">没有更多了</p>
    <p v-if="loading" class="loading-text">加载中...</p>
  </div>
</template>

<script>
import feedApi from '@/api/feed/feed'
import PostCard from './postCard.vue'

export default {
  name: 'postList',
  components: { PostCard },
  data () {
    return {
      posts: [],
      loading: false,
      pagination: {
        current: 1,
        size: 10,
        total: 0
      }
    }
  },
  computed: {
    noMore () {
      // 简单判断: 如果当前记录数 >= 总数，或者后端返回页码>=总页数(需API支持，这里暂用total判断)
      return this.posts.length >= this.pagination.total && this.pagination.total > 0
    },
    disabled () {
      return this.loading || this.noMore
    }
  },
  created () {
    this.fetchData(true)
  },
  methods: {
    async fetchData (isRefresh = false) {
      if (isRefresh) {
        this.pagination.current = 1
      }
      this.loading = true
      try {
        const params = {
          current: this.pagination.current,
          size: this.pagination.size
        }
        const res = await feedApi.getPostFeed(params)
        if (isRefresh) {
          this.posts = res.data.records
        } else {
          this.posts = this.posts.concat(res.data.records)
        }
        this.pagination.total = res.data.total
      } catch (error) {
        console.error('获取动态失败:', error)
      } finally {
        this.loading = false
      }
    },
    loadMore () {
      if (this.disabled) return
      this.pagination.current++
      this.fetchData()
    }
  }
}
</script>

<style scoped>
.post-list-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 10px;
}

.post-list-waterfall {
  column-count: 4;
  column-gap: 15px;
  max-width: 1200px;
  margin: 0 auto;
}

.waterfall-item {
  break-inside: avoid;
  margin-bottom: 15px;
}

.no-more,
.loading-text {
  text-align: center;
  color: #999;
  padding: 15px;
  clear: both;
}

@media (max-width: 1200px) {
  .post-list-waterfall {
    column-count: 3;
  }
}

@media (max-width: 800px) {
  .post-list-waterfall {
    column-count: 2;
    column-gap: 8px;
  }

  .waterfall-item {
    margin-bottom: 8px;
  }
}
</style>
