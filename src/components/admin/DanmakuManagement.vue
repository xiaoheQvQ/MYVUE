<template>
  <div class="danmaku-management">
    <el-container>
      <el-aside width="200px">
        <div class="admin-sidebar">
          <h3 class="admin-title">管理员控制台</h3>
          <el-menu
            default-active="3"
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
              <span slot="title">评论管理</span>
            </el-menu-item>
          </el-menu>
        </div>
      </el-aside>
      <el-container class="main-container">
        <el-header height="60px">
          <div class="admin-header">
            <h2 class="page-title">评论管理</h2>
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
              v-model="listQuery.content"
              placeholder="请输入评论内容"
              style="width: 250px;"
              class="filter-item"
              @keyup.enter.native="handleFilter"
              prefix-icon="el-icon-search"
              clearable
            />
            <el-input
              v-model="listQuery.userName"
              placeholder="请输入用户名"
              style="width: 200px;"
              class="filter-item"
              @keyup.enter.native="handleFilter"
              prefix-icon="el-icon-user"
              clearable
            />
            <el-button class="filter-item" type="primary" @click="handleFilter">
              搜索
            </el-button>
          </div>

          <!-- 评论列表 -->
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
            <el-table-column align="center" label="内容" min-width="300">
              <template slot-scope="scope">
                <span>{{ scope.row.content }}</span>
              </template>
            </el-table-column>
            <el-table-column align="center" label="用户" width="150">
              <template slot-scope="scope">
                <span>{{ scope.row.nick || '未知用户' }}</span>
              </template>
            </el-table-column>
            <el-table-column align="center" label="创建时间" min-width="200">
              <template slot-scope="scope">
                <span>{{ scope.row.createTime | formatDate }}</span>
              </template>
            </el-table-column>
            <el-table-column align="center" label="操作" width="120">
              <template slot-scope="scope">
                <el-button
                  size="small"
                  type="danger"
                  @click="handleDelete(scope.row)"
                  icon="el-icon-delete">
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
              :total="total">
            </el-pagination>
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import userApi from '@/api/user/user'
import commentApi from '@/api/admin/comment'
import { formatDate } from '@/utils/date'

export default {
  name: 'commentManagement',
  filters: {
    formatDate (time) {
      return formatDate(new Date(time), 'yyyy-MM-dd hh:mm:ss')
    }
  },
  data () {
    return {
      list: [], // 评论列表
      total: 0,
      listLoading: true,
      listQuery: {
        current: 1,
        size: 10,
        content: '',
        userName: ''
      }
    }
  },
  created () {
    // 检查是否是管理员登录
    if (localStorage.getItem('loginType') !== 'admin') {
      this.$router.push('/login')
      this.$message.error('请先以管理员身份登录')
      return
    }

    this.fetchData()
  },
  methods: {
    fetchData () {
      this.listLoading = true

      // 构建查询参数
      const params = {
        current: this.listQuery.current,
        size: this.listQuery.size
      }

      if (this.listQuery.content) {
        params.content = this.listQuery.content
      }

      if (this.listQuery.userName) {
        params.userName = this.listQuery.userName
      }

      // 使用新的danmakuApi获取评论列表
      commentApi.getCommentList(params)
        .then(res => {
          if (res.code === 200000) {
            this.list = res.data.records || []
            this.total = res.data.total || 0
          } else {
            this.$message.error(res.msg || '获取评论列表失败')
          }
          this.listLoading = false
        })
        .catch(err => {
          console.error('获取评论列表失败', err)
          this.$message.error('获取评论列表失败')
          this.listLoading = false
        })
    },
    handleFilter () {
      this.listQuery.current = 1
      this.fetchData()
    },
    handleSizeChange (val) {
      this.listQuery.size = val
      this.fetchData()
    },
    handleCurrentChange (val) {
      this.listQuery.current = val
      this.fetchData()
    },
    handleDelete (row) {
      this.$confirm('确认删除该评论?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 使用新的danmakuApi删除评论
        commentApi.deleteComment(row.id)
          .then(res => {
            if (res.code === 200000) {
              this.$message.success('删除成功')
              this.fetchData()
            } else {
              this.$message.error(res.msg || '删除失败')
            }
          })
          .catch(err => {
            console.error('删除评论失败', err)
            this.$message.error('删除失败')
          })
      }).catch(() => {
        // 取消删除
      })
    },
    handleUserCommand (command) {
      if (command === 'logout') {
        this.logout()
      }
    },
    logout () {
      // 退出登录
      userApi.logout().then(() => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('loginType')
        this.$router.push('/login')
        this.$message.success('已退出登录')
      }).catch(err => {
        console.error('退出登录失败', err)
        this.$message.error('退出登录失败')
      })
    }
  }
}
</script>

<style scoped>
.danmaku-management {
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
  margin-left: 5px;
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
</style>
