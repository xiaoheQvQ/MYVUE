<template>
  <el-dialog :visible.sync="localVisible" :show-close="false" width="900px" top="5vh" custom-class="xhs-note-dialog"
    destroy-on-close :append-to-body="true" :lock-scroll="true">
    <div class="note-detail-container" v-if="post">
      <!-- 左侧：媒体展示区 -->
      <div class="media-column">
        <div class="media-wrapper">
          <el-carousel v-if="post.imageUrls && post.imageUrls.length > 0" trigger="click" :autoplay="false"
            indicator-position="outside" arrow="always" height="100%" class="custom-carousel">
            <el-carousel-item v-for="(img, index) in post.imageUrls" :key="index">
              <div class="img-bg-box">
                <!-- 模糊背景 -->
                <div class="blur-bg" :style="{ backgroundImage: 'url(' + img + ')' }"></div>
                <!-- 主图 -->
                <el-image :src="img" fit="contain" class="main-image" :preview-src-list="post.imageUrls"></el-image>
              </div>
            </el-carousel-item>
          </el-carousel>
          <div v-else class="no-image-placeholder">
            纯文本内容
          </div>
        </div>
      </div>

      <!-- 右侧：侧边栏（作者、内容、评论） -->
      <div class="sidebar-column">
        <!-- 1. 顶部作者栏 -->
        <div class="sidebar-header">
          <div class="author-area clickable" @click="goToUser(post.author.id)">
            <el-avatar :size="40" :src="post.author.avatar" class="avatar"></el-avatar>
            <span class="nickname">{{ post.author.nick }}</span>
          </div>
          <el-button type="danger" round size="small" class="follow-btn">关注</el-button>
          <!-- 关闭按钮放在这里也可以，或者绝对定位 -->
          <!-- <i class="el-icon-close close-icon" @click="localVisible = false"></i> -->
        </div>

        <!-- 2. 可滚动内容区 -->
        <div class="sidebar-scroll-area">
          <!-- 帖子正文 -->
          <div class="note-content">
            <h2 class="title" v-if="post.title">{{ post.title }}</h2>
            <div class="desc" v-html="highlightContent(post.content)"></div>
            <div class="note-meta">
              <span class="date">{{ post.createTime | formatTime }}</span>
              <span class="location" v-if="post.location">{{ post.location }}</span>
            </div>
          </div>

          <el-divider class="section-divider"></el-divider>

          <!-- 评论区 -->
          <div class="comments-area">
            <div class="comment-count-title">共 {{ totalComments }} 条评论</div>
            <div class="comment-list" v-if="comments.length > 0">
              <comment-item v-for="comment in comments" :key="comment.id" :comment="comment"
                @reply="prepareReply"></comment-item>
            </div>
            <div v-else class="empty-comment">
              抢首评
            </div>
            <div class="load-more-btn" v-if="hasMore" @click="fetchComments">
              {{ isLoading ? '加载中...' : '查看更多评论' }}
            </div>
            <!-- 垫高底部，防止被输入框遮挡 -->
            <div style="height: 60px;"></div>
          </div>
        </div>

        <!-- 3.底部互动栏 -->
        <div class="sidebar-footer">
          <!-- 回复状态提示 -->
          <div v-if="replyingTo" class="reply-status-bar">
            <span>回复 @{{ replyingTo.user.nick }}:</span>
            <i class="el-icon-close" @click="cancelReply"></i>
          </div>

          <div class="footer-inner">
            <div class="input-wrapper">
              <el-input v-model="newCommentContent" :placeholder="replyingTo ? '回复...' : '说点什么...'" class="chat-input"
                @keydown.enter.native.prevent="submitComment">
              </el-input>
              <el-button type="primary" size="small" round :disabled="!newCommentContent.trim()" class="send-btn"
                @click="submitComment">发送</el-button>
            </div>

            <div class="action-buttons">
              <div class="action-btn" @click="toggleLike">
                <i :class="localIsLiked ? 'el-icon-star-on active-like' : 'el-icon-star-off'"></i>
                <span class="count">{{ localLikeCount || '点赞' }}</span>
              </div>
              <div class="action-btn">
                <i class="el-icon-collection-tag"></i>
                <span class="count">收藏</span>
              </div>
              <div class="action-btn">
                <i class="el-icon-chat-round"></i>
                <span class="count">{{ totalComments || '评论' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 独立的关闭按钮，挂在Dialog外层 -->
    <div class="close-btn-float" @click="localVisible = false">
      <i class="el-icon-close"></i>
    </div>
  </el-dialog>
</template>

<script>
import feedApi from '@/api/feed/feed';
import CommentItem from './CommentItem.vue';
import TimeConvertUtil from '@/utils/time-convert';

export default {
  name: "PostCommentDrawer",
  components: { CommentItem },
  props: {
    visible: { type: Boolean, default: false },
    post: { type: Object, default: null },
  },
  data() {
    return {
      comments: [],
      isLoading: false,
      pagination: { current: 1, size: 10 },
      totalComments: 0,
      hasMore: true,
      newCommentContent: '',
      replyingTo: null,
      localIsLiked: false,
      localLikeCount: 0,
    };
  },
  computed: {
    localVisible: {
      get() { return this.visible; },
      set(val) { this.$emit('update:visible', val); },
    },
  },
  filters: {
    formatTime(value) {
      if (!value) return '';
      return TimeConvertUtil.formatTimeDifference(new Date().getTime() - new Date(value).getTime());
    },
  },
  watch: {
    visible(newVal) {
      if (newVal && this.post) {
        this.localIsLiked = this.post.isLiked;
        this.localLikeCount = this.post.likeCount;
        this.pagination.current = 1;
        this.comments = [];
        this.fetchComments(true);
      }
    }
  },
  methods: {
    goToUser(userId) {
      this.$router.push({ path: '/user/profile', query: { id: userId } });
      this.localVisible = false;
    },
    highlightContent(content) {
      if (!content) return '';
      const regex = /(@\S+)|(#.*?#)/g;
      return content.replace(regex, (match) => `<span class="highlight">${match}</span>`);
    },
    async fetchComments(isInitial = false) {
      if (this.isLoading || !this.post) return;
      this.isLoading = true;
      try {
        const res = await feedApi.getPostComments(this.post.id, this.pagination);
        const data = res.data;
        if (isInitial) {
          this.comments = data.records;
        } else {
          this.comments = [...this.comments, ...data.records];
        }
        this.totalComments = data.total;
        this.hasMore = data.current < data.pages;
        if (this.hasMore) this.pagination.current++;
      } catch (error) {
        console.error("Fetch comments error", error);
      } finally {
        this.isLoading = false;
      }
    },
    async submitComment() {
      if (!this.newCommentContent.trim()) return;
      this.isLoading = true;
      const payload = {
        content: this.newCommentContent,
        parentId: this.replyingTo ? this.replyingTo.id : null,
        replyToUserId: this.replyingTo ? this.replyingTo.user.id : null,
      };
      try {
        const res = await feedApi.addPostComment(this.post.id, payload);
        const newComment = res.data;
        // 简单处理：插入首部
        this.comments.unshift(newComment);
        this.totalComments++;
        this.newCommentContent = '';
        this.replyingTo = null;
        this.$message.success('评论成功');
        this.$emit('comment-added');
      } catch (error) {
        this.$message.error('评论失败');
      } finally {
        this.isLoading = false;
      }
    },
    async toggleLike() {
      if (!this.post) return;
      const originalLiked = this.localIsLiked;
      this.localIsLiked = !this.localIsLiked;
      this.localLikeCount += this.localIsLiked ? 1 : -1;
      try {
        if (this.localIsLiked) await feedApi.likePost(this.post.id);
        else await feedApi.unlikePost(this.post.id);
      } catch (e) {
        this.localIsLiked = originalLiked;
        this.localLikeCount += this.localIsLiked ? 1 : -1;
      }
    },
    prepareReply(comment) {
      this.replyingTo = comment;
      // Focus input
    },
    cancelReply() {
      this.replyingTo = null;
      this.newCommentContent = '';
    }
  }
};
</script>

<style>
/* 全局样式覆盖 el-dialog，因为 scoped 无法覆盖 append-to-body 的 dialog */
.xhs-note-dialog .el-dialog__header {
  padding: 0;
  display: none;
}

.xhs-note-dialog .el-dialog__body {
  padding: 0;
  height: 85vh;
  /* 固定高度 */
  overflow: hidden;
  border-radius: 16px;
}

.xhs-note-dialog {
  border-radius: 16px;
  overflow: visible !important;
  /* 允许关闭按钮溢出 */
  background: #fff;
}
</style>

<style scoped>
.note-detail-container {
  display: flex;
  height: 100%;
}

/* 左侧媒体列 */
.media-column {
  flex: 1.5;
  background-color: #000;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-right: 1px solid #f0f0f0;
}

.media-wrapper {
  width: 100%;
  height: 100%;
}

.custom-carousel {
  height: 100%;
}

/* 轮播图每一个 item */
.img-bg-box {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.blur-bg {
  position: absolute;
  top: -10%;
  left: -10%;
  width: 120%;
  height: 120%;
  background-size: cover;
  background-position: center;
  filter: blur(20px) brightness(0.6);
  z-index: 1;
}

.main-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}

.no-image-placeholder {
  color: #fff;
  text-align: center;
  margin-top: 40%;
}

/* 右侧侧边栏 */
.sidebar-column {
  flex: 1;
  width: 360px;
  /* 最小宽度 */
  min-width: 350px;
  max-width: 450px;
  display: flex;
  flex-direction: column;
  background: #fff;
  position: relative;
}

.sidebar-header {
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
}

.author-area {
  display: flex;
  align-items: center;
}

.author-area .nickname {
  margin-left: 12px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.follow-btn {
  background-color: #ff2442;
  border-color: #ff2442;
  font-weight: 600;
}

.sidebar-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

/* 隐藏滚动条 */
.sidebar-scroll-area::-webkit-scrollbar {
  width: 0;
  display: none;
}

.note-content {
  padding: 20px 24px 10px;
}

.note-content .title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  line-height: 1.4;
}

.note-content .desc {
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
}

.note-content .desc>>>.highlight {
  color: #1333cc;
  margin-right: 4px;
}

.note-meta {
  margin-top: 12px;
  font-size: 12px;
  color: #999;
}

.note-meta .location {
  margin-left: 10px;
}

.section-divider {
  margin: 10px 0;
}

.comments-area {
  padding: 0 24px 20px;
}

.comment-count-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
}

.load-more-btn {
  text-align: center;
  color: #1333cc;
  padding: 15px;
  cursor: pointer;
  font-size: 13px;
}

.empty-comment {
  text-align: center;
  color: #ccc;
  padding: 20px;
  font-size: 14px;
}

/* 底部互动栏 */
.sidebar-footer {
  border-top: 1px solid #f0f0f0;
  padding: 12px 24px;
  background: #fff;
  z-index: 10;
  position: relative;
}

.reply-status-bar {
  position: absolute;
  top: -34px;
  left: 24px;
  background: rgba(0, 0, 0, 0.05);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  color: #666;
  display: flex;
  align-items: center;
}

.reply-status-bar i {
  margin-left: 8px;
  cursor: pointer;
}

.footer-inner {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-input>>>.el-input__inner {
  border-radius: 20px;
  background: #f5f5f5;
  border: none;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
}

.action-btn {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #333;
  font-size: 13px;
}

.action-btn i {
  font-size: 24px;
  margin-right: 4px;
}

.active-like {
  color: #ff2442;
}

.close-btn-float {
  position: absolute;
  top: -10px;
  left: -50px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  font-size: 20px;
  color: #333;
  /* 调整位置到左上角 */
}

@media (max-width: 800px) {
  .note-detail-container {
    flex-direction: column;
    overflow-y: auto;
  }

  .media-column {
    height: 300px;
  }

  .sidebar-column {
    width: 100%;
    max-width: 100%;
    flex: 1;
  }
}
</style>
