<template>
  <div class="user-popup-container">
    <el-dropdown>
      <div class="user-info">
        <el-avatar v-if="avatar" :src="avatar" size="small" class="user-avatar"/>
        <el-link class="user-nick" :underline="false">
          <span v-html="nick"></span>
        </el-link>
      </div>
      <el-dropdown-menu slot="dropdown" class="user-menu">
        <el-dropdown-item class="menu-item">
          <el-button
            type="primary"
            size="mini"
            v-if="!isSubscribe"
            @click="subscribe()"
            class="subscribe-btn"
          >关注</el-button>
          <el-button
            type="warning"
            size="mini"
            v-if="isSubscribe"
            @click="cancelSubscribe()"
            class="unsubscribe-btn"
          >取消关注</el-button>
        </el-dropdown-item>
        <el-dropdown-item class="menu-item" @click.native.prevent="getDetail()">
          <i class="el-icon-user"></i>
          <span>查看资料</span>
        </el-dropdown-item>
        <el-dropdown-item class="menu-item" @click.native.prevent="works()">
          <i class="el-icon-document"></i>
          <span>作品列表</span>
        </el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
  </div>
</template>
<script>
import userApi from '@/api/user/user'
import Global from '@/components/Global.vue'
export default {
  name: 'UserPopUp',
  props: ['avatar', 'nick', 'id'],
  data () {
    return {
      isSubscribe: false
    }
  },
  mounted () {
    this.getIsSubscribe()
  },
  methods: {
    getIsSubscribe () {
      if (Global.user) {
        userApi.getIsSubscribe(this.id).then(res => {
          this.isSubscribe = res.data
        })
      }
    },
    subscribe () {
      userApi.subscribe(this.id).then(() => {
        this.getIsSubscribe()
        this.$message.success('关注成功')
      })
    },
    cancelSubscribe () {
      userApi.cancelSubscribe(this.id).then(() => {
        this.getIsSubscribe()
        this.$message.success('取消关注')
      })
    },
    getDetail () {
      console.log('查看用户详情执行了,用户id:' + this.id)
      this.$router.push({
        name: 'userDetail',
        query: {
          id: this.id
        }
      })
    },
    works () {
      this.$router.push({
        path: '/user/works',
        query: {
          id: this.id
        }
      })
    }
  }
}
</script>

<style scoped>
.user-popup-container {
  display: inline-block;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.user-avatar {
  margin-right: 8px;
}

.user-nick {
  font-size: 14px;
  color: #606266;
}

.user-nick:hover {
  color: #409EFF;
}

.user-menu {
  min-width: 120px;
}

.menu-item {
  padding: 8px 16px;
  display: flex;
  align-items: center;
}

.menu-item i {
  margin-right: 8px;
}

.subscribe-btn {
  width: 100%;
}

.unsubscribe-btn {
  width: 100%;
}
</style>
