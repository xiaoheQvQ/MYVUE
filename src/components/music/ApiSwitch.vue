<template>
  <div class="api-switch">
    <el-dropdown trigger="click" @command="handleSwitch">
      <span class="el-dropdown-link">
        <i class="el-icon-connection"></i> {{ useLocal ? '本地接口' : '开放平台' }}
        <i class="el-icon-arrow-down el-icon--right"></i>
      </span>
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item :command="true" :class="{ active: useLocal }">
          <i class="el-icon-monitor"></i> 本地接口
        </el-dropdown-item>
        <el-dropdown-item :command="false" :class="{ active: !useLocal }">
          <i class="el-icon-cloudy"></i> 开放平台
        </el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
  </div>
</template>

<script>
import { getUseLocal, setUseLocal } from '@/api/music/music'

export default {
  name: 'ApiSwitch',
  data() {
    return {
      useLocal: getUseLocal()
    }
  },
  methods: {
    handleSwitch(val) {
      if (typeof val !== 'boolean') return
      setUseLocal(val)
      this.$message({
        message: `已切换至${val ? '本地' : '开放平台'}接口`,
        type: 'success',
        customClass: 'custom-message'
      })
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }
  }
}
</script>

<style scoped>
.api-switch {
  display: inline-block;
}

.el-dropdown-link {
  cursor: pointer;
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 16px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transition: all 0.3s;
}

.el-dropdown-link:hover {
  background: rgba(255, 255, 255, 0.2);
}

.active {
  color: #1ed760;
  font-weight: bold;
}
</style>
