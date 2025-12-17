<!-- CommentItem.vue -->
<template>
  <div class="comment-item" :class="{ 'is-root': isRoot }">
    <el-avatar :size="35" :src="comment.user.avatar" class="comment-avatar" @click.native="goToUser"></el-avatar>
    <div class="comment-content-wrapper">
      <div class="comment-header">
        <span class="comment-user-nick clickable" @click="goToUser">{{ comment.user.nick }}</span>
        <span v-if="comment.replyToUser" class="reply-to">
          <i class="el-icon-caret-right"></i>
          <span class="comment-user-nick clickable" @click="goToRepliedUser">{{ comment.replyToUser.nick }}</span>
        </span>
      </div>
      <p class="comment-text">{{ comment.content }}</p>
      <div class="comment-footer">
        <span class="comment-time">{{ comment.createTime | formatTime }}</span>
        <span class="reply-btn clickable" @click="handleReply">回复</span>
      </div>
      <!-- 递归渲染子评论 -->
      <div v-if="comment.replies && comment.replies.length > 0" class="replies-container">
        <comment-item
          v-for="reply in comment.replies"
          :key="reply.id"
          :comment="reply"
          :is-root="false"
          @reply="propagateReply"
        ></comment-item>
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
      return TimeConvertUtil.formatTimeDifference(new Date().getTime() - new Date(value).getTime());
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
/* 根评论项 */
.comment-item {
  display: flex;
  padding: 16px 0;
}

/* 一级评论的特殊样式 */
.comment-item.is-root {
  padding-left: 20px; /* 一级评论的缩进 */
}

/* 一级评论之间的分割线 */
.comment-list > .comment-item:not(:last-child) {
  border-bottom: 1px solid #f0f2f5;
}

.comment-avatar {
  flex-shrink: 0;
  margin-right: 12px;
  cursor: pointer;
}

.comment-content-wrapper {
  flex-grow: 1;
  font-size: 14px;
  width: calc(100% - 47px);
}

.comment-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap; 
  margin-bottom: 6px;
}

.comment-user-nick {
  font-weight: 500;
  color: #555;
}

.reply-to {
  color: #909399;
  display: inline-flex;
  align-items: center;
  margin-left: 8px;
}

.reply-to .el-icon-caret-right {
  font-size: 12px;
  margin-right: 8px;
}

.comment-text {
  line-height: 1.6;
  color: #303133;
  word-break: break-word;
  white-space: pre-wrap;
}

.comment-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.reply-btn {
  font-weight: 500;
  color: #61666d;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.reply-btn:hover {
  background-color: #f1f2f3;
}

.clickable {
  cursor: pointer;
}

.clickable:hover {
  color: #409EFF;
}

/* 回复容器样式 */
.replies-container {
  border-left: 2px solid #eaeaef;
  padding-left: 16px; /* 回复的统一缩进 */
  margin-top: 12px;
}

/* 回复项样式 */
.replies-container .comment-item {
  padding: 12px 0;
  padding-left: 0; /* 取消一级评论的缩进 */
}

/* 回复之间的分割线 */
.replies-container .comment-item:not(:last-child) {
  border-bottom: 1px solid #f8f8f9;
}
</style>