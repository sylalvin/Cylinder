var app = getApp();
var util = require('../../utils/util');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    qcmappversion: '1.0.0',
    isShow: false,
    disabled: false,
    opacity: 0.9,
    cylinderInfo: {
      cylinderId: "",
      unitId: "",
      cylinderNumber: "",
      cylinderCode: "",
      gasMediumName: "",
      cylinderTypeName: "",
      regularInspectionDate: "",
      cylinderScrapDate: "",
      remark: "",
      creator: ""
    }
  },

  onShow: function () {

  },

  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面加载
   * 获取版本号、流转区域
   */
  onLoad: function (options) {
    var that = this;
    if (!util.checkLogin()) {
      wx.showToast({
        title: '您还未登录,请先登录',
        icon: 'none',
        mask: true,
        duration: 1000
      })
      setTimeout(function () {
        wx.switchTab({
          url: '/pages/index/index',
        })
      }, 1000)
      return;
    }
    // 获取版本号
    wx.request({
      url: app.globalData.apiUrl + '/version',
      method: 'POST',
      success: (res) => {
        if ((res.data.data != "") && (res.data.data != null)) {
          that.setData({
            qcmappversion: res.data.data
          })
        } else {
          wx.showToast({
            title: '版本号不存在',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: (e) => {
        wx.showToast({
          title: '获取版本号接口访问失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   * 初始化数据
   */
  onReady: function () {
    var that = this;

    wx.getStorage({
      key: 'pj_employee_name',
      success: (res) => {
        that.setData({
          'cylinderInfo.creator': res.data
        })
      },
    })
  },

  bindInputChange: function (e) {
    var that = this;
    that.setData({
      'cylinderInfo.remark': e.detail.value
    })
  },

  // 页面主要逻辑部分--开始
  // 扫码添加
  addCylinder: function () {
    var that = this;
    wx.scanCode({
      success: (res) => {
        if (res.result.indexOf("0001") != -1) {
          var cylinderCode = res.result;
          var cylinderNumber = cylinderCode.substring(cylinderCode.length - 11);
          if (cylinderNumber.length != 11) {
            that.setData({
              isShow: false
            })
            wx.showToast({
              title: '该气瓶码长度不正确',
              icon: 'none',
              mask: true,
              duration: 2500
            })
          } else {
            // 查询气瓶信息
            that.queryCylinderInfoByNumber(cylinderNumber);
          }
        } else {
          that.setData({
            isShow: false
          })
          wx.showToast({
            title: '请扫描气瓶二维码或条码',
            icon: 'none',
            mask: true,
            duration: 2500
          })
        }
      }
    })
  },

  // 根据气瓶二维码编号查询气瓶信息
  queryCylinderInfoByNumber: function (cylinderNumber) {
    var that = this;
    var qcmappversion = that.data.qcmappversion;
    wx.request({
      url: app.globalData.apiUrl + '/getCylinderByNumber',
      method: 'GET',
      data: {
        'cylinderNumber': cylinderNumber
      },
      header: {
        'qcmappversion': qcmappversion
      },
      success: (res) => {
        if ((res.data.data != "") && (res.data.data != null)) {
          let cylinderId = res.data.data.id;
          let unitId = res.data.data.unitId;
          let cylinderCode = res.data.data.cylinderCode; // 气瓶码
          let cylinderTypeName = res.data.data.cylinderTypeName; // 气瓶类型名称
          let gasMediumName = res.data.data.gasMediumName; // 气瓶介质名称
          let regularInspectionDate = res.data.data.regularInspectionDate.substring(0, 7); // 气瓶下检日期
          regularInspectionDate = regularInspectionDate.substring(0, 5) + that.addZero(parseInt(regularInspectionDate.substring(5, 7)) - 1);
          let cylinderScrapDate = res.data.data.cylinderScrapDate.substring(0, 7); // 气瓶过期日期

          let cylinderManufacturingDate = res.data.data.cylinderManufacturingDate.substring(0, 7); // 气瓶生产日期
          let volume = res.data.data.volume; // 气瓶容积
          let nominalTestPressure = res.data.data.nominalTestPressure; // 气瓶压力
          let weight = res.data.data.weight; // 气瓶重量
          let lastFillTime = res.data.data.lastFillTime; // 气瓶最后充装时间
          let wallThickness = res.data.data.wallThickness; // 气瓶壁厚
          // 报废公共变量
          app.globalData.scrapCylinderInfo = {
            "cylinderId": cylinderId,
            "unitId": unitId,
            "cylinderNumber": cylinderNumber,
            "cylinderCode": cylinderCode,
            "cylinderTypeName": cylinderTypeName,
            "gasMediumName": gasMediumName,
            "regularInspectionDate": regularInspectionDate,
            "cylinderScrapDate": cylinderScrapDate,
            "cylinderManufacturingDate": cylinderManufacturingDate,
            "volume": volume,
            "nominalTestPressure": nominalTestPressure,
            "weight": weight,
            "lastFillTime": lastFillTime,
            "wallThickness": wallThickness,
          }
          that.setData({
            "cylinderInfo.cylinderId": cylinderId,
            "cylinderInfo.unitId": unitId,
            "cylinderInfo.cylinderNumber": cylinderNumber,
            "cylinderInfo.cylinderCode": cylinderCode,
            "cylinderInfo.cylinderTypeName": cylinderTypeName,
            "cylinderInfo.gasMediumName": gasMediumName,
            "cylinderInfo.regularInspectionDate": regularInspectionDate,
            "cylinderInfo.cylinderScrapDate": cylinderScrapDate,
            isShow: true
          })
          wx.showToast({
            title: "二维码：" + cylinderNumber + " 介质：" + gasMediumName + " 过期日期：" + regularInspectionDate,
            icon: 'none',
            mask: true,
            duration: 2500
          })
        } else {
          // 未查询到气瓶信息
          that.setData({
            isShow: false
          })
          wx.showToast({
            title: 'ID为 ' + cylinderNumber + ' 的气瓶信息缺失',
            icon: 'none',
            mask: true,
            duration: 2500
          })
        }
      },
      fail: (e) => {
        that.setData({
          isShow: false
        })
        wx.showToast({
          title: '查询气瓶接口访问失败',
          icon: 'none',
          mask: true,
          duration: 2500
        })
      }
    })
  },

  // 提交
  submitForm: function () {
    var that = this;
    var qcmappversion = that.data.qcmappversion;
    if (that.data.isShow) {
      var data = {
        unitId: that.data.cylinderInfo.unitId,
        cylinderId: that.data.cylinderInfo.cylinderId,
        reason: that.data.cylinderInfo.remark,
        creator: that.data.cylinderInfo.creator
      }
      wx.request({
        url: app.globalData.apiUrl + '/addCylinderScrapRecord',
        data: data,
        header: {
          'qcmappversion': qcmappversion
        },
        method: 'GET',
        success: (res) => {
          console.log(res.data.msg);
          wx.showToast({
            title: res.data.msg,
            icon: 'none',
            duration: 2000
          })
          if (res.data.msg == "成功") {
            that.setData({
              disabled: true,
              opacity: 0.3
            })
          }
        },
        fail: (e) => {
          wx.showToast({
            title: '添加报废接口访问失败',
            icon: 'none',
            duration: 2000
          })
        }
      })
    } else {
      wx.showToast({
        title: '您还未添加要报废的气瓶',
        icon: 'none',
        duration: 2000
      })
    }
  },

  // 日期补零
  addZero: function(x) {
    if(x < 10) {
      return '0' + x;
    } else {
      return '' + x;
    }
  },

  // 页面主要逻辑部分--结束

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})