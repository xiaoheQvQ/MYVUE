<template>
  <div class="group-list">
    <!-- 搜索框 -->
    <div class="search-box">
      <el-input 
        v-model="searchKeyword" 
        placeholder="搜索群组"
        prefix-icon="el-icon-search"
        size="small"
        clearable
      ></el-input>
    </div>

    <!-- 群组列表 -->
    <div class="groups">
      <div 
        v-for="group in filteredGroups" 
        :key="group.id"
        class="group-item"
        @click="selectGroup(group)"
      >
        <el-avatar :size="40" :src="group.groupAvatar || defaultAvatar" shape="square"></el-avatar>
        <div class="group-info">
          <div class="group-name">{{ group.groupName }}</div>
          <div class="group-desc">{{ group.memberCount }}人</div>
        </div>
        <i class="el-icon-arrow-right"></i>
      </div>
    </div>

    <div v-if="filteredGroups.length === 0" class="empty">
      <p>{{ searchKeyword ? '未找到群组' : '暂无群组' }}</p>
    </div>
  </div>
</template>

<script>
import groupApi from '@/api/im/group'
import { EventBus } from '@/api/event-bus'

export default {
  name: 'GroupList',
  data() {
    return {
      groups: [],
      searchKeyword: '',
      defaultAvatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
    }
  },
  computed: {
    filteredGroups() {
      if (!this.searchKeyword) {
        return this.groups
      }
      const keyword = this.searchKeyword.toLowerCase()
      return this.groups.filter(g => 
        g.groupName.toLowerCase().includes(keyword)
      )
    }
  },
  created() {
    this.loadGroups()
    EventBus.$on('refresh-group-list', this.loadGroups)
    EventBus.$on('im-group-notify', this.onGroupNotify)
  },
  beforeDestroy() {
    EventBus.$off('refresh-group-list', this.loadGroups)
    EventBus.$off('im-group-notify', this.onGroupNotify)
  },
  methods: {
    async loadGroups() {
      try {
        const res = await groupApi.getGroupList()
        this.groups = res.data || []
      } catch (error) {
        console.error('加载群组列表失败:', error)
      }
    },
    selectGroup(group) {
      this.$emit('select', group)
    },
    onGroupNotify(message) {
      // 处理群组通知（如被邀请加群等）
      this.loadGroups()
    }
  }
}
</script>

<style scoped>
.group-list {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.search-box {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
}

.groups {
  flex: 1;
  overflow-y: auto;
}

.group-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.group-item:hover {
  background: #f5f5f5;
}

.group-info {
  flex: 1;
  margin-left: 12px;
}

.group-name {
  font-size: 15px;
  color: #333;
  margin-bottom: 2px;
}

.group-desc {
  font-size: 12px;
  color: #999;
}

.group-item i {
  color: #999;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999;
}
</style>
