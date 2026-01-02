<template>
  <el-drawer
    title="群组信息"
    :visible.sync="visible"
    direction="rtl"
    size="350px"
    @close="handleClose"
  >
    <div class="group-info-container" v-loading="loading">
      <!-- 群组基本信息 -->
      <div class="section member-section">
        <div class="section-header">
          <span>群成员 ({{ members.length }})</span>
        </div>
        <div class="member-grid">
          <div 
            v-for="member in members" 
            :key="member.userId" 
            class="member-item"
          >
            <el-avatar :size="40" :src="member.avatar"></el-avatar>
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
          <span class="label">群公告</span>
          <p class="announcement">{{ groupInfo.notification || '暂无公告' }}</p>
        </div>
      </div>

      <el-divider></el-divider>

      <!-- 操作按钮 -->
      <div class="actions">
        <el-button type="danger" plain block @click="handleExitGroup">退出群聊</el-button>
      </div>
    </div>

    <!-- 邀请好友弹窗 -->
    <el-dialog
      title="邀请好友入群"
      :visible.sync="showInviteDialog"
      width="400px"
      append-to-body
    >
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
      inviting: false
    }
  },
  computed: {
    availableFriends() {
      // 过滤掉已经是群成员的好友
      const memberIds = this.members.map(m => String(m.userId))
      return this.friends.filter(f => !memberIds.includes(String(f.friendId)))
    }
  },
  watch: {
    show(val) {
      this.visible = val
      if (val) {
        this.loadData()
      }
    },
    visible(val) {
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
      this.$confirm('确定要退出该群聊吗？', '提示', {
        type: 'warning'
      }).then(async () => {
        try {
          // TODO: 后端增加退出群组接口
          this.$message.info('功能开发中...')
        } catch (error) {
          this.$message.error('退出失败')
        }
      })
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

.member-name {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
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
