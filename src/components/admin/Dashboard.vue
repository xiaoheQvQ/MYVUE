<template>
  <div class="admin-dashboard">
    <el-container>
      <el-aside width="200px">
        <div class="admin-sidebar">
          <h3 class="admin-title">管理员控制台</h3>
          <el-menu
            default-active="1"
            class="admin-menu"
            background-color="#304156"
            text-color="#bfcbd9"
            active-text-color="#409EFF"
            router>
            <el-menu-item index="1" route="/admin/dashboard">
              <i class="el-icon-s-home"></i>
              <span slot="title">仪表板</span>
            </el-menu-item>
            <el-menu-item index="2" route="/admin/users">
              <i class="el-icon-user"></i>
              <span slot="title">用户管理</span>
            </el-menu-item>
            <el-menu-item index="3" route="/admin/videos">
              <i class="el-icon-video-camera"></i>
              <span slot="title">视频管理</span>
            </el-menu-item>
            <el-menu-item index="4" route="/admin/danmaku">
              <i class="el-icon-chat-line-square"></i>
              <span slot="title">评论管理</span>
            </el-menu-item>
            <el-menu-item index="5" @click="logout">
              <i class="el-icon-switch-button"></i>
              <span slot="title">退出登录</span>
            </el-menu-item>
          </el-menu>
        </div>
      </el-aside>
      <el-container class="main-container">
        <el-header height="60px">
          <div class="admin-header">
            <h2 class="page-title">管理员仪表板</h2>
            <div class="user-info">
              <span>管理员</span>
              <el-avatar size="small" icon="el-icon-user"></el-avatar>
            </div>
          </div>
        </el-header>
        <el-main class="admin-main">
          <!-- 数据概览卡片 -->
          <div class="stat-overview">
            <el-row :gutter="20">
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-content">
                    <div class="stat-icon user-icon">
                      <i class="el-icon-user"></i>
                    </div>
                    <div class="stat-info">
                      <div class="stat-value">128</div>
                      <div class="stat-label">用户总数</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-content">
                    <div class="stat-icon video-icon">
                      <i class="el-icon-video-camera"></i>
                    </div>
                    <div class="stat-info">
                      <div class="stat-value">256</div>
                      <div class="stat-label">视频总数</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-content">
                    <div class="stat-icon comment-icon">
                      <i class="el-icon-chat-line-square"></i>
                    </div>
                    <div class="stat-info">
                      <div class="stat-value">1024</div>
                      <div class="stat-label">评论总数</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-content">
                    <div class="stat-icon play-icon">
                      <i class="el-icon-view"></i>
                    </div>
                    <div class="stat-info">
                      <div class="stat-value">5120</div>
                      <div class="stat-label">观看总数</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>

          <el-row :gutter="20" class="dashboard-content">
            <!-- 功能卡片区域 -->
            <el-col :span="8">
              <el-card class="dashboard-card">
                <div slot="header" class="card-header">
                  <span><i class="el-icon-user"></i> 用户管理</span>
                  <el-button type="text" @click="$router.push('/admin/users')" class="card-button">查看更多</el-button>
                </div>
                <div class="card-content">
                  <p class="card-desc">管理系统用户，包括用户的审核、禁用和信息修改</p>
                  <div class="card-action">
                    <el-button type="primary" size="medium" @click="$router.push('/admin/users')">进入管理</el-button>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="dashboard-card">
                <div slot="header" class="card-header">
                  <span><i class="el-icon-video-camera"></i> 视频管理</span>
                  <el-button type="text" @click="$router.push('/admin/videos')" class="card-button">查看更多</el-button>
                </div>
                <div class="card-content">
                  <p class="card-desc">管理所有视频，包括视频的审核、删除和属性修改</p>
                  <div class="card-action">
                    <el-button type="primary" size="medium" @click="$router.push('/admin/videos')">进入管理</el-button>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="dashboard-card">
                <div slot="header" class="card-header">
                  <span><i class="el-icon-chat-line-square"></i> 评论管理</span>
                  <el-button type="text" @click="$router.push('/admin/danmaku')" class="card-button">查看更多</el-button>
                </div>
                <div class="card-content">
                  <p class="card-desc">管理视频评论，包括评论的审核、删除和内容筛选</p>
                  <div class="card-action">
                    <el-button type="primary" size="medium" @click="$router.push('/admin/danmaku')">进入管理</el-button>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <!-- 最近活动 -->
          <el-card class="recent-activity">
            <div slot="header" class="card-header">
              <span><i class="el-icon-time"></i> 最近活动</span>
            </div>
            <div class="timeline-container">
              <el-timeline>
                <el-timeline-item
                  v-for="(activity, index) in recentActivities"
                  :key="index"
                  :type="activity.type"
                  :timestamp="activity.time">
                  {{ activity.content }}
                </el-timeline-item>
              </el-timeline>
            </div>
          </el-card>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import userApi from '@/api/user/user'

