//index.js
//获取应用实例
const app = getApp();

Page({
  data: {
    //判断小程序的API，回调，参数，组件等是否在当前版本可用。
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    hasAuthority: false,
    isBinding:false,
    isLogin: false,
    userName: "",
    password: "",
    openid:"",
    name: ""
  },

  onLoad: function (options) {
    //检查并设置版本号为全局变量
    var that = this;
    wx.request({
      url: app.globalData.apiUrl + '/version',
      method: 'POST',
      success: (res) => {
        if ((res.data.data != "") && (res.data.data != null)) {
            app.globalData.qcmappversion = res.data.data
        }
      }
    });

    var openid = wx.getStorageSync('pj_cylinder_openid');
    if (openid != "") {
      that.setData({
        isLogin: true,
        hasAuthority: true,
        isBinding: true
      });
      console.log("openid:"+openid);
    }
  },

  onShow: function() {
    var that = this;
    var openid = wx.getStorageSync('pj_cylinder_openid');
    if(openid == "") {
      that.setData({
        isLogin: false,
        hasAuthority: false,
        isBinding: false
      })
    }
    wx.getStorage({
      key: 'pj_employee_name',
      success: function (res) {
        that.setData({
          'name': "当前使用者：" + res.data
        })
      },
    });
  },

  loginBtnClick: function(e) {
    var that = this;
    console.log(e.detail.value.login_username);
    console.log(e.detail.value.login_pwd);
    that.setData({
      isLogin: true,
      userName: e.detail.value.login_username,
      password: e.detail.value.login_pwd
    })
  },

  check: function() {
    var that = this;
    wx.getUserInfo({
      success: function (res) {
        //判断授权是否成功
        if (res) {
          wx.login({
            success: res => {
              wx.request({
                url: 'https://wx.feifanqishi.net/getOpenid.php?code=' + res.code,
                method: "GET",
                success: res2 => {
                  if (res2.errMsg == "request:ok") {
                    wx.setStorage({
                      key: "pj_cylinder_openid",
                      data: res2.data.openid
                    });
                    var userName = that.data.userName;
                    var password = that.data.password;
                    wx.request({
                      url: 'https://wx.feifanqishi.net/bindOpenid.php',
                      method: "POST",
                      header: {
                        "Content-Type": "application/x-www-form-urlencoded"
                      },
                      data: { openid: res2.data.openid, userName: userName, password: password },
                      success: res3 => {
                        if (res3.data.code == 200) {
                          wx.setStorage({
                            key: "pj_employee_name",
                            data: res3.data.data.name
                          });
                          wx.setStorage({
                            key: "pj_employee_mobile",
                            data: res3.data.data.mobile
                          });
                          wx.setStorage({
                            key: "pj_employee_position",
                            data: res3.data.data.position
                          });
                          wx.setStorage({
                            key: "pj_employee_id",
                            data: res3.data.data.id
                          });
                          // console.log(res3.data.data.name);
                          // console.log(res3.data.data.mobile);
                          // console.log(res3.data.data.position);
                          /** 职位 1司机，2押运员，3收发，4生产，5检测 **/
                          wx.showToast({
                            title: "绑定成功",
                            icon: 'success',
                            duration: 2000
                          });
                          that.setData({
                            hasAuthority: true,
                            isBinding: true,
                            name: "当前使用者：" + wx.getStorageSync("pj_employee_name")
                          });
                        } else {
                          that.setData({
                            isLogin: false,
                            hasAuthority: false,
                            isBinding: false
                          })
                          wx.showToast({
                            title: res3.data.msg,
                            icon: 'none',
                            duration: 2000
                          });
                        }
                      }
                    })
                  }
                }
              });
            }
          });
        } else {
          that.setData({
            isLogin: false,
            hasAuthority: false,
            isBinding: false
          });
        }
      }
    });
  },

  bindGetUserInfo: function (e) {
    if (e.detail.userInfo) {
      //用户按了允许授权按钮
      var that = this;
      // 获取到用户的信息了，打印到控制台上看下
      console.log("用户的信息如下：");
      console.log(e.detail.userInfo);
      //授权成功后,通过改变 isHide 的值，让实现页面显示出来，把授权页面隐藏起来
      that.setData({
        hasAuthority: true
      });
      that.check();
    }
  },

  cancel: function(e) {
    var that = this;
    that.setData({
      isLogin: false,
      hasAuthority: false,
      isBinding: false
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})