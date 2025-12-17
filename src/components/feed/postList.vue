<template>
  <div class="post-list" v-loading="loading">
    <div
      v-infinite-scroll="loadMore"
      infinite-scroll-disabled="disabled"
      infinite-scroll-distance="10">
      <post-card v-for="post in posts" :key="post.id" :post="post"></post-card>
    </div>
    <p v-if="noMore" class="no-more">没有更多了</p>
  </div>
</template>

<script>
import feedApi from '@/api/feed/feed'
import PostCard from './postCard.vue';


export default {
  name: "postList",
  components: { PostCard },
  data() {
    return {
      posts: [],
      loading: false,
      pagination: {
        current: 1,
        size: 10,
        total: 0,
      }
    };
  },
  computed: {
    noMore() {
      return this.posts.length >= this.pagination.total && this.pagination.total > 0;
    },
    disabled() {
      return this.loading || this.noMore;
    }
  },
  created() {
    this.fetchData(true);
  },
  methods: {
    async fetchData(isRefresh = false) {
      if (isRefresh) {
        this.pagination.current = 1;
      }
      this.loading = true;
      try {
        const params = {
          current: this.pagination.current,
          size: this.pagination.size
        };
        const res = await feedApi.getPostFeed(params);     
        if (isRefresh) {
          this.posts = res.data.records;
        } else {
          this.posts = this.posts.concat(res.data.records);
        }
        this.pagination.total = res.data.total;
      } catch (error) {
        console.error('获取动态失败:', error);
      } finally {
        this.loading = false;
      }
    },
    loadMore() {
      this.pagination.current++;
      this.fetchData();
    }
  }
};
</script>

<style scoped>
.no-more { text-align: center; color: #999; padding: 15px; }
</style>
