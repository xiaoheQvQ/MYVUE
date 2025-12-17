<template>
  <div class="user-profile-container">
    <!-- 用户信息卡片 -->
    <el-card class="user-info-card">
      <div class="user-header">
        <div class="user-avatar">
          <el-avatar :size="100" :src="userInfo.avatar"></el-avatar>
        </div>
        <div class="user-details">
          <h2 class="user-name">{{ userInfo.nick }}</h2>

          <p class="user-signature">{{ userInfo.sign || '这个人很懒，什么都没有留下' }}</p>
          
          <div class="user-stats">
            <div class="stat-item" @click="subscribed()" >
              <span class="stat-count">{{ userInfo.followerCount || 0 }}</span>
              <span class="stat-label">粉丝</span>
            </div>
            <div class="stat-item" @click="getSubscriptions()">
              <span class="stat-count">{{ userInfo.followingCount || 0 }}</span>
              <span class="stat-label">关注</span>
            </div>
            <div class="stat-item">
              <span class="stat-count">{{ userInfo.videoCount || 0 }}</span>
              <span class="stat-label">视频</span>
            </div>
          </div>
          
          <!-- 如果不是自己，显示关注按钮 -->
          <el-button 
            v-if="!isSelf" 
            type="primary" 
            :class="{'is-subscribed': isSubscribed}"
            @click="toggleSubscribe">
            {{ isSubscribed ? '已关注' : '+ 关注' }}
          </el-button>
        </div>
      </div>
    </el-card>
    
    <!-- 用户视频列表 -->
    <div class="user-videos-section">
      <h3 class="section-title">
        <i class="el-icon-video-camera"></i> {{ userInfo.nick }}的视频
      </h3>
      
      <el-empty v-if="videos.length === 0" description="暂无视频"></el-empty>
      
      <div v-else class="video-grid">
        <div 
          v-for="video in videos" 
          :key="video.id" 
          class="video-card"
          @click="goToVideoPlayer(video.id)">
          <div class="video-cover">
            <el-image :src="video.cover" fit="cover"></el-image>
            <div class="video-duration">{{ formatDuration(video.duration) }}</div>
          </div>
          <div class="video-info">
            <div class="video-title">{{ video.title }}</div>
            <div class="video-metadata">
              <span><i class="el-icon-view"></i> {{ video.count }}</span>
              <span><i class="el-icon-date"></i> {{ formatDate(video.createTime) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 分页 -->
      <el-pagination
        v-if="videos.length > 0"
        @current-change="handlePageChange"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        class="pagination">
      </el-pagination>
    </div>
  </div>
</template>

<script>
import userApi from '@/api/user/user'
import videoApi from '@/api/video/video'
import Global from '@/components/Global.vue'

export default {
  name: 'UserProfile',
  data() {
    return {
      userId: this.$route.query.id,
      userInfo: {},
      videos: [],
      currentPage: 1,
      pageSize: 12,
      total: 0,
      isSubscribed: false,
      isSelf: false
    }
  },
  created() {
    this.loadUserInfo();
    this.loadUserVideos();
    this.checkSubscriptionStatus();
  },
  mounted() {
    this.loadUserInfo();
  },
  methods: {
   
    subscribed() {
      this.$router.push('/user/subscribed');
    },
    getSubscriptions() {
      this.$router.push('/user/subscription')
    },

    loadUserInfo() {
      userApi.getUserInfo(this.userId).then(res => {
        this.userInfo = res.data;
        // 检查是否是当前登录用户
        this.isSelf = Global.user && Global.user.id === this.userInfo.id;
      }).catch(err => {
        console.error('获取用户信息失败', err);
        this.$message.error('获取用户信息失败');
      });
    },
    loadUserVideos() {
      videoApi.getUserVideos({
        userId: this.userId,
        current: this.currentPage,
        size: this.pageSize
      }).then(res => {
        // 获取视频列表
        this.videos = res.data.records || [];
        
        // 获取视频总数
        this.videoCount = res.data.total;
        
        // 更新用户信息中的视频数量
        if (this.userInfo) {
          this.userInfo.videoCount = this.videoCount;
        }
        
        // 其他分页信息 - 确保total和currentPage都是数字类型
        this.total = Number(res.data.total);
        this.currentPage = Number(res.data.current);
      });
    },
    checkSubscriptionStatus() {
      if (Global.user) {
        userApi.getIsSubscribe(this.userId).then(res => {
          this.isSubscribed = res.data;
        });
      }
    },
    toggleSubscribe() {
      if (!Global.user) {
        this.$message.warning('请先登录');
        return;
      }
      
      const apiCall = this.isSubscribed 
        ? userApi.cancelSubscribe(this.userId) 
        : userApi.subscribe(this.userId);
        
      apiCall.then(() => {
        this.isSubscribed = !this.isSubscribed;
        this.$message.success(this.isSubscribed ? '关注成功' : '取消关注成功');
        // 更新粉丝数
        this.loadUserInfo();
      }).catch(err => {
        console.error('操作失败', err);
        this.$message.error('操作失败');
      });
    },
    goToVideoPlayer(videoId) {
      this.$router.push({
        path: '/video-player',
        query: { videoId: videoId }
      });
    },
    handlePageChange(page) {
      this.currentPage = page;
      this.loadUserVideos();
    },
    formatDuration(seconds) {
      if (!seconds) return '00:00';
      
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      
      return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    },
    formatDate(timestamp) {
      if (!timestamp) return '';
      
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
  }
}
</script>

<style scoped>
.user-profile-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.user-info-card {
  margin-bottom: 30px;
}

.user-header {
  display: flex;
  align-items: center;
}

.user-avatar {
  margin-right: 30px;
}

.user-details {
  flex-grow: 1;
}

.user-name {
  margin: 0 0 10px 0;
  font-size: 24px;
}

.user-signature {
  color: #666;
  margin-bottom: 15px;
  max-width: 500px;
}

.user-stats {
  display: flex;
  margin-bottom: 20px;
}

.stat-item {
  margin-right: 30px;
  text-align: center;
}

.stat-count {
  display: block;
  font-size: 18px;
  font-weight: bold;
}

.stat-label {
  color: #999;
  font-size: 14px;
}

.is-subscribed {
  background-color: #f5f5f5;
  color: #606266;
  border-color: #dcdfe6;
}

.section-title {
  font-size: 18px;
  margin-bottom: 20px;
  border-left: 4px solid #409EFF;
  padding-left: 10px;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 25px;
}

.video-card {
  min-width: 220px;
  cursor: pointer;
  transition: transform 0.3s;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.1);
  background-color: #fff;
}

.video-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.video-cover {
  position: relative;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 比例 */
  overflow: hidden;
}

.video-cover .el-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-duration {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 5px;
  border-radius: 2px;
  font-size: 12px;
}

.video-info {
  padding: 8px;
}

.video-title {
  font-weight: bold;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
  font-size: 13px;
  height: 36px;
}

.video-metadata {
  font-size: 12px;
  color: #999;
  display: flex;
  justify-content: space-between;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

</style>