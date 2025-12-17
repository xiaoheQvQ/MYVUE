<template>
  <div class="post-card ultra-compact">
    <!-- 1. 作者信息 -->
    <div class="author-info">
      <el-avatar :size="36" :src="post.author.avatar" @click.native="goToUser" class="clickable"></el-avatar>
      <div class="author-details">
        <span class="nickname clickable" @click="goToUser">{{ post.author.nick }}</span>
        <span class="time">{{ post.createTime | formatTime }}</span>
      </div>
    </div>

    <!-- 2. 动态内容 -->
    <div class="post-content-wrapper clickable" @click="handleViewComments">
      <p class="content-text" v-html="highlightContent(post.content)"></p>
    </div>

    <!-- 3. 图片网格 - 严格行高布局 -->
    <div v-if="post.imageUrls && post.imageUrls.length"
         :class="['image-grid', `grid-count-${post.imageUrls.length > 9 ? 9 : post.imageUrls.length}`]">
      <el-image
        v-for="(url, index) in post.imageUrls"
        :key="index"
        :src="url"
        :preview-src-list="post.imageUrls"
        :initial-index="index"
        fit="cover"
        class="grid-image clickable"
        lazy
      ></el-image>
    </div>

    <!-- 4. 操作栏 -->
    <div class="actions">
      <span class="action-item clickable">
        <i class="el-icon-share"></i>
        <span>分享</span>
      </span>
      <span class="action-item clickable" @click="handleViewComments">
        <i class="el-icon-chat-dot-round"></i>
        <span>{{ post.commentCount > 0 ? post.commentCount : '评论' }}</span>
      </span>
      <span :class="{'active': localIsLiked}" class="action-item clickable" @click.stop="toggleLike">
        <i class="el-icon-thumb"></i>
        <span>{{ localLikeCount > 0 ? localLikeCount : '点赞' }}</span>
      </span>
    </div>
  </div>
</template>

<script>
// ---------- Script 部分与之前版本相同，无需修改 ----------
import feedApi from '@/api/feed/feed';
import TimeConvertUtil from '@/utils/time-convert';

export default {
  name: "PostCard",
  props: {
    post: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      localIsLiked: this.post.isLiked,
      localLikeCount: this.post.likeCount,
    };
  },
  filters: {
    formatTime(value) {
      if (!value) return '';
      const now = new Date().getTime();
      const postTime = new Date(value).getTime();
      const diff = now - postTime;
      return TimeConvertUtil.formatTimeDifference(diff);
    },
  },
  methods: {
    goToUser() {
      if (this.post.author && this.post.author.id) {
        this.$router.push({ path: '/user/profile', query: { id: this.post.author.id } });
      }
    },
    
    handleViewComments() {
      this.$emit('view-comments', this.post.id);
    },
    
    async toggleLike() {
      if (this.localIsLiked) {
        this.localLikeCount--;
      } else {
        this.localLikeCount++;
      }
      this.localIsLiked = !this.localIsLiked;

      try {
        if (!this.localIsLiked) {
          await feedApi.unlikePost(this.post.id);
        } else {
          await feedApi.likePost(this.post.id);
        }
        this.$emit('update-post', { ...this.post, isLiked: this.localIsLiked, likeCount: this.localLikeCount });
      } catch (error) {
        console.error("点赞/取消点赞失败:", error);
        this.$message.error('操作失败，请稍后再试');
        if (this.localIsLiked) {
            this.localLikeCount--;
        } else {
            this.localLikeCount++;
        }
        this.localIsLiked = !this.localIsLiked;
      }
    },
    
    highlightContent(content) {
        if (!content) return '';
        const regex = /(@\S+)|(#.*?#)/g;
        return content.replace(regex, (match) => {
            return `<span class="highlight">${match}</span>`;
        });
    }
  },
  watch: {
    post: {
        handler(newVal) {
            this.localIsLiked = newVal.isLiked;
            this.localLikeCount = newVal.likeCount;
        },
        deep: true,
    },
  },
};
</script>

<style scoped>
:root {
  --image-grid-gap: 3px;
  --image-row-height: 110px;
}

/* ================== 极致压缩全局样式 ================== */
.post-card.ultra-compact {
  padding: 10px;
  margin-bottom: 8px;
  border-radius: 6px;
  box-shadow: none;
  border-bottom: 1px solid #f0f2f5;
  transition: background-color 0.2s ease;
}
.post-card.ultra-compact:hover {
  background-color: #fcfcfc;
}

.clickable {
  cursor: pointer;
}

