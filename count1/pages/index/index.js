// index.js
const app = getApp()

Page({
  data: {
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    bills: [],
    monthlyTotal: 0,
    showDeleteModal: false,
    currentDeleteId: null,
    currentDeleteIndex: null
  },

  onLoad() {
    if (!app.globalData.isLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        success: () => {
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/user/user'
            })
          }, 1500)
        }
      })
      return
    }
    this.loadBills()
  },

  async loadBills() {
    const { currentYear, currentMonth } = this.data
    const startDate = new Date(currentYear, currentMonth - 1, 1)
    const endDate = new Date(currentYear, currentMonth, 0)

    try {
      const db = app.c1.database()
      const { data } = await db.collection('bills')
        .where({
          userId: app.globalData.userInfo._id,
          date: db.command.gte(startDate).and(db.command.lte(endDate))
        })
        .orderBy('date', 'desc')
        .get()

      // 处理日期显示
      const bills = data.map(bill => ({
        ...bill,
        dateStr: this.formatDate(new Date(bill.date))
      }))

      const monthlyTotal = bills.reduce((sum, bill) => sum + Number(bill.amount), 0)

      this.setData({
        bills,
        monthlyTotal: monthlyTotal.toFixed(2)
      })
    } catch (err) {
      console.error(err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  formatDate(date) {
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}月${day}日`
  },

  showDeleteConfirm(e) {
    const { id, index } = e.currentTarget.dataset
    this.setData({
      showDeleteModal: true,
      currentDeleteId: id,
      currentDeleteIndex: index
    })
  },

  cancelDelete() {
    this.setData({
      showDeleteModal: false,
      currentDeleteId: null,
      currentDeleteIndex: null
    })
  },

  async confirmDelete() {
    try {
      const db = app.c1.database()
      await db.collection('bills').doc(this.data.currentDeleteId).remove()
      wx.showToast({
        title: '删除成功'
      })
      this.loadBills()
    } catch (err) {
      console.error(err)
      wx.showToast({
        title: '删除失败',
        icon: 'none'
      })
    } finally {
      this.setData({
        showDeleteModal: false,
        currentDeleteId: null,
        currentDeleteIndex: null
      })
    }
  },

  prevMonth() {
    let { currentYear, currentMonth } = this.data
    if (currentMonth === 1) {
      currentMonth = 12
      currentYear--
    } else {
      currentMonth--
    }
    this.setData({ currentYear, currentMonth }, this.loadBills)
  },

  nextMonth() {
    let { currentYear, currentMonth } = this.data
    if (currentMonth === 12) {
      currentMonth = 1
      currentYear++
    } else {
      currentMonth++
    }
    this.setData({ currentYear, currentMonth }, this.loadBills)
  },

  navigateToAdd() {
    if (!app.globalData.isLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/addBill/addBill',
      fail: (err) => {
        console.error('导航失败：', err)
        wx.showToast({
          title: '页面打开失败',
          icon: 'none'
        })
      }
    })
  },

  onShow() {
    if (!app.globalData.isLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        success: () => {
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/user/user'
            })
          }, 1500)
        }
      })
      return
    }
    this.loadBills()
  }
}) 