<template>
  <div style="padding: 10px">
    <el-table stripe :data="tableData">
      <el-table-column label="id" prop="id" />
      <el-table-column label="订单名称" prop="name" />
      <el-table-column label="订单编号" prop="orderId" />
      <el-table-column label="支付宝订单号" prop="alipayNo" />
      <el-table-column label="总价格" prop="total" />
      <el-table-column label="创建时间" prop="createTime" />
      <el-table-column label="支付时间" prop="payTime" />
      <el-table-column label="订单状态" prop="state">
        <template v-slot="scope">
          <el-tag :type="scope.row.state ? 'success' : 'danger'">
            {{ scope.row.state ? '已支付' : '未支付' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template v-slot="scope">
          <el-button
            @click="pay(scope.row)"
            type="primary"
            size="small"
            :disabled="scope.row.state"
          >
            支付
          </el-button>
          <el-button
            @click="refund(scope.row)"
            type="warning"
            size="small"
            :disabled="!scope.row.state"
          >
            退款
          </el-button>
          <el-button
            @click="cancel(scope.row.id)"
            type="danger"
            size="small"
            :disabled="scope.row.state"
          >
            取消
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
const baseUrl = 'http://localhost:8088'

export default {
  name: 'Orders',
  data () {
    return {
      tableData: []
    }
  },
  created () {
    // 生成假数据
    this.generateMockData()
  },
  methods: {
    generateMockData () {
      // 模拟5条订单数据
      this.tableData = [
        {
          id: 1,
          name: 'iPhone 15 Pro',
          orderId: 'ORD' + Date.now() + '001',
          alipayNo: '',
          total: 8.00,
          createTime: this.formatDate(new Date()),
          payTime: '',
          state: false
        },
        {
          id: 2,
          name: 'MacBook Pro 14',
          orderId: 'ORD' + Date.now() + '002',
          alipayNo: '',
          total: 9.00,
          createTime: this.formatDate(new Date()),
          payTime: '',
          state: false
        },
        {
          id: 3,
          name: 'AirPods Pro 2',
          orderId: 'ORD' + Date.now() + '003',
          alipayNo: '',
          total: 19.00,
          createTime: this.formatDate(new Date()),
          payTime: '',
          state: false
        },
        {
          id: 4,
          name: 'Apple Watch Series 9',
          orderId: 'ORD' + Date.now() + '004',
          alipayNo: '',
          total: 29.00,
          createTime: this.formatDate(new Date()),
          payTime: '',
          state: false
        },
        {
          id: 5,
          name: 'iPad Pro 12.9',
          orderId: 'ORD' + Date.now() + '005',
          alipayNo: '',
          total: 99.00,
          createTime: this.formatDate(new Date()),
          payTime: '',
          state: false
        }
      ]
    },

    formatDate (date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    },

    pay (row) {
      // 调用支付宝支付接口
      window.open(`${baseUrl}/alipay/pay?subject=${row.name}&traceNo=${row.orderId}&totalAmount=${row.total}`)

      // 模拟支付成功后的状态更新
      setTimeout(() => {
        const index = this.tableData.findIndex(item => item.id === row.id)
        if (index !== -1) {
          this.tableData[index].state = true
          this.tableData[index].payTime = this.formatDate(new Date())
          this.tableData[index].alipayNo = 'ALI' + Date.now() + Math.floor(Math.random() * 1000)
          this.$message.success('支付成功')
        }
      }, 3000)
    },

    refund (row) {
      // 调用退款接口
      this.$confirm('确定要退款吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        fetch(`${baseUrl}/alipay/return?traceNo=${row.orderId}&alipayTraceNo=${row.alipayNo}&totalAmount=${row.total}`)
          .then(res => res.json())
          .then(res => {
            if (res.code === 200) {
              const index = this.tableData.findIndex(item => item.id === row.id)
              if (index !== -1) {
                this.tableData[index].state = false
                this.tableData[index].payTime = ''
                this.$message.success('退款成功')
              }
            } else {
              this.$message.error('退款失败: ' + res.msg)
            }
          })
          .catch(err => {
            this.$message.error('退款请求失败: ' + err)
          })
      }).catch(() => {
        this.$message.info('已取消退款')
      })
    },

    cancel (id) {
      this.$confirm('确定要取消订单吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 这里可以调用后端取消订单的接口
        const index = this.tableData.findIndex(item => item.id === id)
        if (index !== -1) {
          this.tableData.splice(index, 1)
          this.$message.success('订单已取消')
        }
      }).catch(() => {
        this.$message.info('已取消操作')
      })
    }
  }
}
</script>

<style scoped>
.el-table {
  margin-top: 20px;
}
</style>
