<template>
  <div class="xhs-card" @click="handleViewComments">
    <!-- 1. 封面图区域 -->
    <div class="card-cover" v-if="post.imageUrls && post.imageUrls.length > 0">
      <el-image :src="post.imageUrls[0]" fit="cover" class="cover-image" lazy>
        <div slot="placeholder" class="image-slot">
          <i class="el-icon-picture-outline"></i>
        </div>
      </el-image>
      <!-- 多图标记 -->
      <div v-if="post.imageUrls.length > 1" class="multi-img-badge">
        <i class="el-icon-copy-document"></i>
      </div>
    </div>

    <!-- 2. 内容区域 -->
    <div class="card-body">
      <!-- 标题/内容 -->
      <div class="post-content">
        <span class="content-text" v-html="highlightContent(post.content)"></span>
      </div>

      <!-- 3. 底部信息：作者 + 点赞 -->
      <div class="card-footer">
        <div class="author-info clickable" @click.stop="goToUser">
          <el-avatar :size="20" :src="post.author.avatar" class="author-avatar"></el-avatar>
          <span class="author-name">{{ post.author.nick }}</span>
        </div>

        <div class="like-wrapper clickable" @click.stop="toggleLike">
          <i :class="localIsLiked ? 'el-icon-star-on active' : 'el-icon-star-off'"></i>
          <span class="like-count" v-if="localLikeCount > 0">{{ localLikeCount }}</span>
          <span class="like-count" v-else>赞</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import feedApi from '@/api/feed/feed'
import TimeConvertUtil from '@/utils/time-convert'

export default {
  name: 'PostCard',
  props: {
    post: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      localIsLiked: this.post.isLiked,
      localLikeCount: this.post.likeCount
    }
  },
  methods: {
    goToUser() {
      if (this.post.author && this.post.author.id) {
        this.$router.push({ path: '/user/profile', query: { id: this.post.author.id } })
      }
    },

    handleViewComments() {
      this.$emit('view-comments', this.post.id)
    },

    async toggleLike() {
      // 乐观更新
      const originalLiked = this.localIsLiked
      const originalCount = this.localLikeCount

      if (this.localIsLiked) {
        this.localLikeCount--
      } else {
        this.localLikeCount++
      }
      this.localIsLiked = !this.localIsLiked

      try {
        if (originalLiked) {
          await feedApi.unlikePost(this.post.id)
        } else {
          await feedApi.likePost(this.post.id)
        }
        // 更新父组件数据
        this.$emit('update-post', { ...this.post, isLiked: this.localIsLiked, likeCount: this.localLikeCount })
      } catch (error) {
        console.error('操作失败:', error)
        this.$message.error('操作失败')
        // 回滚
        this.localIsLiked = originalLiked
        this.localLikeCount = originalCount
      }
    },

    highlightContent(content) {
      if (!content) return ''
      // 简单处理，截取前50个字作为展示
      let displayContent = content.length > 50 ? content.substring(0, 50) + '...' : content

      // 高亮话题和at
      const regex = /(@\S+)|(#.*?#)/g
      return displayContent.replace(regex, (match) => {
        return `<span class="highlight">${match}</span>`
      })
    }
  },
  watch: {
    post: {
      handler(newVal) {
        this.localIsLiked = newVal.isLiked
        this.localLikeCount = newVal.likeCount
      },
      deep: true
    }
  }
}
</script>

<style scoped>
.xhs-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 0;
  /* 让瀑布流布局控制间距 */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  border: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
}

.xhs-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-cover {
  position: relative;
  width: 100%;
  /* remove fixed padding to allow variable height */
  /* padding-bottom: 133%; */
  background-color: #f5f5f5;
  overflow: hidden;
  /* 确保图片加载前有最小高度，或者由内容撑开 */
  min-height: 100px;
}

.card-cover .cover-image {
  /* relative positioning so it flows with document */
  position: relative;
  width: 100%;
  height: auto;
  display: block;
}

.multi-img-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #fff;
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 12px;
}

.card-body {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex-grow: 1;
}

.post-content {
  margin-bottom: 8px;
}

.content-text {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  /* 限制显示2行 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-weight: 500;
}

.content-text>>>.highlight {
  color: #1333cc;
  margin-right: 4px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.author-info {
  display: flex;
  align-items: center;
  overflow: hidden;
}

.author-avatar {
  margin-right: 6px;
  flex-shrink: 0;
  border: 1px solid #f0f0f0;
}

.author-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

.like-wrapper {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.like-wrapper i {
  font-size: 16px;
  margin-right: 2px;
  color: #555;
  transition: color 0.2s;
}

.like-wrapper i.active,
.like-wrapper:hover i {
  color: #ff2442;
  /* 小红书红 */
}

.like-count {
  min-width: 12px;
}

/* 针对没有封面的纯文本卡片调整 */
.card-cover+.card-body {
  padding-top: 10px;
}

/* 如果没有封面，可能需要调整比例或者允许自适应高度 */
.xhs-card:not(:has(.card-cover)) .post-content {
  -webkit-line-clamp: 5;
  /* 纯文本可以显示更多行 */
}
</style>
