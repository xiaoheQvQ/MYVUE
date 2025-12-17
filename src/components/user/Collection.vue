<template>
  <div class="collection-container">
    <div class="collection-grid">
      <div 
        v-for="collection in paginatedCollections" 
        :key="collection.id" 
        class="collection-card"
      >
        <div class="card">
          <div class="cover-container">
            <img class="cover" :src="collection.cover" @click="play(collection.id)" alt="Video cover">
            <div class="cover-overlay">
              <span class="duration">{{ formatDuration(collection.duration) }}</span>
              <span class="views">{{ collection.count }}次观看</span>
            </div>
          </div>
          <div class="card-content">
            <h3 class="title">{{ collection.title }}</h3>
            <div class="meta-info">
              <span class="nick">{{ collection.nick }}</span>
              <span class="time">{{ formatTime(collection.createTime) }}</span>
            </div>
            <button class="cancel-btn" @click="cancelCollection(collection.id)">取消收藏</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Element UI 分页组件 -->
    <el-pagination
      v-if="allCollections.length > pageSize"
      @current-change="handleCurrentChange"
      :current-page="currentPage"
      :page-size="pageSize"
      layout="prev, pager, next, jumper"
      :total="allCollections.length"
      class="pagination"
    >
    </el-pagination>
  </div>
</template>

<script>
import videoApi from '@/api/video/video'
import UserPopUp from '@/components/user/UserPopUp.vue'
export default {
  name: 'Collection',
  components: {
    UserPopUp
  },
  data () {
    return {
      allCollections: [],  // 所有收藏视频
      currentPage: 1,      // 当前页码
      pageSize: 8         // 每页显示的视频数量
    }
  },
  computed: {
    // 获取当前页的视频
    paginatedCollections() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.allCollections.slice(start, end)
    }
  },
  mounted () {
    this.getCollections()
  },
  methods: {
    getCollections () {
      videoApi.getCollections().then(res => {
        this.allCollections = res.data
        this.currentPage = 1 // 重置到第一页
      })
    },
    play (id) {
      this.$router.push({
        path: '/video-player',
        query: {
          videoId: id
        }
      })
    },
    cancelCollection (id) {
      videoApi.collect(id).then(() => {
        this.getCollections()
      })
    },
    formatDuration(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs < 10 ? '0' + secs : secs}`;
    },
    formatTime(timestamp) {
      const now = new Date();
      const date = new Date(timestamp);
      const diff = (now - date) / 1000; // 秒数差
      
      if (diff < 60) {
        return '刚刚';
      } else if (diff < 3600) {
        return `${Math.floor(diff / 60)}分钟前`;
      } else if (diff < 86400) {
        return `${Math.floor(diff / 3600)}小时前`;
      } else {
        return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes()}`;
      }
    },
    // 分页切换
    handleCurrentChange(val) {
      this.currentPage = val
      // 滚动到顶部，提升用户体验
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
}
</script>

<style scoped>
.collection-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
}

.collection-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 每行4个视频 */
  gap: 20px;
  margin-bottom: 30px;
  /* 自适应高度，根据内容自动调整 */
  min-height: 0; /* 修复CSS Grid的min-height默认行为 */
}

.collection-card {
  width: 100%;
  min-height: 0; /* 修复CSS Grid的min-height默认行为 */
}

.card {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  background: white;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.cover {
  width: 100%;
  height: 180px;
  object-fit: cover;
  cursor: pointer;
  transition: opacity 0.3s ease;
}

.cover:hover {
  opacity: 0.9;
}

.card-content {
  padding: 16px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}


.title {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
  font-weight: 500;
  line-height: 1.4;
  /* 新增的单行文本溢出处理 */
  white-space: nowrap;          /* 禁止换行 */
  overflow: hidden;             /* 隐藏溢出内容 */
  text-overflow: ellipsis;      /* 显示省略号 */
  width: 100%;                 /* 确保容器有宽度限制 */
}


.cancel-btn {
  align-self: flex-start;
  padding: 6px 12px;
  background-color: #e6a23c;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.cancel-btn:hover {
  background-color: #d8922b;
}

.cover-container {
  position: relative;
  width: 100%;
  height: 180px;
}

.cover-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: white;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.meta-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
  margin-bottom: 12px;
}

.nick {
  color: #333;
}

.time {
  color: #999;
}

/* 分页样式 */
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .collection-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 992px) {
  .collection-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .collection-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .collection-grid {
    grid-template-columns: 1fr;
  }
}
</style>