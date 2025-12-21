<template>
  <div class="nav-header">
    <div class="logo">
      <router-link to="/">视频平台</router-link>
    </div>
    <div class="nav-right">
      <el-dropdown v-if="isLoggedIn" @command="handleCommand">
        <span class="el-dropdown-link">
          <el-badge :value="notificationCount" :hidden="notificationCount === 0">
            <i class="el-icon-bell"></i>
          </el-badge>
        </span>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item v-for="notification in notifications" :key="notification.videoId" :command="notification">
            {{ notification.uploaderName }} 上传了新视频：{{ notification.title }}
          </el-dropdown-item>
          <el-dropdown-item v-if="notifications.length === 0" disabled>
            暂无新通知
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
      <el-dropdown v-if="isLoggedIn" @command="handleUserCommand">
        <span class="el-dropdown-link">
          {{ username }}<i class="el-icon-arrow-down el-icon--right"></i>
        </span>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="profile">个人中心</el-dropdown-item>
          <el-dropdown-item command="upload">上传视频</el-dropdown-item>
          <el-dropdown-item command="logout">退出登录</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
      <router-link v-else to="/login" class="login-link">登录</router-link>
    </div>
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex'

export default {
  name: 'NavHeader',
  computed: {
    ...mapState(['isLoggedIn', 'username', 'notifications', 'notificationCount'])
  },
  methods: {
    ...mapMutations(['clearNotifications']),
    handleCommand (notification) {
      // 跳转到视频播放页面
      this.$router.push(`/video/${notification.videoId}`)
      // 清除该通知
      this.$store.commit('removeNotification', notification.videoId)
    },
    handleUserCommand (command) {
      switch (command) {
        case 'profile':
          this.$router.push('/user/profile')
          break
        case 'upload':
          this.$router.push('/video/upload')
          break
        case 'logout':
          this.logout()
          break
      }
    },
    logout () {
      this.$store.dispatch('logout')
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.logo a {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
  text-decoration: none;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.el-dropdown-link {
  cursor: pointer;
  display: flex;
  align-items: center;
}

.el-icon-bell {
  font-size: 20px;
  color: #606266;
}

.login-link {
  color: #409EFF;
  text-decoration: none;
}

.login-link:hover {
  color: #66b1ff;
}
</style>
