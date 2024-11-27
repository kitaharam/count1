/**
 * 添加账单页面
 * 实现账单添加功能，包括金额输入、标签选择、日期选择和备注输入
 * 支持自动标签识别功能
 */

const app = getApp()
// 引入标签识别工具
const tagRecognizer = require('../../utils/tagRecognizer.js')

Page({
  // 页面的初始数据
  data: {
    amount: '',           // 账单金额
    tags: [],            // 可选标签列表
    selectedTag: '',      // 当前选中的标签
    date: '',            // 账单日期
    note: '',            // 账单备注
    isAutoTagEnabled: true  // 是否启用自动标签识别
  },

  /**
   * 生命周期函数--监听页面加载
   * 设置默认日期为今天，初始化标签列表
   */
  onLoad() {
    // 设置默认日期为今天
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    
    this.setData({
      date: `${year}-${month}-${day}`,
      tags: app.globalData.defaultTags
    })
  },

  /**
   * 金额输入处理
   * 限制只能输入数字和小数点，且只能有一个小数点，限制小数点后两位
   */
  onAmountInput(e) {
    let value = e.detail.value
    // 限制只能输入数字和小数点
    value = value.replace(/[^\d.]/g, '')
    // 限制只能有一个小数点
    if (value.split('.').length > 2) {
      value = value.slice(0, value.lastIndexOf('.'))
    }
    // 限制小数点后两位
    if (value.includes('.')) {
      const [integer, decimal] = value.split('.')
      value = `${integer}.${decimal.slice(0, 2)}`
    }
    this.setData({ amount: value })
  },

  /**
   * 标签选择处理
   */
  selectTag(e) {
    const tag = e.currentTarget.dataset.tag
    this.setData({ selectedTag: tag })
  },

  /**
   * 日期选择处理
   */
  onDateChange(e) {
    this.setData({ date: e.detail.value })
  },

  /**
   * 备注输入处理
   * 如果启用了自动标签识别，会根据备注内容自动选择对应的标签
   */
  onNoteInput(e) {
    const note = e.detail.value
    this.setData({ note })
    
    // 如果启用了自动标签识别，根据备注自动识别标签
    if (this.data.isAutoTagEnabled && note) {
      const recognizedTag = tagRecognizer.recognizeTag(note)
      this.setData({ selectedTag: recognizedTag })
    }
  },

  /**
   * 切换自动标签识别功能
   */
  toggleAutoTag() {
    this.setData({
      isAutoTagEnabled: !this.data.isAutoTagEnabled
    })
  },

  /**
   * 提交账单
   * 验证输入数据，保存到数据库，并在成功后返回上一页
   */
  async submitBill() {
    if (!app.globalData.isLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    const { amount, selectedTag, date, note } = this.data

    if (!amount) {
      wx.showToast({
        title: '请输入金额',
        icon: 'none'
      })
      return
    }

    if (!selectedTag) {
      wx.showToast({
        title: '请选择标签',
        icon: 'none'
      })
      return
    }

    try {
      const db = app.c1.database()
      await db.collection('bills').add({
        data: {
          userId: app.globalData.userInfo._id,
          amount: Number(amount),
          tag: selectedTag,
          date: db.serverDate(),
          note: note || this.getDefaultNote(selectedTag),
          createdAt: db.serverDate()
        }
      })

      wx.showToast({
        title: '添加成功',
        success: () => {
          setTimeout(() => {
            wx.navigateBack({
              success: () => {
                // 确保返回后刷新账单列表和统计数据
                const pages = getCurrentPages()
                // 刷新账单列表
                const indexPage = pages.find(p => p.route === 'pages/index/index')
                if (indexPage) {
                  indexPage.loadBills()
                }
                // 刷新统计数据
                const statisticsPage = pages.find(p => p.route === 'pages/statistics/statistics')
                if (statisticsPage) {
                  statisticsPage.loadData()
                }
              }
            })
          }, 1500)
        }
      })
    } catch (err) {
      console.error('添加账单失败：', err)
      wx.showToast({
        title: '添加失败',
        icon: 'none'
      })
    }
  },

  /**
   * 获取标签对应的默认备注
   */
  getDefaultNote(tag) {
    const noteMap = {
      '餐饮': '用餐',
      '交通': '交通费',
      '购物': '日常购物',
      '娱乐': '休闲娱乐',
      '居住': '房租水电',
      '医疗': '医疗费用',
      '教育': '学习培训',
      '其他': '其他支出'
    }
    return noteMap[tag] || ''
  }
})