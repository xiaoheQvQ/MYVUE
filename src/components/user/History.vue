<template>
  <div class="history-container">
    <div class="history-grid">
      <div 
        v-for="history in paginatedHistory" 
        :key="history.id" 
        class="history-card" 
      >
        <div class="card" style="border-radius: 8px; ">
          <div class="cover-container" @click="play(history.id)">
            <img class="cover" :src="history.cover" alt="Video cover">
            <div class="cover-overlay">
              <span class="duration">{{formatDuration(history.duration)}}</span>
              <span class="views">{{history.count}}次观看</span>
            </div>
          </div>
          <div class="card-content">
            <el-link type="primary" class="title">{{history.title}}</el-link>
            <div class="meta-info">
              <UserPopUp :avatar="history.avatar" :id="history.userId" :nick="history.nick" />
              <span class="separator"> | </span>
              <span class="viewTime">{{formatViewTime(history.viewTime)}}</span>
              <span class="separator"> | </span>
              <span class="progress">{{history.progress}}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <el-pagination
      class="pagination"
      layout="prev, pager, next"
      :total="historyList.length"
      :page-size="12"
      @current-change="handlePageChange"
    />
  </div>
</template>

<script>
import Global from '@/components/Global.vue'
import videoApi from '@/api/video/video'
import UserPopUp from '@/components/user/UserPopUp.vue'

export default {
  name: 'History',
  components: {
    UserPopUp
  },
  data () {
    return {
      historyList: [],
      currentPage: 1
    }
  },
  mounted () {
    this.getHistoryList()
  },
  computed: {
    paginatedHistory() {
      const start = (this.currentPage - 1) * 12;
      const end = start + 12;
      return this.historyList.slice(start, end);
    }
  },
  methods: {
    getHistoryList () {
      if (!Global.user) {
        this.$message.error('请登录')
        this.$router.push('/login')
        return
      }
      videoApi.getHistoryList().then(res => {
        this.historyList = res.data
      
      })
    },
    play (videoId) {
      this.$router.push({
        name: 'videoPlayer',
        query: {
          videoId: videoId
        }
      })
    },
    formatDuration(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs < 10 ? '0' + secs : secs}`;
    },
    handlePageChange(page) {
      this.currentPage = page;
    },
    formatViewTime(timestamp) {
      const now = new Date();
      const viewTime = new Date(timestamp);
      const diffMs = now - viewTime;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffMins < 60) {
        return `${diffMins}分钟前`;
      } else if (diffHours < 24) {
        return `${diffHours}小时前`;
      } else {
        const month = viewTime.getMonth() + 1;
        const day = viewTime.getDate();
        const hours = viewTime.getHours().toString().padStart(2, '0');
        const minutes = viewTime.getMinutes().toString().padStart(2, '0');
        return `${month}月${day}日 ${hours}:${minutes}`;
      }
    }
  }
}
</script>

<style scoped>
.history-container {
  padding: 40px;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 35px;
  margin-bottom: 20px;
}

.card {
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.3s;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.1);
 
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.2);
}

.cover-container {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 比例 */
  cursor: pointer;
}

.cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 4px 8px;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.card-content {
  padding: 12px 10px;
  min-height: 60px; /* 确保内容区域有最小高度 */
}

.title {
  display: -webkit-box;
  -webkit-line-clamp: 2; /* 标题最多显示两行 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 6px;
  line-height: 1.4;
  white-space: normal; /* 允许换行 */
}

.meta-info {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #666;
}

.separator {
  margin: 0 5px;
  color: #999;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
