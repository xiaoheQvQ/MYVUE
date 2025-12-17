<template>
  <el-drawer
    :visible.sync="localVisible"
    direction="rtl"
    :with-header="false"
    size="450px"
    @closed="onDrawerClosed"
  >
    <div class="comment-drawer-container">
      <!-- 头部 -->
      <div class="drawer-header">
        <h3>评论 ({{ totalComments }})</h3>
      </div>

      <!-- 评论列表 -->
      <el-scrollbar class="comment-list-scrollbar">
        <div class="comment-list" v-if="comments.length > 0">
          <!-- 修改: 监听 @reply 事件 -->
          <comment-item
            v-for="comment in comments"
            :key="comment.id"
            :comment="comment"
            @reply="prepareReply"
          ></comment-item>
        </div>
        <el-empty v-else description="还没有评论，快来抢沙发吧！"></el-empty>
        <div class="load-more" v-if="hasMore" @click="fetchComments">
            {{ isLoading ? '加载中...' : '加载更多' }}
        </div>
      </el-scrollbar>

      <!-- 评论输入框 -->
      <div class="comment-input-area">
        <!-- 新增: 回复提示 -->
        <div v-if="replyingTo" class="reply-indicator">
          <span>回复 @{{ replyingTo.user.nick }}</span>
          <i class="el-icon-close" @click="cancelReply"></i>
        </div>
        <div class="input-wrapper">
          <el-input
            ref="commentInput"
            type="textarea"
            :rows="2"
            :placeholder="inputPlaceholder"
            v-model="newCommentContent"
            @keydown.enter.native.prevent="submitComment"
          >
          </el-input>
          <el-button type="primary" size="small" @click="submitComment" :disabled="!newCommentContent.trim()">发送</el-button>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script>
import feedApi from '@/api/feed/feed';
import CommentItem from './CommentItem.vue';

export default {
  name: "PostCommentDrawer",
  components: { CommentItem },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    postId: {
      type: [Number, String],
      default: null,
    },
  },
  data() {
    return {
      comments: [],
      isLoading: false,
      pagination: {
        current: 1,
        size: 10,
      },
      totalComments: 0,
      hasMore: true,
      newCommentContent: '',
      // 新增: 用于记录正在回复的评论对象
      replyingTo: null,
    };
  },
  computed: {
    localVisible: {
      get() { return this.visible; },
      set(val) { this.$emit('update:visible', val); },
    },
    // 修改: 动态的placeholder
    inputPlaceholder() {
        return '留下你的精彩评论吧';
    }
  },
  methods: {
    async fetchComments(isInitial = false) {
      if (this.isLoading || !this.postId) return;
      this.isLoading = true;
      try {
        const res = await feedApi.getPostComments(this.postId, this.pagination);
        const data = res.data;
        this.comments = isInitial ? data.records : [...this.comments, ...data.records];
        this.totalComments = data.total;
        this.hasMore = data.current < data.pages;
        if(this.hasMore) this.pagination.current++;
      } catch (error) {
        console.error("获取评论失败:", error);
        this.$message.error("获取评论失败");
      } finally {
        this.isLoading = false;
      }
    },
    async submitComment() {
      if (!this.newCommentContent.trim()) return;
      this.isLoading = true;
      
      // 修改: 构建包含 parentId 和 replyToUserId 的 payload
      const payload = {
        content: this.newCommentContent,
        parentId: this.replyingTo ? this.replyingTo.id : null, 
        replyToUserId: this.replyingTo ? this.replyingTo.user.id : null,
      };

      try {
        const res = await feedApi.addPostComment(this.postId, payload);
        const newComment = res.data; // 后端应返回完整的新评论对象

        // 修改: 智能插入新评论到UI
        if (this.replyingTo) {
          // 如果是回复，需要找到父评论并将新回复插入其 replies 数组
          const findAndAddReply = (comments, parentId, reply) => {
            for (let comment of comments) {
              if (comment.id === parentId) {
                if (!comment.replies) {
                  this.$set(comment, 'replies', []); // 确保 `replies` 数组存在且具有响应性
                }
                comment.replies.unshift(reply); // 插入到回复列表顶部
                return true;
              }
              if (comment.replies && findAndAddReply(comment.replies, parentId, reply)) {
                return true;
              }
            }
            return false;
          };
          findAndAddReply(this.comments, this.replyingTo.id, newComment);
        } else {
          // 如果是新的一级评论，直接加到列表顶部
          this.comments.unshift(newComment);
        }

        this.$message.success('评论成功');
        this.cancelReply(); // 清空输入框和回复状态
        this.totalComments++;
        this.$emit('comment-added');

      } catch (error) {
        console.error("评论/回复失败:", error);
        this.$message.error("操作失败");
      } finally {
        this.isLoading = false;
      }
    },
    // 新增: 准备回复，由 CommentItem 的 @reply 事件触发
    prepareReply(comment) {
      this.replyingTo = comment;
      this.$nextTick(() => {
        this.$refs.commentInput.focus();
      });
    },
    // 新增: 取消回复
    cancelReply() {
      this.newCommentContent = '';
      this.replyingTo = null;
    },
    onDrawerClosed() {
      this.comments = [];
      this.pagination.current = 1;
      this.totalComments = 0;
      this.hasMore = true;
      this.cancelReply();
    },
  },
  watch: {
    visible(newVal) {
      if (newVal && this.postId) {
        this.fetchComments(true);
      }
    },
  },
};
</script>

<style scoped>
.comment-drawer-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.drawer-header {
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}
.drawer-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}
.comment-list-scrollbar {
  flex-grow: 1;
}
 .el-scrollbar__wrap {
  overflow-x: hidden;
}
.comment-list {
  padding: 0 16px;
}
.load-more {
    text-align: center;
    padding: 15px;
    color: #409EFF;
    cursor: pointer;
    font-size: 14px;
}
.comment-input-area {
  padding: 12px 16px;
  border-top: 1px solid #e8e8e8;
  flex-shrink: 0;
  background-color: #fff;
}
/* 新增: 回复提示条样式 */
.reply-indicator {
    padding: 4px 8px;
    background-color: #f4f4f5;
    border-radius: 4px;
    font-size: 12px;
    color: #909399;
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.reply-indicator .el-icon-close {
    cursor: pointer;
    font-weight: bold;
}
.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}
.input-wrapper .el-textarea {
    flex-grow: 1;
}
</style>
