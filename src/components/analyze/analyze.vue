<template>
  <div class="video-list">
    <div class="video-item" v-for="video in videoList" :key="video.id">
      <div class="cover-wrapper">
        <img :src="video.cover.replace(/`/g, '').trim()" class="cover" />
        <span class="duration">{{ formatDuration(video.duration) }}</span>
      </div>
      <div class="video-info">
        <div class="title">{{ video.title }}</div>

        <div class="actions">
          <div class="action-group">
            <div class="action-item">
              <img class="icon small" src="@/assets/like-click.png" alt="点赞次数">
              <span>{{ video.like || 0 }}</span>
            </div>
            <div class="action-item">
              <img class="icon small" src="@/assets/collect-click.png" alt="收藏数量">
              <span>{{ video.collect || 0 }}</span>
            </div>
            <div class="action-item">
              <img class="icon small" src="@/assets/view.png" alt="观看次数">
              <span>{{ video.count }}</span>
            </div>
          </div>
          <div class="btn-group">
            <el-button type="primary" size="mini" @click="handleEdit(video)">修改</el-button>
            <el-button type="danger" size="mini" @click="handleDelete(video)">删除</el-button>
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
  data () {
    return {
      videoList: []
    }
  },
  methods: {
    async fetchVideos () {
      const userId = Global.user.id
      videoApi.getWorks(userId).then(res => {
        this.videoList = res.data
      })
    },
    formatDuration (seconds) {
      if (!seconds) return '00:00'
      const m = Math.floor(seconds / 60)
      const s = Math.floor(seconds % 60)
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    },
    formatDate (dateStr) {
      if (!dateStr) return ''
      return dateStr.split('T')[0]
    },
    handleEdit (video) {
      this.$router.push({
        path: '/change',
        query: {
          videoId: video.id
        }
      })
    },
    handleDelete (video) {
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
  mounted () {
    this.fetchVideos()
  }
}
</script>

<style scoped>
.video-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.video-item {
  display: flex;
  align-items: flex-start;
  border-bottom: 1px solid #eee;
  padding-bottom: 16px;
}
.cover-wrapper {
  position: relative;
  width: 160px;
  height: 90px;
  margin-right: 16px;
}
.cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}
.duration {
  position: absolute;
  right: 8px;
  bottom: 8px;
  background: rgba(0,0,0,0.7);
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}
.video-info {
  flex: 1;
}
.title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
}
.meta {
  color: #888;
  font-size: 13px;
  margin-bottom: 8px;
}
.actions {
  display: flex;
  align-items: center;
  gap: 24px;
  color: #666;
  font-size: 14px;
  margin-top: 8px;
}
.action-group {
  display: flex;
  gap: 20px;
  align-items: center;
}
.action-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
.icon.small {
  width: 24px;
  height: 24px;
  object-fit: contain;
}
.btn-group {
  display: flex;
  gap: 8px;
}
.el-button {
  border-radius: 16px;
  font-size: 13px;
  padding: 4px 14px;
  transition: box-shadow 0.2s;
}
.el-button:hover {
  box-shadow: 0 2px 8px rgba(64,158,255,0.15);
}
</style>
