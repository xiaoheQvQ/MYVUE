<template>
  <div class="container" v-if="Global.user">
    <el-card v-if="user" class="info-card">
      <div class="user-profile">
        <div class="avatar-section">
          <div @click="isCurrentUser && (showAvatarUploader = true)" style="cursor: pointer; position: relative;">
            <img :src="imageUrl || user.avatar" class="avatar" alt="用户头像">
            <div v-if="isCurrentUser" class="avatar-edit-hint">点击修改头像</div>
          </div>

          <el-dialog title="修改头像" :visible.sync="showAvatarUploader" width="30%">
            <el-upload
              class="avatar-uploader"
              action="#"
              :show-file-list="false"
              :before-upload="beforeAvatarUpload"
              :on-change="handleAvatarChange"
              accept="image/*"
              :auto-upload="false">
              <img v-if="tempAvatarUrl" :src="tempAvatarUrl" class="avatar">
              <i v-else class="el-icon-plus avatar-uploader-icon"></i>
            </el-upload>
            <div style="margin-top: 10px; color: #999;">支持JPG/PNG格式，大小不超过10M</div>
            <span slot="footer" class="dialog-footer">
              <el-button @click="showAvatarUploader = false">取 消</el-button>
              <el-button type="primary" @click="confirmAvatar">确 定</el-button>
            </span>
          </el-dialog>

          <div class="stats">
            <div class="stat-item">
              <span class="stat-value">{{ user.followerCount || 0 }}</span>
              <span class="stat-label">粉丝</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ user.followingCount || 0 }}</span>
              <span class="stat-label">关注</span>
            </div>
          </div>
        </div>
        <div class="info-section">
          <template v-if="isModify">
            <el-form>
              <el-form-item label="昵称">
                <el-input v-model="user.nick"></el-input>
              </el-form-item>
              <el-form-item label="性别">
                <el-select v-model="user.gender">
                  <el-option label="男" value="男"></el-option>
                  <el-option label="女" value="女"></el-option>
                  <el-option label="未知" value="未知"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="签名">
                <el-input type="textarea" v-model="user.sign"></el-input>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="submit">保存</el-button>
                <el-button @click="isModify = false">取消</el-button>
              </el-form-item>
            </el-form>
          </template>
          <template v-else>
            <h2 class="nickname">{{ user.nick }}</h2>
            <div class="gender-line">
              <div class="gender">
                性别：
                <el-tag :type="user.gender === '男' ? 'primary' : user.gender === '女' ? 'danger' : 'info'">
                  {{ user.gender || '未知' }}
                </el-tag>
              </div>
              <el-button
                v-if="!isCurrentUser"
                type="text"
                icon="el-icon-message"
                class="private-message-btn"
                @click="handlePrivateMessage">
                私信
              </el-button>
            </div>
            <div class="signature">
              <p v-if="user.sign">{{ user.sign }}</p>
              <p v-else class="empty-sign">该用户太懒，没有留下任何痕迹</p>
            </div>
          </template>
        </div>
      </div>
    </el-card>

    <!-- 作品列表部分 -->
    <el-card class="works-card">
      <div slot="header" class="works-header">
        <span>作品列表</span>
      </div>

      <!-- 用户视频列表 -->
      <div class="user-videos-section">
        <h3 class="section-title">
          <i class="el-icon-video-camera"></i> 视频
        </h3>

        <el-empty v-if="videos.length === 0" description="暂无视频"></el-empty>

        <div class="video-grid">
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
    </el-card>
  </div>
</template>

<script>
import userApi from '@/api/user/user'
import videoApi from '@/api/video/video'
import Global from '@/components/Global.vue'

