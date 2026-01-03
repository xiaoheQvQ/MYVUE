<template>
  <el-drawer title="群组信息" :visible.sync="visible" direction="rtl" size="350px" @close="handleClose">
    <div class="group-info-container" v-loading="loading">
      <!-- 群组头像和名称 -->
      <div class="section group-header">
        <div class="avatar-wrapper" :class="{ 'can-upload': isOwnerOrAdmin }"
          @click="isOwnerOrAdmin && handleUploadAvatar()">
          <el-avatar :size="80" :src="groupInfo.avatar || groupInfo.groupAvatar">{{ groupInfo.name ||
            groupInfo.groupName }}</el-avatar>
          <div class="avatar-upload" v-if="isOwnerOrAdmin">
            <i class="el-icon-camera"></i>
          </div>
        </div>
        <h3 class="group-name">{{ groupInfo.name || groupInfo.groupName }}</h3>
      </div>

      <el-divider></el-divider>

      <!-- 群组基本信息 -->
      <div class="section member-section">
        <div class="section-header">
          <span>群成员 ({{ members.length }})</span>
        </div>
        <div class="member-grid">
          <div v-for="member in members" :key="member.userId" class="member-item">
            <div class="member-avatar-wrapper">
              <el-avatar :size="40" :src="member.avatar">{{ member.nick }}</el-avatar>
              <!-- 群主标识 -->
              <el-tag v-if="member.memberRole === 1" size="mini" type="danger" class="owner-badge">群主</el-tag>
              <!-- 管理员标识 -->
              <el-tag v-else-if="member.memberRole === 2" size="mini" type="warning" class="admin-badge">管理</el-tag>
            </div>
            <span class="member-name">{{ member.nick || member.nickName }}</span>
          </div>
          <!-- 添加按钮 -->
          <div class="member-item add-btn" @click="showInviteDialog = true">
            <div class="add-icon">
              <i class="el-icon-plus"></i>
            </div>
            <span class="member-name">邀请</span>
          </div>
        </div>
      </div>

      <el-divider></el-divider>

      <!-- 群组设置/信息 -->
      <div class="section info-section">
        <div class="info-item">
          <span class="label">群聊名称</span>
          <span class="value">{{ groupInfo.name }}</span>
        </div>
        <div class="info-item">
          <div class="label-with-action">
            <span class="label">群公告</span>
            <el-button v-if="isOwnerOrAdmin && !editingAnnouncement" type="text" size="mini"
              @click="startEditAnnouncement">编辑</el-button>
            <template v-if="editingAnnouncement">
              <el-button type="text" size="mini" @click="saveAnnouncement" :loading="savingAnnouncement">保存</el-button>
              <el-button type="text" size="mini" @click="cancelEditAnnouncement">取消</el-button>
            </template>
          </div>
          <el-input v-if="editingAnnouncement" v-model="announcementText" type="textarea" :rows="3"
            placeholder="输入群公告..."></el-input>
          <p v-else class="announcement">{{ groupInfo.notification || '暂无公告' }}</p>
        </div>
      </div>

      <el-divider></el-divider>

      <!-- 操作按钮 -->
      <div class="actions">
        <el-button type="danger" plain block @click="handleExitGroup">{{ isOwner ? '解散群聊' : '退出群聊' }}</el-button>
      </div>

    </div>

    <!-- 上传群头像 (放在容器外避免被loading遮罩影响) -->
    <input ref="avatarInput" type="file" accept="image/*" style="display: none" @change="handleAvatarChange" />

    <!-- 邀请好友弹窗 -->
    <el-dialog title="邀请好友入群" :visible.sync="showInviteDialog" width="400px" append-to-body>
      <div class="friend-selector">
        <el-checkbox-group v-model="selectedFriends">
          <div v-for="friend in availableFriends" :key="friend.friendId" class="friend-option">
            <el-checkbox :label="friend.friendId">
              <div class="friend-item-content">
                <el-avatar :size="30" :src="friend.avatar"></el-avatar>
                <span class="friend-nick">{{ friend.nick }}</span>
              </div>
            </el-checkbox>
          </div>
        </el-checkbox-group>
        <div v-if="availableFriends.length === 0" class="empty-friends">
          暂无可选好友
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showInviteDialog = false">取 消</el-button>
        <el-button type="primary" @click="confirmInvite" :loading="inviting">确 定</el-button>
      </span>
    </el-dialog>
  </el-drawer>
</template>

