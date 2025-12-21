<template>
  <div class="comment-item" :class="{ 'is-root': isRoot }">
    <!-- 左侧头像 -->
    <div class="comment-left">
      <el-avatar :size="isRoot ? 40 : 24" :src="comment.user.avatar" class="comment-avatar clickable"
        @click.native="goToUser"></el-avatar>
    </div>

    <!-- 右侧内容 -->
    <div class="comment-right">
      <!-- 第一行：昵称 + 点赞(右浮动) -->
      <div class="comment-header-row">
        <div class="user-info">
          <span class="user-nick clickable" @click="goToUser">{{ comment.user.nick }}</span>
          <span v-if="comment.user.isAuthor" class="author-badge">作者</span>
          <span v-if="comment.replyToUser" class="reply-target-wrapper">
            <i class="el-icon-caret-right"></i>
            <span class="user-nick clickable" @click="goToRepliedUser">{{ comment.replyToUser.nick }}</span>
          </span>
        </div>

        <!-- 点赞 (布局在右上角) -->
        <div class="comment-like-wrapper clickable">
          <i class="el-icon-star-off"></i>
          <span class="like-num" v-if="comment.likeCount > 0">{{ comment.likeCount }}</span>
        </div>
      </div>

      <!-- 第二行：评论内容 -->
      <div class="comment-content-text clickable" @click="handleReply">
        {{ comment.content }}
      </div>

      <!-- 第三行：底部信息 (时间 地点 回复) -->
      <div class="comment-footer-info">
        <span class="info-item">{{ comment.createTime | formatTime }}</span>
        <span class="info-item" v-if="comment.location">{{ comment.location }}</span>
        <span class="reply-btn clickable" @click="handleReply">回复</span>
        <!-- 更多操作三个点，可选 -->
        <!-- <i class="el-icon-more info-more"></i> -->
      </div>

      <!-- 子评论区域 -->
      <div v-if="comment.replies && comment.replies.length > 0" class="sub-comments-list">
        <comment-item v-for="reply in comment.replies" :key="reply.id" :comment="reply" :is-root="false"
          @reply="propagateReply"></comment-item>
      </div>
    </div>
  </div>
</template>

<script>
import TimeConvertUtil from '@/utils/time-convert';

export default {
  name: "CommentItem",
  props: {
    comment: {
      type: Object,
      required: true,
    },
    isRoot: {
      type: Boolean,
      default: true
    }
  },
  filters: {
    formatTime(value) {
      if (!value) return '';
      // 12小时前，不再精确到秒
      const date = new Date(value);
      const now = new Date();
      const diff = now - date;
      return TimeConvertUtil.formatTimeDifference(diff);
    },
  },
  methods: {
    goToUser() {
      if (this.comment.user && this.comment.user.id) {
        this.$router.push({ path: '/user/profile', query: { id: this.comment.user.id } });
      }
    },
    goToRepliedUser() {
      if (this.comment.replyToUser && this.comment.replyToUser.id) {
        this.$router.push({ path: '/user/profile', query: { id: this.comment.replyToUser.id } });
      }
    },
    handleReply() {
      this.$emit("reply", this.comment);
    },
    propagateReply(comment) {
      this.$emit("reply", comment);
    }
  },
};
</script>

<style scoped>
.comment-item {
  display: flex;
  padding: 10px 0;
  position: relative;
}

.comment-item.is-root {
  border-bottom: 1px solid #f8f8f8;
  margin-bottom: 1px;
}

.comment-item.is-root:last-child {
  border-bottom: none;
}

.comment-left {
  margin-right: 12px;
  flex-shrink: 0;
}

.comment-right {
  flex-grow: 1;
  width: 0;
  /* 防止flex子项撑开父容器 */
}

/* 头部行 */
.comment-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
}

.user-info {
  font-size: 13px;
  color: #999;
  display: flex;
  align-items: center;
}

.user-nick {
  color: #999;
  /* 昵称灰色 */
  margin-right: 6px;
}

.author-badge {
  background: #ff2442;
  color: #fff;
  font-size: 10px;
  padding: 0 4px;
  border-radius: 4px;
  margin-right: 6px;
  height: 16px;
  line-height: 16px;
}

.reply-target-wrapper {
  display: flex;
  align-items: center;
  color: #999;
}

.comment-like-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #555;
  font-size: 12px;
  margin-left: 10px;
  cursor: pointer;
}

.comment-like-wrapper i {
  font-size: 16px;
  margin-bottom: 2px;
}

.like-num {
  font-size: 12px;
  color: #555;
  line-height: 1;
}

/* 内容 */
.comment-content-text {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  margin-bottom: 6px;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 底部信息 */
.comment-footer-info {
  display: flex;
  font-size: 12px;
  color: #999;
  align-items: center;
}

.info-item {
  margin-right: 12px;
}

.reply-btn {
  font-weight: 500;
  color: #333;
}

.reply-btn:hover {
  color: #1333cc;
}

/* 子评论 */
.sub-comments-list {
  margin-top: 10px;
}

/* 子评论样式微调 */
.sub-comments-list .comment-item {
  padding: 6px 0;
  border: none;
}

.clickable {
  cursor: pointer;
}
</style>
```
