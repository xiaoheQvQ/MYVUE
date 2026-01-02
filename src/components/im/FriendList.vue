<template>
  <div class="friend-list">
    <!-- 搜索框 -->
    <div class="search-box">
      <el-input 
        v-model="searchKeyword" 
        placeholder="搜索好友"
        prefix-icon="el-icon-search"
        size="small"
        clearable
      ></el-input>
    </div>

    <!-- 好友申请 -->
    <div class="friend-apply" @click="showApplyList" v-if="applyCount > 0">
      <i class="el-icon-user-solid"></i>
      <span>好友申请</span>
      <el-badge :value="applyCount" class="apply-badge"></el-badge>
      <i class="el-icon-arrow-right"></i>
    </div>

    <!-- 好友列表 -->
    <div class="friends">
      <div 
        v-for="friend in filteredFriends" 
        :key="friend.id"
        class="friend-item"
        @click="selectFriend(friend)"
      >
        <el-avatar :size="40" :src="friend.avatar"></el-avatar>
        <div class="friend-info">
          <div class="friend-name">{{ friend.nick }}</div>
          <div class="friend-remark" v-if="friend.remark">{{ friend.remark }}</div>
        </div>
        <div class="online-status" :class="{ online: friend.isOnline }"></div>
      </div>
    </div>

    <div v-if="filteredFriends.length === 0" class="empty">
      <p>{{ searchKeyword ? '未找到好友' : '暂无好友' }}</p>
    </div>

    <!-- 好友申请列表对话框 -->
    <el-dialog title="好友申请" :visible.sync="showApplyDialog" width="500px">
      <div class="apply-list">
        <div 
          v-for="apply in applyList" 
          :key="apply.id"
          class="apply-item"
        >
          <el-avatar :size="45" :src="apply.avatar"></el-avatar>
          <div class="apply-info">
            <div class="apply-name">{{ apply.nick }}</div>
            <div class="apply-msg">{{ apply.applyMsg }}</div>
          </div>
          <div class="apply-actions" v-if="apply.status === 0">
            <el-button size="small" @click="handleAccept(apply)">同意</el-button>
            <el-button size="small" @click="handleReject(apply)">拒绝</el-button>
          </div>
          <div class="apply-status" v-else>
            <span v-if="apply.status === 1" class="accepted">已同意</span>
            <span v-if="apply.status === 2" class="rejected">已拒绝</span>
          </div>
        </div>
      </div>
      <div v-if="applyList.length === 0" class="empty">
        <p>暂无好友申请</p>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import friendApi from '@/api/im/friend'
import { EventBus } from '@/api/event-bus'

export default {
  name: 'FriendList',
  data() {
    return {
      friends: [],
      searchKeyword: '',
      applyCount: 0,
      showApplyDialog: false,
      applyList: []
    }
  },
  computed: {
    filteredFriends() {
      if (!this.searchKeyword) {
        return this.friends
      }
      const keyword = this.searchKeyword.toLowerCase()
      return this.friends.filter(f => 
        f.nick.toLowerCase().includes(keyword) || 
        (f.remark && f.remark.toLowerCase().includes(keyword))
      )
    }
  },
  created() {
    this.loadFriends()
    this.loadApplyList()
    EventBus.$on('im-friend-apply', this.onFriendApply)
  },
  beforeDestroy() {
    EventBus.$off('im-friend-apply', this.onFriendApply)
  },
  methods: {
    async loadFriends() {
      try {
        const res = await friendApi.getFriendList()
        this.friends = res.data || []
      } catch (error) {
        console.error('加载好友列表失败:', error)
      }
    },
    async loadApplyList() {
      try {
        const res = await friendApi.getApplyList()
        this.applyList = res.data || []
        this.applyCount = this.applyList.filter(a => a.status === 0).length
      } catch (error) {
        console.error('加载好友申请失败:', error)
      }
    },
    selectFriend(friend) {
      this.$emit('select', friend)
    },
    showApplyList() {
      this.showApplyDialog = true
    },
    async handleAccept(apply) {
      try {
        await friendApi.acceptApply(apply.id)
        this.$message.success('已同意好友申请')
        apply.status = 1
        this.applyCount = this.applyList.filter(a => a.status === 0).length
        this.loadFriends()
        EventBus.$emit('refresh-apply-count')
      } catch (error) {
        this.$message.error('操作失败')
      }
    },
    async handleReject(apply) {
      try {
        await friendApi.rejectApply(apply.id)
        this.$message.success('已拒绝好友申请')
        apply.status = 2
        this.applyCount = this.applyList.filter(a => a.status === 0).length
        EventBus.$emit('refresh-apply-count')
      } catch (error) {
        this.$message.error('操作失败')
      }
    },
    onFriendApply(message) {
      this.loadApplyList()
      if (message.content === 'ACCEPTED') {
          this.loadFriends()
          this.$message.success('对方已同意你的好友申请')
      }
    }
  }
}
</script>

<style scoped>
.friend-list {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.search-box {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
}

.friend-apply {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #e0e0e0;
  transition: background 0.3s;
}

.friend-apply:hover {
  background: #f5f5f5;
}

.friend-apply i:first-child {
  font-size: 20px;
  color: #07c160;
  margin-right: 12px;
}

.friend-apply span {
  flex: 1;
  font-size: 15px;
}

.apply-badge {
  margin-right: 8px;
}

.friend-apply i:last-child {
  color: #999;
}

.friends {
  flex: 1;
  overflow-y: auto;
}

.friend-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.3s;
  position: relative;
}

.friend-item:hover {
  background: #f5f5f5;
}

.friend-info {
  flex: 1;
  margin-left: 12px;
}

.friend-name {
  font-size: 15px;
  color: #333;
  margin-bottom: 2px;
}

.friend-remark {
  font-size: 12px;
  color: #999;
}

.online-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
}

.online-status.online {
  background: #07c160;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999;
}

/* 申请列表 */
.apply-list {
  max-height: 400px;
  overflow-y: auto;
}

.apply-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.apply-item:last-child {
  border-bottom: none;
}

.apply-info {
  flex: 1;
  margin-left: 12px;
}

.apply-name {
  font-size: 15px;
  color: #333;
  margin-bottom: 4px;
}

.apply-msg {
  font-size: 13px;
  color: #666;
}

.apply-actions {
  display: flex;
  gap: 8px;
}

.apply-status {
  font-size: 13px;
}

.accepted {
  color: #07c160;
}

.rejected {
  color: #999;
}
</style>
