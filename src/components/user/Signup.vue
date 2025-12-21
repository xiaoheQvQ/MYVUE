<template>
  <div class="signup-container">
    <div class="signup-box">
      <h2 class="signup-title">注册账号</h2>
      <el-form ref="form" :model="user" label-width="0" class="signup-form">
        <el-form-item prop="nick" :rules="[
          { required: true, message: '请输入昵称', trigger: 'blur' },
          { min: 2, max: 10, message: '长度在 2 到 10 之间', trigger: 'blur' }
        ]">
          <el-input v-model="user.nick" prefix-icon="el-icon-user" placeholder="请输入昵称"></el-input>
        </el-form-item>

        <el-form-item prop="email" :rules="[
          { required: true, message: '请输入邮箱地址', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
        ]">
          <el-input v-model="user.email" prefix-icon="el-icon-message" placeholder="请输入邮箱"></el-input>
        </el-form-item>

        <el-form-item prop="password" :rules="[
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, max: 16, message: '长度在 6 到 16 之间', trigger: 'blur' }
        ]">
          <el-input type="password" v-model="user.password" prefix-icon="el-icon-lock" placeholder="请输入密码"></el-input>
        </el-form-item>

        <el-form-item prop="captcha" :rules="[
          {required: true, message: '请输入验证码', trigger: 'blur'},
          { min: 6, max: 6, message: '请输入正确的验证码', trigger: 'blur' }
        ]">
          <div class="captcha-container">
            <el-input
              v-model="user.captcha"
              prefix-icon="el-icon-key"
              placeholder="请输入验证码"
              class="captcha-input">
            </el-input>
            <el-button
              @click="getCaptcha"
              :disabled="disableGetCaptcha"
              class="captcha-btn"
              type="primary">
              {{ getCaptchaMessage }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item class="signup-btn-container">
          <el-button type="primary" @click="signup" class="signup-btn" :loading="loading">注册</el-button>
        </el-form-item>

        <div class="signup-options">
          <router-link to="/login" class="login-link">已有账号？立即登录</router-link>
          <router-link to="/" class="home-link">返回首页</router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script>
import userApi from '@/api/user/user'

export default {
  name: 'Signup',
  data () {
    return {
      user: {
        nick: '',
        email: '',
        password: '',
        captcha: ''
      },
      disableGetCaptcha: false,
      getCaptchaMessage: '获取验证码',
      loading: false
    }
  },
  methods: {
    signup () {
      this.$refs.form.validate(valid => {
        if (valid) {
          this.loading = true
          const signInfo = JSON.parse(JSON.stringify(this.user))
          const loginInfo = JSON.parse(JSON.stringify(this.user))
          userApi.signup(signInfo).then(res => {
            userApi.login(loginInfo).then(res => {
              userApi.loginSuccess(this, res)
            })
          }).catch(err => {
            console.error('注册失败', err)
          }).finally(() => {
            this.loading = false
          })
        } else {
          this.$message.error('请输入完整信息！')
        }
      })
    },
    getCaptcha () {
      if (!this.user.email) {
        this.$message.error('请先输入邮箱')
        return
      }

      /* 定时器，禁止按钮 */
      let time = 60
      let timer = setInterval(() => {
        time--
        if (time >= 0) {
          this.getCaptchaMessage = time + ' 秒'
          this.disableGetCaptcha = true
        } else {
          this.getCaptchaMessage = '获取验证码'
          this.disableGetCaptcha = false
          clearInterval(timer)
        }
      }, 1000)

      /* 获取验证码 */
      userApi.getCaptcha(this.user.email).then(res => {
        this.$message.success('验证码已发送到邮箱，请查收')
      }).catch(() => {
        this.getCaptchaMessage = '获取验证码'
        this.disableGetCaptcha = false
        clearInterval(timer)
      })
    }
  }
}
</script>

<style scoped>
.signup-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  background-color: #f5f7fa;
}

.signup-box {
  width: 400px;
  padding: 40px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.signup-title {
  margin-top: 0;
  margin-bottom: 30px;
  text-align: center;
  font-size: 24px;
  color: #303133;
}

.signup-form .el-input {
  margin-bottom: 10px;
}

.captcha-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.captcha-input {
  flex: 1;
}

.captcha-btn {
  width: 120px;
  white-space: nowrap;
}

.signup-btn-container {
  margin-top: 20px;
  margin-bottom: 15px;
}

.signup-btn {
  width: 100%;
  font-size: 16px;
  padding: 12px 0;
  border-radius: 4px;
}

.signup-options {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.login-link, .home-link {
  color: #409EFF;
  text-decoration: none;
}

.login-link:hover, .home-link:hover {
  color: #66b1ff;
  text-decoration: underline;
}
</style>
