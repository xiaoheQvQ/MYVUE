<template>
  <div class="analyze-container">
    <div class="video-grid">
      <div class="video-card" v-for="video in videoList" :key="video.id">
        <div class="card-cover">
          <img :src="video.cover.replace(/`/g, '').trim()" class="cover-image" />
          <span class="quality-badge" v-if="video.quality">{{ video.quality }}</span>
          <span class="duration-badge">{{ formatDuration(video.duration) }}</span>
        </div>

        <div class="card-content">
          <h3 class="video-title">{{ video.title }}</h3>

          <div class="stats-row">
            <div class="stat-item">
              <img class="stat-icon" src="@/assets/like-click.png" alt="点赞">
              <span class="stat-value">{{ video.like || 0 }}</span>
            </div>
            <div class="stat-item">
              <img class="stat-icon" src="@/assets/collect-click.png" alt="收藏">
              <span class="stat-value">{{ video.collect || 0 }}</span>
            </div>
            <div class="stat-item">
              <img class="stat-icon" src="@/assets/view.png" alt="观看">
              <span class="stat-value">{{ video.count }}</span>
            </div>
          </div>

          <div class="action-buttons">
            <el-button class="edit-btn" size="small" @click="handleEdit(video)">修改</el-button>
            <el-button class="delete-btn" size="small" @click="handleDelete(video)">删除</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Global from '@/components/Global.vue'
import videoApi from '@/api/video/video'

export default {
  data() {
    return {
      videoList: []
    }
  },
  methods: {
    async fetchVideos() {
      const userId = Global.user.id
      videoApi.getWorks(userId).then(res => {
        this.videoList = res.data
      })
    },
    formatDuration(seconds) {
      if (!seconds) return '00:00'
      const m = Math.floor(seconds / 60)
      const s = Math.floor(seconds % 60)
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    },
    formatDate(dateStr) {
      if (!dateStr) return ''
      return dateStr.split('T')[0]
    },
    handleEdit(video) {
      this.$router.push({
        path: '/change',
        query: {
          videoId: video.id
        }
      })
    },
    handleDelete(video) {
      this.$confirm('确定要删除这个视频吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        videoApi.deleteVideo(video.id).then(res => {
          this.$message.success('删除成功')
          this.fetchVideos()
        }).catch(err => {
          this.$message.error('删除失败: ' + (err.message || '未知错误'))
        })
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    }
  },
  mounted() {
    this.fetchVideos()
  }
}
</script>

<style scoped>
.analyze-container {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.video-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.video-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.card-cover {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  /* 16:9 aspect ratio */
  overflow: hidden;
  background: #000;
}

.cover-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.quality-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.duration-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.card-content {
  padding: 16px;
}

.video-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 42px;
}

.stats-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 13px;
}

.stat-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.stat-value {
  font-weight: 500;
  color: #333;
}

.action-buttons {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.edit-btn {
  flex: 1;
  background: #409EFF;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.edit-btn:hover {
  background: #66b1ff;
}

.delete-btn {
  flex: 1;
  background: #F56C6C;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.delete-btn:hover {
  background: #f78989;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .video-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  .analyze-container {
    padding: 12px;
  }
}
</style>