<script>
import groupApi from '@/api/im/group'
import friendApi from '@/api/im/friend'
import { EventBus } from '@/api/event-bus'

export default {
  name: 'GroupInfoDrawer',
  props: {
    show: Boolean,
    groupInfo: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      visible: this.show,
      loading: false,
      members: [],
      showInviteDialog: false,
      friends: [],
      selectedFriends: [],
      inviting: false,
      editingAnnouncement: false,
      announcementText: '',
      savingAnnouncement: false
    }
  },
  computed: {
    availableFriends() {
      // 过滤掉已经是群成员的好友
      const memberIds = this.members.map(m => String(m.userId))
      return this.friends.filter(f => !memberIds.includes(String(f.friendId)))
    },
    // 检查当前用户是否是群主或管理员
    isOwnerOrAdmin() {
      if (!this.Global || !this.Global.user) return false
      const currentUserId = this.Global.user.id
      const currentMember = this.members.find(m => String(m.userId) === String(currentUserId))
      return currentMember && (currentMember.memberRole === 1 || currentMember.memberRole === 2)
    },
    // 检查当前用户是否是群主
    isOwner() {
      if (!this.Global || !this.Global.user) return false
      const currentUserId = this.Global.user.id
      const currentMember = this.members.find(m => String(m.userId) === String(currentUserId))
      return currentMember && currentMember.memberRole === 1
    }
  },
  watch: {
    show(val) {
      console.log('GroupInfoDrawer: show changed to', val)
      this.visible = val
      console.log('GroupInfoDrawer: visible set to', this.visible)
      if (val) {
        this.loadData()
      }
    },
    visible(val) {
      console.log('GroupInfoDrawer: visible changed to', val)
      this.$emit('update:show', val)
    }
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        const [membersRes, friendsRes] = await Promise.all([
          groupApi.getGroupMembers(this.groupInfo.targetId),
          friendApi.getFriendList()
        ])
        this.members = membersRes.data || []
        this.friends = friendsRes.data || []
      } catch (error) {
        console.error('加载群组信息失败:', error)
      } finally {
        this.loading = false
      }
    },
    handleClose() {
      this.visible = false
    },
    async confirmInvite() {
      if (this.selectedFriends.length === 0) {
        this.$message.warning('请选择好友')
        return
      }

      this.inviting = true
      try {
        // 后端接口暂时一次只能加一个，循环调用或后端改接口
        // 这里假设循环调用
        await Promise.all(this.selectedFriends.map(friendId =>
          groupApi.addMember(this.groupInfo.targetId, friendId)
        ))
        this.$message.success('已发送邀请')
        this.showInviteDialog = false
        this.selectedFriends = []
        this.loadData() // 刷新成员列表
      } catch (error) {
        this.$message.error('邀请失败')
      } finally {
        this.inviting = false
      }
    },
    handleExitGroup() {
      const action = this.isOwner ? '解散' : '退出'
      const confirmText = this.isOwner
        ? '解散群组后，所有成员将被移除，且无法恢复。确定要解散该群聊吗？'
        : '确定要退出该群聊吗？'

      this.$confirm(confirmText, '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }).then(async () => {
        try {
          if (this.isOwner) {
            // 群主解散群组
            await groupApi.dissolveGroup(this.groupInfo.targetId)
            this.$message.success('群组已解散')
          } else {
            // 普通成员退出群组
            await groupApi.exitGroup(this.groupInfo.targetId)
            this.$message.success('已退出群组')
          }

          // 关闭抽屉
          this.visible = false

          // 通知父组件刷新会话列表
          EventBus.$emit('refresh-conversation-list')
          EventBus.$emit('group-exited', this.groupInfo.targetId)
        } catch (error) {
          console.error(`${action}群组失败:`, error)
          const errorMsg = (error.response && error.response.data && error.response.data.msg) || error.message || `${action}失败`
          this.$message.error(errorMsg)
        }
      }).catch(() => {
        // 用户取消
      })
    },
    // 开始编辑公告
    startEditAnnouncement() {
      this.announcementText = this.groupInfo.notification || ''
      this.editingAnnouncement = true
    },
    // 取消编辑公告
    cancelEditAnnouncement() {
      this.editingAnnouncement = false
      this.announcementText = ''
    },
    // 保存公告
    async saveAnnouncement() {
      this.savingAnnouncement = true
      try {
        await groupApi.updateGroupInfo(
          this.groupInfo.targetId,
          null, // groupName
          null, // groupAvatar
          null, // introduction
          this.announcementText // notification
        )
        this.$message.success('群公告已更新')
        this.groupInfo.notification = this.announcementText
        this.editingAnnouncement = false

        // 通知会话列表刷新
        EventBus.$emit('refresh-conversation-list')
      } catch (error) {
        console.error('更新群公告失败:', error)
        this.$message.error('更新失败')
      } finally {
        this.savingAnnouncement = false
      }
    },
    // 触发文件选择
    handleUploadAvatar() {
      console.log('handleUploadAvatar called')
      console.log('groupInfo:', this.groupInfo)
      console.log('isOwnerOrAdmin:', this.isOwnerOrAdmin)
      console.log('avatarInput ref:', this.$refs.avatarInput)

      if (!this.$refs.avatarInput) {
        console.error('avatarInput ref not found')
        this.$message.error('上传组件未就绪，请稍后再试')
        return
      }

      this.$refs.avatarInput.click()
    },
    // 处理头像文件选择
    async handleAvatarChange(event) {
      const file = event.target.files[0]
      console.log('handleAvatarChange called, file:', file)
      if (!file) return

      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        this.$message.error('请选择图片文件')
        return
      }

      // 验证文件大小 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.$message.error('图片大小不能超过5MB')
        return
      }

      try {
        const formData = new FormData()
        formData.append('file', file)

        // 获取群组ID - 尝试多个可能的字段名
        const groupId = this.groupInfo.targetId || this.groupInfo.groupId || this.groupInfo.id
        console.log('Uploading avatar for groupId:', groupId)

        if (!groupId) {
          this.$message.error('无法获取群组ID')
          return
        }

        const loading = this.$loading({
          lock: true,
          text: '上传中...',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        })

        const res = await groupApi.uploadAvatar(groupId, formData)
        loading.close()

        if (res.code === 200000) {
          this.$message.success('群头像上传成功')
          // 更新本地显示
          this.groupInfo.avatar = res.data
          // 刷新群信息
          this.$emit('refresh')
          // 通知会话列表刷新
          EventBus.$emit('refresh-conversation-list')
        } else {
          this.$message.error(res.msg || res.message || '上传失败')
        }
      } catch (error) {
        console.error('上传群头像失败:', error)
        this.$message.error('上传失败')
      } finally {
        // 清空input，允许重复选择同一文件
        event.target.value = ''
      }
    }
  }
}
</script>

