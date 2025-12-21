<template>
  <div class="subscription-container">
    <div class="header">
      <h3 class="title">{{title}}</h3>
    </div>
    <div class="content">
      <el-empty v-if="users.length === 0" description="暂无用户"></el-empty>
      <el-row v-for="row in users" :key="row[0].id" :gutter="20">
        <el-col v-for="user in row" :key="user.id" :span="6">
          <el-card class="user-card" shadow="hover">
            <UserPopUp :avatar="user.avatar" :id="user.id" :nick="user.nick"/>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script>
import userApi from '@/api/user/user'
import UserPopUp from '@/components/user/UserPopUp.vue'
export default {
  name: 'Subscription',
  components: {UserPopUp},
  data () {
    return {
      title: '',
      users: []
    }
  },
  mounted () {
    if (this.$route.path === '/user/subscription') {
      this.getSubscriptions()
      this.title = '关注列表'
    } else {
      this.getSubscribedList()
      this.title = '粉丝列表'
    }
  },
  methods: {
    getSubscriptions () {
      userApi.getSubscriptions().then(res => {
        this.users = []
        for (let i = 0; i < res.data.length; i += 4) {
          this.users.push(res.data.slice(i, i + 4))
        }
      })
    },
    getSubscribedList () {
      userApi.getSubscribedList().then(res => {
        this.users = []
        for (let i = 0; i < res.data.length; i += 4) {
          this.users.push(res.data.slice(i, i + 4))
        }
      })
    }
  }
}
</script>

<style scoped>
.subscription-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  margin-bottom: 30px;
  text-align: center;
}

.title {
  font-size: 24px;
  color: #303133;
  font-weight: 500;
}

.user-card {
  margin-bottom: 20px;
  transition: transform 0.3s;
}

.user-card:hover {
  transform: translateY(-5px);
}

.el-row {
  margin-bottom: 20px;
}

.content {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>