/* 作者信息 */
.author-info {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.author-details {
  margin-left: 8px;
  display: flex;
  flex-direction: column;
}
.nickname {
  font-weight: 500;
  color: #333;
  font-size: 13px; /* 更小 */
}
.nickname:hover {
  color: #409EFF;
}
.time {
  font-size: 11px;
  color: #aaa;
  margin-top: 1px;
}

/* 动态内容 */
.post-content-wrapper {
  margin-bottom: 8px;
}
.content-text {
  font-size: 13px; /* 更小 */
  line-height: 1.5; /* 更紧凑的行高 */
  color: #18191c;
  white-space: pre-wrap;
  word-break: break-word;
}
.content-text >>> .highlight {
  color: #40a9ff;
}

/* ================== 图片网格 - 严格行高布局 ================== */
.image-grid {
  display: grid;
  gap: var(--image-grid-gap);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 6px;
}
.grid-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: #f0f2f5;
}

/* --- 1. 单行布局 (1, 2, 3 张图) --- */
.grid-count-1, .grid-count-2, .grid-count-3 {
  height: calc(var(--image-row-height) * 1.5); /* 单张图可以高一点 */
}
.grid-count-1 { max-width: 70%; }
.grid-count-2 { grid-template-columns: repeat(2, 1fr); height: var(--image-row-height); }
.grid-count-3 { grid-template-columns: repeat(3, 1fr); height: var(--image-row-height); }


/* --- 2. 双行布局 (4, 5, 6 张图) --- */
.grid-count-4, .grid-count-5, .grid-count-6 {
  height: calc(var(--image-row-height) * 2 + var(--image-grid-gap));
}
.grid-count-4 { grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); }
.grid-count-6 { grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(2, 1fr); }
/* 5张图(上二下三)的特殊布局 */
.grid-count-5 {
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
}
.grid-count-5 .grid-image:nth-child(3) { grid-column: 1 / 2; }
.grid-count-5 .grid-image:nth-child(4) { grid-column: 2 / 3; }
.grid-count-5 .grid-image:nth-child(5) { grid-column: 1 / 3; grid-row: 2 / 1; }
.grid-count-5 {
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: repeat(2, 1fr);
}
.grid-count-5 .grid-image:nth-child(1) { grid-column: 1 / 4; grid-row: 1 / 2; }
.grid-count-5 .grid-image:nth-child(2) { grid-column: 4 / 7; grid-row: 1 / 2; }
.grid-count-5 .grid-image:nth-child(3) { grid-column: 1 / 3; grid-row: 2 / 3; }
.grid-count-5 .grid-image:nth-child(4) { grid-column: 3 / 5; grid-row: 2 / 3; }
.grid-count-5 .grid-image:nth-child(5) { grid-column: 5 / 7; grid-row: 2 / 3; }

/* --- 3. 三行布局 (7, 8, 9 张图) --- */
.grid-count-7, .grid-count-8, .grid-count-9 {
  height: calc(var(--image-row-height) * 3 + (var(--image-grid-gap) * 2));
}
.grid-count-9 { grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr); }
/* 7张图(左一右六)的特殊布局 */
.grid-count-7 {
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
}
.grid-count-7 .grid-image:first-child { grid-column: 1 / 2; grid-row: 1 / 4; }
.grid-count-7 .grid-image:nth-child(2) { grid-column: 2 / 3; grid-row: 1 / 2; }
.grid-count-7 .grid-image:nth-child(3) { grid-column: 3 / 4; grid-row: 1 / 2; }
.grid-count-7 .grid-image:nth-child(4) { grid-column: 2 / 3; grid-row: 2 / 3; }
.grid-count-7 .grid-image:nth-child(5) { grid-column: 3 / 4; grid-row: 2 / 3; }
.grid-count-7 .grid-image:nth-child(6) { grid-column: 2 / 3; grid-row: 3 / 4; }
.grid-count-7 .grid-image:nth-child(7) { grid-column: 3 / 4; grid-row: 3 / 4; }
/* 8张图(上二下六)的特殊布局 */
.grid-count-8 {
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
}
.grid-count-8 .grid-image:nth-child(1) { grid-column: 1 / 2; }
.grid-count-8 .grid-image:nth-child(2) { grid-column: 2 / 4; }
.grid-count-8 .grid-image:nth-child(3) { grid-row: 2 / 3; }
.grid-count-8 .grid-image:nth-child(4) { grid-row: 2 / 3; }
.grid-count-8 .grid-image:nth-child(5) { grid-row: 2 / 3; }
.grid-count-8 .grid-image:nth-child(6) { grid-row: 3 / 4; }
.grid-count-8 .grid-image:nth-child(7) { grid-row: 3 / 4; }
.grid-count-8 .grid-image:nth-child(8) { grid-row: 3 / 4; }

/* 操作栏 */
.actions {
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-top: 1px solid #f8f8f8;
  margin-top: 8px;
  padding-top: 6px;
}
.action-item {
  display: flex;
  align-items: center;
  color: #8a919f;
  font-size: 12px; /* 更小 */
  flex-grow: 1;
  justify-content: center;
  padding: 2px 0;
  border-radius: 4px;
}
.action-item:hover {
  background-color: #f7f8fa;
  color: #333;
}
.action-item i {
  margin-right: 4px;
  font-size: 15px; /* 更小 */
}
.action-item.active {
  color: #ff69b4;
  font-weight: 500;
}
</style>
