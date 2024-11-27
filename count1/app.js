App({
  // 小程序启动时执行
  onLaunch: async function () {
    // 初始化全局数据
    this.globalData = {
      userInfo: null,     // 用户信息
      isLogin: false,     // 登录状态
      defaultTags: [      // 默认标签列表
        '餐饮', '交通', '购物', '娱乐', 
        '居住', '医疗', '教育', '其他'
      ],
      isCloudReady: false  // 添加云开发初始化状态标志
    }

    // 检查是否支持云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }

    try {
      // 创建共享云对象，用于教育场景
      this.c1 = new wx.cloud.Cloud({
        resourceAppid: 'wx3199c80279c7b8c3',  // 教育场景固定 AppID
        resourceEnv: 'education-3g59nmtk9211bb2f'  // 云环境 ID
      })

      // 等待云开发初始化完成
      await this.c1.init()
      console.log('云开发初始化成功')
      this.globalData.isCloudReady = true  // 标记云开发已初始化

      // 如果有回调函数，执行它
      if (this.cloudReadyCallback) {
        this.cloudReadyCallback()
      }
    } catch (err) {
      console.error('云开发初始化失败：', err)
    }
  }
}) 