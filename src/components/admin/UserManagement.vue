<template>
  <div class="user-management">
    <el-container>
      <el-aside width="200px">
        <div class="admin-sidebar">
          <h3 class="admin-title">管理员控制台</h3>
          <el-menu
            default-active="1"
            class="admin-menu"
            background-color="#304156"
            text-color="#bfcbd9"
            active-text-color="#409EFF"
            router>
            <el-menu-item index="1" route="/admin/users">
              <i class="el-icon-user"></i>
              <span slot="title">用户管理</span>
            </el-menu-item>
            <el-menu-item index="2" route="/admin/videos">
              <i class="el-icon-video-camera"></i>
              <span slot="title">视频管理</span>
            </el-menu-item>
            <el-menu-item index="3" route="/admin/danmaku">
              <i class="el-icon-chat-line-square"></i>
              <span slot="title">弹幕管理</span>
            </el-menu-item>
          </el-menu>
        </div>
      </el-aside>
      <el-container class="main-container">
        <el-header height="60px">
          <div class="admin-header">
            <h2 class="page-title">用户管理</h2>
            <div class="user-info">
              <span>管理员</span>
              <el-dropdown trigger="click" @command="handleUserCommand">
                <el-avatar size="small" icon="el-icon-user" class="avatar-dropdown"></el-avatar>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="logout">
                    <i class="el-icon-switch-button"></i> 退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
          </div>
        </el-header>
        <el-main class="admin-main">
          <div class="filter-container">
            <el-input
              v-model="listQuery.keyword"
              placeholder="请输入用户名/邮箱/ID"
              style="width: 200px;"
              class="filter-item"
              @keyup.enter.native="handleFilter"
              prefix-icon="el-icon-search"
              clearable
            />
            <el-button class="filter-item" type="primary" @click="handleFilter">
              搜索
            </el-button>
          </div>

          <!-- 用户列表 -->
          <el-table
            v-loading="listLoading"
            :data="list"
            element-loading-text="加载中..."
            border
            fit
            highlight-current-row
            style="width: 100%"
            :cell-style="{padding: '12px 0'}"
            :header-cell-style="{background: '#f5f7fa', color: '#606266', padding: '12px 0'}">
            <el-table-column align="center" label="用户ID" width="80">
              <template slot-scope="scope">
                <el-link type="primary" @click="handleViewStats(scope.row.id)">
                  {{ scope.row.id }}
                </el-link>
              </template>
            </el-table-column>
            <el-table-column align="center" label="用户名" min-width="120">
              <template slot-scope="scope">
                <span>{{ scope.row.nick || '未设置' }}</span>
              </template>
            </el-table-column>
            <el-table-column align="center" label="邮箱" min-width="180">
              <template slot-scope="scope">
                <span>{{ scope.row.email }}</span>
              </template>
            </el-table-column>
            <el-table-column align="center" label="性别" width="100">
              <template slot-scope="scope">
                <el-tag size="medium" :type="getGenderType(scope.row.gender)">
                  {{ formatGender(scope.row.gender) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column align="center" label="生日" min-width="120">
              <template slot-scope="scope">
                <span>{{ scope.row.birth || '未设置' }}</span>
              </template>
            </el-table-column>
            <el-table-column align="center" label="注册时间" min-width="160">
              <template slot-scope="scope">
                <span>{{ scope.row.createTime | formatDate }}</span>
              </template>
            </el-table-column>
            <el-table-column align="center" label="操作" width="120">
              <template slot-scope="scope">
                <el-button
                  size="small"
                  type="danger"
                  @click="handleDelete(scope.row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              background
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
              :current-page="listQuery.current"
              :page-sizes="[10, 20, 30, 50]"
              :page-size="listQuery.size"
              layout="total, sizes, prev, pager, next, jumper"
              :total="Number(total)">
            </el-pagination>
          </div>

          <!-- 编辑用户对话框 -->
          <el-dialog title="编辑用户" :visible.sync="dialogFormVisible" width="30%">
            <el-form :model="currentUser" label-width="80px" :rules="rules" ref="userForm">
              <el-form-item label="用户ID" prop="id">
                <el-input v-model="currentUser.id" disabled></el-input>
              </el-form-item>
              <el-form-item label="用户名" prop="nick">
                <el-input v-model="currentUser.nick"></el-input>
              </el-form-item>
              <el-form-item label="邮箱" prop="email">
                <el-input v-model="currentUser.email" disabled></el-input>
              </el-form-item>
              <el-form-item label="状态">
                <el-select v-model="currentUser.status" placeholder="请选择">
                  <el-option label="正常" :value="1"></el-option>
                  <el-option label="禁用" :value="0"></el-option>
                </el-select>
              </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
              <el-button @click="dialogFormVisible = false">取消</el-button>
              <el-button type="primary" @click="updateUser">确定</el-button>
            </div>
          </el-dialog>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import userApi from '@/api/user/user'
import adminApi from '@/api/user/admin'
import { formatDate } from '@/utils/date'

export default {
  name: 'UserManagement',
  filters: {
    formatDate(time) {
      return formatDate(new Date(time), 'yyyy-MM-dd hh:mm:ss')
    }
  },
  data() {
    return {
      list: [], // 用户列表
      total: 0,
      listLoading: true,
      listQuery: {
        current: 1,
        size: 10,
        keyword: '',
        type: 'user'
      },
      dialogFormVisible: false,
      currentUser: {},
      rules: {
        nick: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    // 检查是否是管理员登录
    if (localStorage.getItem('loginType') !== 'admin') {
      this.$router.push('/login')
      this.$message.error('请先以管理员身份登录')
      return
    }
    
    this.fetchData()
  },
  methods: {
    formatGender(gender) {
      const genderMap = {
        0: '女',
        1: '男',
        2: '未知'
      }
      return genderMap[gender] || '未知'
    },
    getGenderType(gender) {
      const typeMap = {
        0: 'danger',
        1: 'primary',
        2: 'info'
      }
      return typeMap[gender] || 'info'
    },
    fetchData() {
      this.listLoading = true
      
      // 调用后端API获取用户列表
      adminApi.getUserList(this.listQuery).then(res => {
        if (res.code === 200000) {
          this.list = res.data.records || []
          this.total = res.data.total || 0
        } else {
          this.$message.error(res.msg || '获取用户列表失败')
        }
        this.listLoading = false
      }).catch(err => {
        console.error('获取用户列表失败', err)
        this.listLoading = false
      })
    },
    handleFilter() {
      this.listQuery.current = 1
      this.fetchData()
    },
    handleSizeChange(val) {
      this.listQuery.size = val
      this.fetchData()
    },
    handleCurrentChange(val) {
      this.listQuery.current = val
      this.fetchData()
    },
    // 新增：查看用户视频统计数据
    handleViewStats(userId) {
      console.log('查看用户视频统计数据', userId);
      
      this.$router.push({
        path: '/admin/analyze',
        query: { userId }
      })
    },
    handleDelete(row) {
      this.$confirm('确认删除该用户?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 调用后端API删除用户
        adminApi.deleteUser(row.id).then(res => {
          if (res.code === 200000) {
            this.$message.success('删除成功')
            this.fetchData()
          } else {
            this.$message.error(res.msg || '删除失败')
          }
        }).catch(err => {
          console.error('删除用户失败', err)
          this.$message.error('删除失败')
        })
      }).catch(() => {
        // 取消删除
      })
    },
    updateUser() {
      this.$refs.userForm.validate(valid => {
        if (valid) {
          this.$message.success('更新成功')
          this.dialogFormVisible = false
          const index = this.list.findIndex(item => item.id === this.currentUser.id)
          if (index !== -1) {
            this.list.splice(index, 1, this.currentUser)
          }
        }
      })
    },
    handleUserCommand(command) {
      if (command === 'logout') {
        this.logout()
      }
    },
    logout() {
      // 退出登录
      userApi.logout().then(() => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('loginType')
        this.$router.push('/login')
        this.$message.success('已退出登录')
      }).catch(err => {
        console.error('退出登录失败', err)
      })
    }
  }
}
</script>

<style scoped>
.user-management {
  height: 100vh;
  display: flex;
}

.admin-sidebar {
  height: 100%;
  background-color: #304156;
  color: white;
}

.admin-title {
  padding: 15px;
  text-align: center;
  font-size: 18px;
  border-bottom: 1px solid #1f2d3d;
  margin: 0;
  line-height: 30px;
}

.admin-menu {
  border-right: none;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: white;
  padding: 0 20px;
  height: 100%;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.admin-main {
  padding: 30px;
  background-color: #f0f2f5;
  overflow-y: auto;
  height: calc(100vh - 60px);
}

.filter-container {
  padding-bottom: 25px;
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
}

.filter-item {
  margin-right: 0;
}

.pagination-container {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;
}

/* 表格样式优化 */
::v-deep .el-table {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  overflow: hidden;
}

::v-deep .el-table th {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 600;
  height: 50px;
}

::v-deep .el-table td {
  padding: 12px 0;
}

::v-deep .el-button--small {
  padding: 8px 15px;
  font-size: 13px;
  border-radius: 4px;
}

::v-deep .el-tag {
  padding: 0 12px;
  height: 28px;
  line-height: 26px;
}

/* 固定高度内容区，避免页面拉伸 */
.el-container, .el-aside {
  height: 100%;
}

.el-header {
  padding: 0;
}

.avatar-dropdown {
  cursor: pointer;
}

/* 用户ID链接样式 */
::v-deep .el-link {
  font-size: 14px;
}
</style>