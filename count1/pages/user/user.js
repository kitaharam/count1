// pages/user/user.js
const app = getApp()

Page({
  data: {
    isLogin: false,
    userInfo: null,
    showLoginModal: false,
    isRegistering: false,
    username: '',
    password: '',
    confirmPassword: '',
    showChangePasswordModal: false,
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  },

  onLoad() {
    // 检查云开发是否初始化完成
    if (app.globalData.isCloudReady) {
      this.initUserInfo()
    } else {
      // 等待云开发初始化完成
      app.cloudReadyCallback = () => {
        this.initUserInfo()
      }
    }
  },

  // 初始化用户信息
  initUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        isLogin: true,
        userInfo
      })
      app.globalData.userInfo = userInfo
      app.globalData.isLogin = true
    }
  },

  showLoginModal() {
    this.setData({
      showLoginModal: true,
      isRegistering: false,
      username: '',
      password: '',
      confirmPassword: ''
    })
  },

  closeLoginModal() {
    this.setData({
      showLoginModal: false
    })
  },

  switchLoginType() {
    this.setData({
      isRegistering: !this.data.isRegistering,
      username: '',
      password: '',
      confirmPassword: ''
    })
  },

  async submitLogin() {
    const { isRegistering, username, password, confirmPassword } = this.data

    if (!username || !password) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    if (isRegistering) {
      if (password !== confirmPassword) {
        wx.showToast({
          title: '两次密码不一致',
          icon: 'none'
        })
        return
      }

      try {
        const db = app.c1.database()  // 使用共享环境的数据库
        // 检查用户名是否已存在
        const { data } = await db.collection('users').where({
          username
        }).get()

        if (data.length > 0) {
          wx.showToast({
            title: '用户名已存在',
            icon: 'none'
          })
          return
        }

        // 创建新用户
        const result = await db.collection('users').add({
          data: {
            username,
            password,
            createdAt: db.serverDate()
          }
        })

        const userInfo = {
          _id: result._id,
          username
        }

        this.setLoginState(userInfo)
        wx.showToast({
          title: '注册成功'
        })
      } catch (err) {
        console.error(err)
        wx.showToast({
          title: '注册失败',
          icon: 'none'
        })
      }
    } else {
      try {
        const db = app.c1.database()  // 使用共享环境的数据库
        const { data } = await db.collection('users').where({
          username,
          password
        }).get()

        if (data.length === 0) {
          wx.showToast({
            title: '用户名或密码错误',
            icon: 'none'
          })
          return
        }

        const userInfo = {
          _id: data[0]._id,
          username: data[0].username
        }

        this.setLoginState(userInfo)
        wx.showToast({
          title: '登录成功'
        })
      } catch (err) {
        console.error(err)
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        })
      }
    }
  },

  setLoginState(userInfo) {
    // 确保获取完整的用户信息，包括头像
    const db = app.c1.database()
    db.collection('users').doc(userInfo._id).get().then(res => {
      const fullUserInfo = {
        ...userInfo,
        avatarUrl: res.data.avatarUrl
      }
      
      // 更新本地存储和全局状态
      wx.setStorageSync('userInfo', fullUserInfo)
      this.setData({
        isLogin: true,
        userInfo: fullUserInfo,
        showLoginModal: false
      })
      app.globalData.userInfo = fullUserInfo
      app.globalData.isLogin = true

      // 登录成功后直接跳转到账单页面
      wx.switchTab({
        url: '/pages/index/index'
      })
    }).catch(err => {
      console.error('获取用户信息失败：', err)
      wx.showToast({
        title: '登录失败',
        icon: 'none'
      })
    })
  },

  showChangePasswordModal() {
    this.setData({
      showChangePasswordModal: true,
      oldPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    })
  },

  closeChangePasswordModal() {
    this.setData({
      showChangePasswordModal: false
    })
  },

  onOldPasswordInput(e) {
    this.setData({
      oldPassword: e.detail.value
    })
  },

  onNewPasswordInput(e) {
    this.setData({
      newPassword: e.detail.value
    })
  },

  onConfirmNewPasswordInput(e) {
    this.setData({
      confirmNewPassword: e.detail.value
    })
  },

  changePassword() {
    this.showChangePasswordModal()
  },

  async confirmChangePassword() {
    const { oldPassword, newPassword, confirmNewPassword } = this.data

    // 检查输入是否完整
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    // 检查新密码和确认密码是否一致
    if (newPassword !== confirmNewPassword) {
      wx.showToast({
        title: '两次新密码不一致',
        icon: 'none'
      })
      return
    }

    // 检查新密码是否与旧密码相同
    if (newPassword === oldPassword) {
      wx.showToast({
        title: '新密码不能与旧密码相同',
        icon: 'none'
      })
      return
    }

    try {
      const db = app.c1.database()
      // 验证旧密码
      const { data } = await db.collection('users')
        .where({
          _id: app.globalData.userInfo._id,
          password: oldPassword
        })
        .get()

      if (data.length === 0) {
        wx.showToast({
          title: '旧密码错误',
          icon: 'none'
        })
        return
      }

      // 更新密码
      await db.collection('users').doc(app.globalData.userInfo._id).update({
        data: {
          password: newPassword
        }
      })

      // 显示修改成功提示
      wx.showModal({
        title: '修改成功',
        content: '密码修改成功，请重新登录以确保账号安全',
        showCancel: false,
        success: () => {
          // 关闭修改密码弹窗
          this.setData({
            showChangePasswordModal: false
          })
          
          // 执行退出登录操作
          wx.removeStorageSync('userInfo')
          this.setData({
            isLogin: false,
            userInfo: null
          })
          app.globalData.userInfo = null
          app.globalData.isLogin = false

          // 显示提示
          wx.showToast({
            title: '请重新登录',
            icon: 'none'
          })
        }
      })
    } catch (err) {
      console.error(err)
      wx.showToast({
        title: '修改失败',
        icon: 'none'
      })
    }
  },

  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('userInfo')
          this.setData({
            isLogin: false,
            userInfo: null
          })
          app.globalData.userInfo = null
          app.globalData.isLogin = false
        }
      }
    })
  },

  onUsernameInput(e) {
    this.setData({
      username: e.detail.value
    })
  },

  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    })
  },

  onConfirmPasswordInput(e) {
    this.setData({
      confirmPassword: e.detail.value
    })
  },

  async chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFilePaths[0]
        
        try {
          wx.showLoading({
            title: '处理中...',
            mask: true
          })

          // 获取图片信息
          const imageInfo = await wx.getImageInfo({
            src: tempFilePath
          })

          // 获取 Canvas 实例
          const canvas = await new Promise((resolve) => {
            wx.createSelectorQuery()
              .select('#avatarCanvas')
              .fields({ node: true, size: true })
              .exec((res) => {
                if (res[0]) {
                  const canvas = res[0].node
                  const ctx = canvas.getContext('2d')
                  const dpr = wx.getSystemInfoSync().pixelRatio
                  canvas.width = 400 * dpr
                  canvas.height = 400 * dpr
                  ctx.scale(dpr, dpr)
                  resolve(canvas)
                } else {
                  resolve(null)
                }
              })
          })

          if (!canvas) {
            throw new Error('获取 Canvas 失败')
          }

          // 创建图片对象
          const image = canvas.createImage()
          await new Promise((resolve, reject) => {
            image.onload = resolve
            image.onerror = reject
            image.src = tempFilePath
          })

          // 计算裁剪位置
          const ctx = canvas.getContext('2d')
          const size = Math.min(imageInfo.width, imageInfo.height)
          const x = (imageInfo.width - size) / 2
          const y = (imageInfo.height - size) / 2

          // 清空画布并绘制图片
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(image, x, y, size, size, 0, 0, 400, 400)

          // 获取图片数据
          const tempFile = await new Promise((resolve, reject) => {
            wx.canvasToTempFilePath({
              canvas,
              destWidth: 400,
              destHeight: 400,
              fileType: 'jpg',
              quality: 0.8,
              success: res => resolve(res.tempFilePath),
              fail: reject
            })
          })

          // 检查文件大小
          const fileInfo = await wx.getFileInfo({
            filePath: tempFile
          })

          if (fileInfo.size > 2 * 1024 * 1024) {  // 2MB
            wx.showToast({
              title: '图片过大，请选择较小的图片',
              icon: 'none'
            })
            return
          }

          // 上传到云存储
          const cloudPath = `avatars/${app.globalData.userInfo._id}_${Date.now()}.jpg`
          const uploadRes = await app.c1.uploadFile({
            cloudPath,
            filePath: tempFile
          })

          // 获取访问链接
          const { fileList } = await app.c1.getTempFileURL({
            fileList: [uploadRes.fileID]
          })
          
          const avatarUrl = fileList[0].tempFileURL

          // 更新用户信息
          const db = app.c1.database()
          await db.collection('users').doc(app.globalData.userInfo._id).update({
            data: { avatarUrl }
          })

          // 更新本地数据
          const userInfo = {
            ...this.data.userInfo,
            avatarUrl
          }
          this.setData({ userInfo })
          wx.setStorageSync('userInfo', userInfo)
          app.globalData.userInfo = userInfo

          wx.showToast({
            title: '头像更新成功'
          })
        } catch (err) {
          console.error('更新头像失败：', err)
          wx.showToast({
            title: '更新失败',
            icon: 'none'
          })
        } finally {
          wx.hideLoading()
        }
      }
    })
  }
})