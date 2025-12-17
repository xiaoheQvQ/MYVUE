<template>
  <div class="video-management">
    <el-container>
      <el-aside width="200px">
        <div class="admin-sidebar">
          <h3 class="admin-title">管理员控制台</h3>
          <el-menu
            default-active="2"
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
            <h2 class="page-title">视频管理</h2>
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
              placeholder="请输入视频标题"
              style="width: 250px;"
              class="filter-item"
              @keyup.enter.native="handleFilter"
              prefix-icon="el-icon-search"
              clearable
            />
            <el-button class="filter-item" type="primary" @click="handleFilter">
              搜索
            </el-button>
          </div>

          <!-- 视频列表 -->
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
            <el-table-column align="center" label="封面" width="160">
              <template slot-scope="scope">
                <el-image 
                  :src="scope.row.cover" 
                  fit="cover"
                  style="width: 120px; height: 70px; border-radius: 4px;"
                  :preview-src-list="[scope.row.cover]">
                  <div slot="error" class="image-slot">
                    <i class="el-icon-picture-outline"></i>
                  </div>
                </el-image>
              </template>
            </el-table-column>
            <el-table-column align="center" label="标题" min-width="200">
              <template slot-scope="scope">
                <span>{{ scope.row.title }}</span>
              </template>
            </el-table-column>
            <el-table-column align="center" label="字幕" min-width="100">
              <template slot-scope="scope">
                <span>{{ scope.row.subtitle ? '是' : '无' }}</span>
              </template>
            </el-table-column>
            <el-table-column align="center" label="时长" width="100">
              <template slot-scope="scope">
                <span>{{ formatDuration(scope.row.duration) }}</span>
              </template>
            </el-table-column>
            <el-table-column align="center" label="播放量" width="100">
              <template slot-scope="scope">
                <span>{{ scope.row.count || 0 }}</span>
              </template>
            </el-table-column>
          
            <el-table-column align="center" label="状态" width="120">
              <template slot-scope="scope">
                <el-tag 
                  :type="getStatusType(scope.row)" 
                  size="medium">
                  {{ formatStatus(scope.row) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column align="center" label="上传时间" min-width="180">
              <template slot-scope="scope">
                <span>{{ scope.row.createTime | formatDate }}</span>
              </template>
            </el-table-column>
            <el-table-column align="center" label="操作" width="330">
              <template slot-scope="scope">
                <div class="action-buttons">
                  <el-button
                    size="small"
                    type="primary"
                    @click="handlePreview(scope.row)"
                    icon="el-icon-view"
                    :disabled="scope.row.status === 'Checking' || scope.row.auditStatus === 'Init' || scope.row.auditStatus === 'Failed'">
                    预览
                  </el-button>
                  <el-button
                    v-if="scope.row.status === 'Checking' || scope.row.auditStatus === 'Init'"
                    size="small"
                    type="warning"
                    @click="handleApprove(scope.row)"
                    icon="el-icon-check">
                    通过审核
                  </el-button>
                  <el-button
                    size="small"
                    type="success"
                    @click="handleAddSubtitle(scope.row)"
                    icon="el-icon-document-add">
                    添加字幕
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    @click="handleDelete(scope.row)"
                    icon="el-icon-delete">
                    删除
                  </el-button>
                </div>
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
import adminVideoApi from '@/api/video/admin'
import { formatDate } from '@/utils/date'

export default {
  name: 'VideoManagement',
  filters: {
    formatDate(time) {
      return formatDate(new Date(time), 'yyyy-MM-dd hh:mm:ss')
    }
  },
  data() {
    return {
      list: [], // 视频列表
      total: 0,
      listLoading: true,
      listQuery: {
        current: 1,
        size: 10,
        keyword: ''
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
    handleAddSubtitle(row) {
    console.log("videoId:"+row.videoId);
    console.log("id:"+row.id);
    adminVideoApi.WavSub(row.videoId).then(res => {
      
    })
    
  },
    formatDuration(seconds) {
      if (!seconds) return '00:00'
      
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    },
    fetchData() {
      this.listLoading = true
      
      // 调用后端API获取视频列表
      adminVideoApi.getVideoList(this.listQuery).then(res => {
        if (res.code === 200000) {
          this.list = res.data.records || []
          this.total = res.data.total || 0
        } else {
          this.$message.error(res.msg || '获取视频列表失败')
        }
        this.listLoading = false
      }).catch(err => {
        console.error('获取视频列表失败', err)
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
    formatStatus(row) {
      // 判断视频状态
      if (row.status === 'Checking' || row.auditStatus === 'Init') {
        return '审核中'
      } else if (row.status === 'Normal' && row.auditStatus === 'Success') {
        return '已发布'
      } else if (row.auditStatus === 'Failed') {
        return '审核失败'
      } else {
        return row.status || '未知'
      }
    },
    getStatusType(row) {
      // 判断视频状态，返回对应的Tag类型
      if (row.status === 'Checking' || row.auditStatus === 'Init') {
        return 'warning'
      } else if (row.status === 'Normal' && row.auditStatus === 'Success') {
        return 'success'
      } else if (row.auditStatus === 'Failed') {
        return 'danger'
      } else {
        return 'info'
      }
    },
    handlePreview(row) {
      // 检查视频状态
      if (row.status === 'Checking' || row.auditStatus === 'Init') {
        this.$message.warning('该视频正在审核中，暂时无法预览。')
        return
      } else if (row.auditStatus === 'Failed') {
        this.$message.error('该视频审核未通过，无法预览。')
        return
      }
      
      // 打开视频预览，添加来源参数
      this.$router.push({
        path: '/video-player',
        query: {
          videoId: row.id,
          source: 'admin' // 添加来源标记
        }
      })
    },
    handleDelete(row) {
      this.$confirm('确认删除该视频?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 调用后端API删除视频
        adminVideoApi.deleteVideo(row.id).then(res => {
          if (res.code === 200000) {
            this.$message.success('删除成功')
            this.fetchData()
          } else {
            this.$message.error(res.msg || '删除失败')
          }
        }).catch(err => {
          console.error('删除视频失败', err)
          this.$message.error('删除失败')
        })
      }).catch(() => {
        // 取消删除
      })
    },
    handleApprove(row) {
      this.$confirm('确认通过该视频的审核?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 添加审核通过的API调用
        this.$message({
          message: '审核通过功能待开发',
          type: 'info'
        })
        // TODO: 添加实际的API调用
        // adminVideoApi.approveVideo(row.id).then(res => {
        //   if (res.code === 200000) {
        //     this.$message.success('审核已通过')
        //     this.fetchData()
        //   } else {
        //     this.$message.error(res.msg || '操作失败')
        //   }
        // }).catch(err => {
        //   console.error('操作失败', err)
        //   this.$message.error('操作失败')
        // })
      }).catch(() => {
        // 取消操作
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
.video-management {
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

/* 图片占位样式 */
::v-deep .image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
  font-size: 24px;
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
.action-buttons {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 18px; /* 增大间距 */
}
::v-deep .el-button--small {
  padding: 6px 10px; /* 减小内边距 */
  min-width: 70px;   /* 降低最小宽度 */
  font-size: 13px;
  border-radius: 4px;
  margin-left: 0;    /* 由gap控制间距 */
}
</style>