export default {
  name: 'AdminDashboard',
  data () {
    return {
      adminInfo: {},
      recentActivities: [
        {
          content: '用户 "张三" 上传了新视频《Spring Boot 入门教程》',
          time: '2024-04-17 15:30:40',
          type: 'success'
        },
        {
          content: '管理员删除了不当评论 5 条',
          time: '2024-04-17 14:20:35',
          type: 'danger'
        },
        {
          content: '新用户 "李四" 完成注册',
          time: '2024-04-17 13:15:20',
          type: 'primary'
        },
        {
          content: '视频《Vue.js 实战》播放量突破 1000',
          time: '2024-04-17 12:10:15',
          type: 'info'
        },
        {
          content: '用户 "王五" 发布了 10 条评论',
          time: '2024-04-17 10:05:30',
          type: 'warning'
        }
      ]
    }
  },
  created () {
    // 检查是否是管理员登录
    if (localStorage.getItem('loginType') !== 'admin') {
      this.$router.push('/login')
      this.$message.error('请先以管理员身份登录')
    }

    // 获取管理员信息
    this.getAdminInfo()
  },
  methods: {
    getAdminInfo () {
      // 获取管理员信息
      userApi.getInfo().then(res => {
        this.adminInfo = res.data
      }).catch(err => {
        console.error('获取管理员信息失败', err)
      })
    },
    logout () {
      // 退出登录
      userApi.logout().then(() => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('loginType')
        this.$router.push('/login')
        this.$message.success('已退出登录')
      }).catch(err => {
        console.error('退出登录失败', err)
      })
    }
  }
}
</script>

<style scoped>
.admin-dashboard {
  height: 100vh;
  display: flex;
}

.admin-sidebar {
  height: 100%;
  background-color: #304156;
  color: white;
}

.admin-title {
  padding: 15px;
  text-align: center;
  font-size: 18px;
  border-bottom: 1px solid #1f2d3d;
  margin: 0;
  line-height: 30px;
}

.admin-menu {
  border-right: none;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: white;
  padding: 0 20px;
  height: 100%;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.admin-main {
  padding: 20px;
  background-color: #f0f2f5;
  overflow-y: auto;
  height: calc(100vh - 60px);
}

/* 数据概览卡片 */
.stat-overview {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
  height: 100px;
  margin-bottom: 10px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  width: 60px;
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  margin-right: 15px;
  font-size: 24px;
  color: white;
}

.user-icon {
  background-color: #409EFF;
}

.video-icon {
  background-color: #67C23A;
}

.comment-icon {
  background-color: #E6A23C;
}

.play-icon {
  background-color: #F56C6C;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

/* 功能卡片 */
.dashboard-content {
  margin-bottom: 20px;
}

.dashboard-card {
  height: 100%;
  border-radius: 8px;
  transition: all 0.3s;
}

.dashboard-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}

.card-header i {
  margin-right: 5px;
}

.card-content {
  padding: 15px 0;
}

.card-desc {
  font-size: 14px;
  color: #606266;
  margin-bottom: 15px;
  line-height: 1.5;
  height: 40px;
}

.card-action {
  text-align: center;
}

.card-button {
  padding: 0;
  color: #409EFF;
}

/* 最近活动 */
.recent-activity {
  margin-top: 20px;
  border-radius: 8px;
}

.timeline-container {
  padding: 10px 0;
  max-height: 300px;
  overflow-y: auto;
}

/* 固定高度内容区，避免页面拉伸 */
.el-container, .el-aside {
  height: 100%;
}

.el-header {
  padding: 0;
}
</style>
