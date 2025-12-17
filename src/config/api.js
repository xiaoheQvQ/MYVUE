/**
 * API配置文件
 * 根据不同环境返回不同的API地址
 */

// API地址映射
const apiBaseUrls = {
  development: 'http://localhost:8088',
  testing: 'http://housekeeper.xin:8088',
  production: 'http://housekeeper.xin:8088'
}

// WebSocket地址映射
const wsBaseUrls = {
  development: 'ws://localhost:8088',
  testing: 'ws://housekeeper.xin:8088',
  production: 'ws://housekeeper.xin:8088'
}

// 获取当前环境
export const currentEnv = process.env.NODE_ENV || 'development'

// 获取当前环境的API地址
export const apiBaseUrl = process.env.API_URL || apiBaseUrls[currentEnv]

// 获取当前环境的WebSocket地址
export const wsBaseUrl = process.env.WS_URL || wsBaseUrls[currentEnv]

// 解析域名和端口（用于WebSocket连接）
export const apiHostname = parseHostname(apiBaseUrl)

// 开发调试用
console.log('当前环境:', currentEnv)
console.log('API地址:', apiBaseUrl)
console.log('WebSocket地址:', wsBaseUrl)

// 解析URL获取域名和端口
function parseHostname(url) {
  if (!url) return 'localhost:8088';

  try {
    // 移除协议
    let hostname = url.replace(/^(https?|wss?):\/\//, '');
    // 移除路径
    hostname = hostname.split('/')[0];
    return hostname;
  } catch (e) {
    console.error('解析API地址失败:', e);
    return 'localhost:8088';
  }
}

export default {
  currentEnv,
  apiBaseUrl,
  wsBaseUrl,
  apiHostname
}
