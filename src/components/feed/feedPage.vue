<template>
  <div class="feed-page">
    <!-- 中间动态列表 -->
    <div class="feed-list-container">
      <div class="feed-list">
        <post-card
          v-for="post in posts"
          :key="post.id"
          :post="post"
          @view-comments="openCommentDrawer"
          @update-post="updatePostInList"
        ></post-card>
        <p v-if="loading" class="feed-tip">加载中...</p>
        <p v-if="!hasMore && posts.length > 0" class="feed-tip">没有更多了</p>
      </div>
    </div>

    <!-- 评论抽屉 -->
    <post-comment-drawer
      :visible.sync="commentDrawerVisible"
      :post-id="currentPostId"
      @comment-added="handleCommentAdded"
    ></post-comment-drawer>
  </div>
</template>

<script>
import feedApi from '@/api/feed/feed';
import PostCard from '@/components/feed/postCard.vue';
import PostCommentDrawer from '@/components/feed/PostCommentDrawer.vue';

export default {
  name: "FeedPage",
  components: { PostCard, PostCommentDrawer },
  data() {
    return {
      posts: [],
      pagination: {
        current: 1,
        size: 10,
      },
      loading: false,
      hasMore: true,
      commentDrawerVisible: false,
      currentPostId: null,
    };
  },
  created() {
    this.fetchPosts(true);
  },
  methods: {
    async fetchPosts(isInitial = false) {
      if (this.loading) return;
      this.loading = true;
      try {
        const res = await feedApi.getPostFeed(this.pagination);
        const data = res.data;
        this.posts = isInitial ? data.records : [...this.posts, ...data.records];
        this.hasMore = data.current < data.pages;
        if (this.hasMore) {
          this.pagination.current++;
        }
      } catch (error) {
        console.error("获取动态失败:", error);
      } finally {
        this.loading = false;
      }
    },
    loadMore() {
      if (!this.loading && this.hasMore) {
        this.fetchPosts();
      }
    },
    openCommentDrawer(postId) {
      this.currentPostId = postId;
      this.commentDrawerVisible = true;
    },
    updatePostInList(updatedPost) {
      const index = this.posts.findIndex(p => p.id === updatedPost.id);
      if (index !== -1) {
        this.$set(this.posts, index, updatedPost);
      }
    },
    handleCommentAdded() {
      const post = this.posts.find(p => p.id === this.currentPostId);
      if (post) {
        post.commentCount++;
      }
    }
  },
};
</script>

<style scoped>
.feed-page {
  display: flex;
  justify-content: center;
  height: 100vh;
  overflow: hidden; /* 禁止页面整体滚动 */
}

.feed-list-container {
  width: 100%;
  max-width: 1000px;
  height: calc(100vh - 84px); /* 减去header高度 */
  overflow: hidden; /* 关键：隐藏滚动条 */
}

.feed-list {
  height: 100%;
  overflow-y: auto; /* 允许内容滚动（但隐藏滚动条） */
  scrollbar-width: none; /* Firefox隐藏滚动条 */
  -ms-overflow-style: none; /* IE/Edge隐藏滚动条 */
}

/* Chrome/Safari隐藏滚动条 */
.feed-list::-webkit-scrollbar {
  display: none;
}

.feed-tip {
  color: #909399;
  text-align: center;
  padding: 10px 0;
  margin: 0;
}
</style>