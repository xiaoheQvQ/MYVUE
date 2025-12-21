<template>
  <div class="login-container">
    <div class="login-box">
      <h2 class="login-title">登录</h2>
      <el-form ref="form" :model="user" label-width="0px" class="login-form">
        <el-form-item>
          <el-input v-model="user.email" prefix-icon="el-icon-message" placeholder="请输入邮箱"></el-input>
        </el-form-item>
        <el-form-item>
          <el-input type="password" v-model="user.password" prefix-icon="el-icon-lock" placeholder="请输入密码" @keyup.enter.native="login"></el-input>
        </el-form-item>

        <el-form-item>
          <div class="login-type-selector">
            <el-radio-group v-model="loginType" size="medium">
              <el-radio :label="'user'">用户端</el-radio>
              <el-radio :label="'admin'">管理端</el-radio>
            </el-radio-group>
          </div>
        </el-form-item>

        <el-form-item class="login-btn-container">
          <el-button type="primary" @click="login" class="login-btn" :loading="loading">登录</el-button>
        </el-form-item>
        <div class="login-options">
          <router-link to="/signup" class="register-link" v-if="loginType === 'user'">没有账号？立即注册</router-link>
          <span v-else class="admin-note">管理员登录</span>
          <router-link to="/" class="home-link">返回首页</router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script>
import userApi from '@/api/user/user'

export default {
  name: 'Login',
  data () {
    return {
      user: {
        email: '',
        password: ''
      },
      loginType: 'user', // 默认为用户端登录
      loading: false
    }
  },
  methods: {
    login () {
      if (!this.user.email || !this.user.password) {
        this.$message.error('请输入邮箱和密码')
        return
      }

      this.loading = true

      // 添加type字段区分登录类型
      const loginData = {
        ...this.user,
        type: this.loginType === 'user' ? 1 : 0 // 用户端为1，管理端为0
      }

      // 根据登录类型调用不同的登录接口或处理逻辑
      if (this.loginType === 'user') {
        // 用户端登录
        userApi.login(loginData).then(res => {
          // 确保清除管理员登录标记
          localStorage.removeItem('loginType')
          userApi.loginSuccess(this, res)
        }).catch(err => {
          console.error('登录失败', err)
        }).finally(() => {
          this.loading = false
        })
      } else {
        // 管理端登录
        userApi.login(loginData).then(res => {
          // 保存登录类型到localStorage
          localStorage.setItem('loginType', 'admin')

          // 不使用通用的登录成功处理函数，而是自定义管理员登录成功逻辑
          localStorage.setItem('accessToken', res.data.accessToken)
          localStorage.setItem('refreshToken', res.data.refreshToken)
          this.$message.success(res.msg)

          // 登录成功后直接跳转到管理页面
          this.$router.push('/admin/users')
        }).catch(err => {
          console.error('管理员登录失败', err)
          this.$message.error((err.response && err.response.data && err.response.data.msg) || '管理员登录失败，请检查账号权限')
        }).finally(() => {
          this.loading = false
        })
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  background-color: #f5f7fa;
}

.login-box {
  width: 400px;
  padding: 40px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-title {
  margin-top: 0;
  margin-bottom: 30px;
  text-align: center;
  font-size: 24px;
  color: #303133;
}

.login-form .el-input {
  margin-bottom: 20px;
}

.login-type-selector {
  display: flex;
  justify-content: center;
  margin-bottom: 15px;
}

.login-btn-container {
  margin-top: 10px;
  margin-bottom: 15px;
}

.login-btn {
  width: 100%;
  font-size: 16px;
  padding: 12px 0;
  border-radius: 4px;
}

.login-options {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.register-link, .home-link, .admin-note {
  color: #409EFF;
  text-decoration: none;
}

.admin-note {
  color: #909399;
}

.register-link:hover, .home-link:hover {
  color: #66b1ff;
  text-decoration: underline;
}
</style>