export default {
  name: 'Detail',
  data () {
    return {
      Global,
      videos: [],
      user: {
        avatar: '',
        nick: '',
        gender: '',
        sign: '',
        followerCount: 0,
        followingCount: 0
      },
      isModify: false,
      showAvatarUploader: false,
      tempAvatarUrl: '',
      tempAvatarFile: null,
      imageUrl: null,
      currentPage: 1,
      pageSize: 12,
      total: 0
    }
  },
  computed: {
    isCurrentUser () {
      return Global.user && Global.user.id === (this.$route.query.id || Global.user.id)
    },
    userId () {
      return this.$route.query.id || (Global.user && Global.user.id)
    }
  },
  mounted () {
    this.getUserInfo()
    this.getIsModify()
    this.loadUserVideos()
  },
  methods: {
    loadUserVideos () {
      if (!this.userId) {
        console.error('No user ID available')
        return
      }

      videoApi.getUserVideos({
        userId: this.userId,
        current: this.currentPage,
        size: this.pageSize
      }).then(res => {
        this.videos = res.data.records || []
        this.total = Number(res.data.total) || 0
        this.currentPage = Number(res.data.current) || 1
      }).catch(error => {
        console.error('Error loading user videos:', error)
        this.$message.error('加载视频失败')
      })
    },

    handlePrivateMessage () {
      if (!Global.user) {
        this.$message.warning('请先登录')
        this.$router.push('/login')
        return
      }

      this.$router.push({
        path: '/chat',
        query: {
          toUserId: this.user.id,
          toUserName: this.user.nick
        }
      })
    },

    getUserInfo () {
      if (!this.userId) {
        this.$message.error('用户ID不存在')
        this.$router.push('/')
        return
      }

      userApi.getUserInfo(this.userId).then(res => {
        this.user = res.data
      }).catch(() => {
        this.$message.error('查看资料失败')
      })
    },

    getIsModify () {
      this.isModify = this.$route.query.isModify
    },

    goToVideoPlayer (videoId) {
      this.$router.push({
        path: '/video-player',
        query: {
          videoId: videoId
        }
      })
    },

    beforeAvatarUpload (file) {
      const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
      const isLt10M = file.size / 1024 / 1024 < 10

      if (!isJPG) {
        this.$message.error('上传头像图片只能是 JPG/PNG 格式!')
      }
      if (!isLt10M) {
        this.$message.error('上传头像图片大小不能超过 10MB!')
      }
      return isJPG && isLt10M
    },

    handleAvatarChange (file) {
      this.tempAvatarUrl = URL.createObjectURL(file.raw)
      this.tempAvatarFile = file.raw
    },

    confirmAvatar () {
      if (!this.tempAvatarFile) {
        this.$message.warning('请选择头像图片')
        return
      }
      this.user.avatarFile = this.tempAvatarFile
      this.imageUrl = this.tempAvatarUrl
      this.showAvatarUploader = false
      this.$message.success('头像已更新，请点击保存按钮保存修改')
    },

    formatDuration (seconds) {
      if (!seconds) return '00:00'
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    },

    formatDate (timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
    },

    submit () {
      userApi.updateInfo(this.user).then(() => {
        if (Global.user) {
          Global.user.sign = this.user.sign
          Global.user.nick = this.user.nick
          Global.user.avatar = this.imageUrl || this.user.avatar
        }
        this.$message.success('修改成功')
        this.isModify = false
        this.getUserInfo()
      }).catch(error => {
        this.$message.error('修改失败: ' + (error.message || '未知错误'))
      })
    },

    handlePageChange (page) {
      this.currentPage = page
      this.loadUserVideos()
    }
  },
  watch: {
    $route (to, from) {
      if (to.name === from.name && to.query !== from.query) {
        this.isModify = to.query.isModify
        this.getUserInfo()
        this.loadUserVideos()
      }
    }
  }
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.info-card {
  margin-bottom: 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%);
  border: none;
  overflow: hidden;
}

.user-profile {
  display: flex;
  gap: 30px;
  padding: 20px;
  position: relative;
}

.user-profile::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 20px;
  right: 20px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent);
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-right: 30px;
  position: relative;
}

.avatar-section::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 1px;
  background: rgba(0,0,0,0.1);
}

.works-card {
  margin-top: 20px;
}

.works-header {
  font-size: 18px;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.avatar-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 178px;
  height: 178px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar-uploader .avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-uploader:hover {
  border-color: #409EFF;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}

.avatar {
  width: 178px;
  height: 178px;
  display: block;
  border-radius: 6px;
  object-fit: cover;
}

.action-buttons {
  text-align: right;
  margin-top: 20px;
}

.el-form-item {
  margin-bottom: 22px;
}

.row {
  margin-bottom: 20px;
}

.cover {
  height: 160px;
  width: 100%;
  cursor: pointer;
  transition: transform 0.3s;
}

.cover:hover {
  transform: scale(1.03);
}

.user-profile {
  display: flex;
  gap: 30px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 15px;
}

.stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.info-section {
  flex: 1;
}

.nickname {
  margin: 0 0 15px 0;
  font-size: 26px;
  font-weight: 600;
  color: #333;
}

.signature {
  margin-top: 20px;
  color: #666;
  line-height: 1.6;
  font-size: 15px;
  padding: 10px;
  background: rgba(255,255,255,0.7);
  border-radius: 8px;
}

.stats {
  display: flex;
  gap: 30px;
  margin-top: 20px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #888;
}

.video-title {
  font-size: 14px;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 40px;
  line-height: 1.4;
}

.video-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.create-time {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.el-tag {
  margin-top: 5px;
}

.empty-sign {
  color: #999;
  font-style: italic;
}

.avatar-edit-hint {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.5);
  color: white;
  text-align: center;
  padding: 5px;
  font-size: 12px;
  border-bottom-left-radius: 50%;
  border-bottom-right-radius: 50%;
}

.el-form {
  margin-top: 20px;
}

.el-form-item {
  margin-bottom: 20px;
}

.gender-line {
  display: flex;
  align-items: center;
  gap: 15px;
  margin: 10px 0;
}

.gender {
  display: flex;
  align-items: center;
  gap: 5px;
}

.private-message-btn {
  padding: 0px 6px;
  height: 31px;
  line-height: 31px;
  color: #606266;
  border-radius: 4px;
  transition: all 0.3s;
}

.private-message-btn:hover {
  color: #409EFF;
  border-color: #c6e2ff;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.video-card {
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
  cursor: pointer;
}

.video-card:hover {
  transform: translateY(-5px);
}

.video-cover {
  position: relative;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 比例 */
}

.video-cover .el-image {
  position: absolute;
  width: 100%;
  height: 100%;
}

.video-duration {
  position: absolute;
  right: 8px;
  bottom: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.video-info {
  padding: 12px;
}

.video-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-metadata {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}

.video-metadata span {
  display: flex;
  align-items: center;
}

.video-metadata i {
  margin-right: 4px;
}
{
  padding: 0px 6px;
  height: 31px;
  line-height: 31px;
  color: #606266;
  border-radius: 4px;
  transition: all 0.3s;
}

.private-message-btn:hover {
  color: #409EFF;
  border-color: #c6e2ff;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.section-title {
  font-size: 18px;
  margin-bottom: 15px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