<style scoped>
.group-info-container {
  padding: 0 20px 20px;
  height: 100%;
  overflow-y: auto;
}

.group-header {
  text-align: center;
  padding: 20px 0;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 15px;
}

.avatar-upload {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 28px;
  height: 28px;
  background: #409eff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  border: 2px solid white;
  transition: all 0.3s;
}

.avatar-upload:hover {
  background: #66b1ff;
  transform: scale(1.1);
}

.avatar-wrapper.can-upload {
  cursor: pointer;
}

.avatar-wrapper.can-upload:hover .avatar-upload {
  background: #66b1ff;
  transform: scale(1.1);
}

.group-name {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}

.section {
  margin-bottom: 20px;
}

.section-header {
  margin-bottom: 15px;
  font-weight: bold;
  color: #333;
}

.member-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px 10px;
}

.member-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.member-avatar-wrapper {
  position: relative;
  display: inline-block;
}

.owner-badge,
.admin-badge {
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  padding: 0 4px;
  height: 16px;
  line-height: 16px;
  border-radius: 2px;
}

.member-name {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
  width: 100%;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.add-icon {
  width: 40px;
  height: 40px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 20px;
}

.add-icon:hover {
  border-color: #409eff;
  color: #409eff;
}

.info-item {
  margin-bottom: 15px;
}

.info-item .label {
  display: block;
  font-size: 13px;
  color: #909399;
  margin-bottom: 5px;
}

.info-item .value {
  font-size: 14px;
  color: #303133;
}

.announcement {
  font-size: 13px;
  color: #606266;
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  line-height: 1.5;
  margin: 0;
}

.label-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.actions {
  margin-top: 30px;
}

.friend-selector {
  max-height: 400px;
  overflow-y: auto;
}

.friend-option {
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.friend-item-content {
  display: inline-flex;
  align-items: center;
  margin-left: 10px;
}

.friend-nick {
  margin-left: 10px;
}

.empty-friends {
  text-align: center;
  padding: 20px;
  color: #999;
}
</style>
