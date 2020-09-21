var app = getApp();
var util = require('../../utils/util');
Page({

  /**
   * 此详情页作为回厂验空、充后验满、发瓶卸货、客户回瓶、厂外流转、定期检测、维修、气瓶维护、报废共用；
   * 数据对象
   * { 
   *    cylinderNumber, --气瓶二维码编号
   *    cylinderCode, --气瓶钢印号
   *    cylinderTypeName, --气瓶类型
   *    gasMediumName, --气瓶介质
   *    regularInspectionDate, --气瓶下检日期
   *    cylinderScrapDate, --气瓶报废日期
   *    cylinderManufacturingDate, --气瓶生产日期
   *    volume, --气瓶容积
   *    nominalTestPressure, --气瓶公称压力
   *    weight, --气瓶重量
   *    lastFillTime, --气瓶最后充装时间
   *    wallThickness,  --气瓶壁厚
   *    lastFillPureness --气瓶最后充装纯度
   * }
   */
  data: {
    cylinderNumber: "",
    cylinderCode: "",
    gasMediumName: "",
    cylinderTypeName: "",
    volume: 0,
    wallThickness: 0,
    weight: 0,
    nominalTestPressure: 0,
    cylinderManufacturingDate: "",
    regularInspectionDate: "",
    cylinderScrapDate: "",
    lastFillTime: "",
    lastFillPureness: ""
  },

  /**
   * 生命周期函数--监听页面加载
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
    // 气瓶详情数据
    var moduleName = options.moduleName;
    var cylinderNumber = options.cylinderNumber;
    console.log(moduleName + '------' + cylinderNumber);
    var allCylinderList = [];
    var cylinderInfo = {};

    switch (moduleName) {
      case "back":
        allCylinderList = app.globalData.backAllCylinderList;
        break;
      case "out":
        allCylinderList = app.globalData.outAllCylinderList;
        break;
      case "send":
        allCylinderList = app.globalData.sendAllCylinderList;
        break;
      case "cusre":
        allCylinderList = app.globalData.cusreAllCylinderList;
        break;
      case "ware":
        allCylinderList = app.globalData.wareAllCylinderList;
        break;
      case "stock":
        allCylinderList = app.globalData.stockAllCylinderList;
        break;
      case "fill":
        allCylinderList = app.globalData.fillAllCylinderList;
        break;
      case "scrap":
        cylinderInfo = app.globalData.scrapCylinderInfo;
        break;
      case "maintain":
        cylinderInfo = app.globalData.maintainCylinderInfo;
        break;
      case "inspection":
        cylinderInfo = app.globalData.inspectionCylinderInfo;
        break;
      case "repair":
        cylinderInfo = app.globalData.repairCylinderInfo;
        break;
    }

    if (allCylinderList != []) {
      for (let i = 0; i < allCylinderList.length; i++) {
        if (allCylinderList[i].cylinderNumber == cylinderNumber) {
          that.setData({
            cylinderNumber: that.check(allCylinderList[i].cylinderNumber),
            cylinderCode: that.check(allCylinderList[i].cylinderCode),
            gasMediumName: that.check(allCylinderList[i].gasMediumName),
            cylinderTypeName: that.check(allCylinderList[i].cylinderTypeName),
            volume: that.check(allCylinderList[i].volume),
            wallThickness: that.check(allCylinderList[i].wallThickness),
            weight: that.check(allCylinderList[i].weight),
            nominalTestPressure: that.check(allCylinderList[i].nominalTestPressure),
            cylinderManufacturingDate: that.check(allCylinderList[i].cylinderManufacturingDate),
            regularInspectionDate: that.check(allCylinderList[i].regularInspectionDate),
            cylinderScrapDate: that.check(allCylinderList[i].cylinderScrapDate),
            lastFillTime: that.check(allCylinderList[i].lastFillTime),
            lastFillPureness: that.check(allCylinderList[i].lastFillPureness)
          })
        }
      }
    }

    if(cylinderInfo != {}) {
      if (cylinderInfo.cylinderNumber == cylinderNumber) {
        that.setData({
          cylinderNumber: that.check(cylinderInfo.cylinderNumber),
          cylinderCode: that.check(cylinderInfo.cylinderCode),
          gasMediumName: that.check(cylinderInfo.gasMediumName),
          cylinderTypeName: that.check(cylinderInfo.cylinderTypeName),
          volume: that.check(cylinderInfo.volume),
          wallThickness: that.check(cylinderInfo.wallThickness),
          weight: that.check(cylinderInfo.weight),
          nominalTestPressure: that.check(cylinderInfo.nominalTestPressure),
          cylinderManufacturingDate: that.check(cylinderInfo.cylinderManufacturingDate),
          regularInspectionDate: that.check(cylinderInfo.regularInspectionDate),
          cylinderScrapDate: that.check(cylinderInfo.cylinderScrapDate),
          lastFillTime: that.check(cylinderInfo.lastFillTime),
          lastFillPureness: that.check(allCylinderList[i].lastFillPureness)
        })
      }
    }
    
  },

  // 判断是否为空或null
  check: function (x) {
    if((x === null) || (x === 0) || (x === "") || (x === false) || (x === undefined)) {
      return "暂无记录";
    }
    return x;
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})