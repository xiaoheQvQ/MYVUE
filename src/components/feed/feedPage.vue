<template>
  <div class="feed-page">
    <!-- 中间动态列表 -->
    <div class="feed-list-container">
      <div class="feed-list">
        <post-card v-for="post in posts" :key="post.id" :post="post" class="feed-card-item"
          @view-comments="openCommentDrawer" @update-post="updatePostInList"></post-card>
        <!-- 占位符，防止瀑布流底部被遮挡 -->
        <div style="break-inside: avoid; height: 1px;"></div>
      </div>
      <div v-if="loading" class="feed-tip">加载中...</div>
      <div v-if="!hasMore && posts.length > 0" class="feed-tip">没有更多了</div>
    </div>

    <!-- 评论抽屉 (现在包含详情) -->
    <post-comment-drawer :visible.sync="commentDrawerVisible" :post="currentPost"
      @comment-added="handleCommentAdded"></post-comment-drawer>
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
        size: 20,
      },
      loading: false,
      hasMore: true,
      commentDrawerVisible: false,
      currentPost: null, // 改为保存完整对象
      scrollContainer: null,
    };
  },
  created() {
    this.fetchPosts(true);
  },
  mounted() {
    this.scrollContainer = this.$el.querySelector('.feed-list-container');
    if (this.scrollContainer) {
      this.scrollContainer.addEventListener('scroll', this.handleScroll);
    }
  },
  beforeDestroy() {
    if (this.scrollContainer) {
      this.scrollContainer.removeEventListener('scroll', this.handleScroll);
    }
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
    handleScroll() {
      if (!this.scrollContainer || this.loading || !this.hasMore) return;

      const { scrollTop, scrollHeight, clientHeight } = this.scrollContainer;
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        this.fetchPosts();
      }
    },
    loadMore() {
      this.fetchPosts();
    },
    openCommentDrawer(postId) {
      // 从列表中查找完整 post 对象
      this.currentPost = this.posts.find(p => p.id === postId);
      if (this.currentPost) {
        this.commentDrawerVisible = true;
      }
    },
    updatePostInList(updatedPost) {
      const index = this.posts.findIndex(p => p.id === updatedPost.id);
      if (index !== -1) {
        this.$set(this.posts, index, updatedPost);
        // 如果当前打开的就是这个帖子，也要更新 currentPost
        if (this.currentPost && this.currentPost.id === updatedPost.id) {
          this.currentPost = updatedPost;
        }
      }
    },
    handleCommentAdded() {
      if (this.currentPost) {
        this.currentPost.commentCount++;
        // 同步更新列表
        this.updatePostInList(this.currentPost);
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
  overflow: hidden;
  background-color: #f7f7f7;
  /* 背景色 */
}

.feed-list-container {
  width: 100%;
  height: 100%;
  /* 占满高度 */
  overflow-y: auto;
  /* 容器滚动 */
  padding: 20px;
  box-sizing: border-box;
}

/* 隐藏滚动条但允许滚动 */
.feed-list-container::-webkit-scrollbar {
  width: 6px;
}

.feed-list-container::-webkit-scrollbar-thumb {
  background-color: #ddd;
  border-radius: 3px;
}

.feed-list-container::-webkit-scrollbar-track {
  background: transparent;
}

.feed-list {
  /* 瀑布流核心布局 */
  column-count: 5;
  column-gap: 16px;
  max-width: 1400px;
  margin: 0 auto;
}

.feed-card-item {
  break-inside: avoid;
  /* 防止卡片被截断 */
  margin-bottom: 16px;
  /* 卡片垂直间距 */
  width: 100%;
  /* 确保填满列宽 */
}

.feed-tip {
  color: #909399;
  text-align: center;
  padding: 20px 0;
  clear: both;
}

/* 响应式列数 */
@media (max-width: 1600px) {
  .feed-list {
    column-count: 4;
  }
}

@media (max-width: 1200px) {
  .feed-list {
    column-count: 3;
  }
}

@media (max-width: 800px) {
  .feed-list {
    column-count: 2;
    column-gap: 10px;
    padding: 0 5px;
  }

  .feed-card-item {
    margin-bottom: 10px;
  }

  .feed-list-container {
    padding: 10px 5px;
  }
}
</style>
