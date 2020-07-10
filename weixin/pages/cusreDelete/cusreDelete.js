var app = getApp();
var util = require('../../utils/util');
Page({

  /**
   * 客户回瓶列表删除 js 逻辑；
   * 数据对象
   * { 
   *    scan_number, --扫描总次数
   *    scan_bulk, --散瓶扫描次数
   *    scan_set, --集格扫描次数
   *    scan_sum, --气瓶总数
   *    cylinderList, --扫描为气瓶的气瓶列表集合
   *    setList, --集格列表集合
   *    setCylinderList, --扫描为集格的气瓶列表集合
   *    allCylinderList, --所有气瓶列表集合
   * }
   */
  data: {
    scan_number: 0,
    scan_bulk: 0,
    scan_set: 0,
    scan_sum: 0,
    cylinderList: [],
    setList: [],
    setCylinderList: [],
    allCylinderList: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
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
  },

  onShow: function () {
    var that = this;
    // 执行删除后的初始化气瓶数据
    var setList = app.globalData.cusreSetList;
    var cylinderList = app.globalData.cusreCylinderList;
    var setCylinderList = app.globalData.cusreSetCylinderList;
    var allCylinderList = app.globalData.cusreAllCylinderList;
    that.setData({
      setList: setList,
      cylinderList: cylinderList,
      setCylinderList: setCylinderList,
      allCylinderList: allCylinderList
    })
    that.countData();
  },

  onHide: function () {
    var that = this;
    // 设置回厂验空全局变量
    app.globalData.cusreCylinderList = that.data.cylinderList;
    app.globalData.cusreSetCylinderList = that.data.setCylinderList;
    app.globalData.cusreSetList = that.data.setList;
    app.globalData.cusreAllCylinderList = that.data.allCylinderList;
  },

  // 计算扫码次数、气瓶、集格、总数数量
  countData: function () {
    var that = this;
    that.setData({
      scan_number: that.data.setList.length + that.data.cylinderList.length,
      scan_bulk: that.data.cylinderList.length,
      scan_set: that.data.setList.length,
      scan_sum: that.data.allCylinderList.length
    })
  },

  // 删除逻辑
  deleteCylinder: function (e) {
    var that = this;
    var setList = that.data.setList;
    var cylinderList = that.data.cylinderList;
    var setCylinderList = that.data.setCylinderList;
    var allCylinderList = that.data.allCylinderList;

    var setId = e.currentTarget.dataset.setId;
    var cylinderNumber = e.currentTarget.dataset.cylinderNumber;

    var modalContent = "";

    if (setId == null) { // 散瓶删除逻辑
      modalContent = "确定删除编号为：" + cylinderNumber + "的气瓶？"
      wx.showModal({
        title: '删除',
        content: modalContent,
        success(res) {
          if (res.confirm) {
            // cylinderList
            let index1 = cylinderList.indexOf(cylinderNumber);
            if (index1 > -1) {
              cylinderList.splice(index1, 1);
              that.setData({
                cylinderList: cylinderList
              })
            }

            // allCylinderList
            for (let i = 0; i < allCylinderList.length; i++) {
              if (allCylinderList[i].cylinderNumber == cylinderNumber) {
                let index2 = allCylinderList.indexOf(allCylinderList[i]);
                if (index2 > -1) {
                  allCylinderList.splice(index2, 1);
                }
              }
            }
            that.setData({
              allCylinderList: allCylinderList
            })

            that.countData();
          } else if (res.cancel) {
            console.log('删除取消');
          }
        }
      })
    } else { // 集格删除逻辑
      modalContent = "确定删除编号为：" + setId + "的集格？"
      wx.showModal({
        title: '删除',
        content: modalContent,
        success(res) {
          if (res.confirm) {
            // setList
            let index3 = setList.indexOf(setId);
            if (index3 > -1) {
              setList.splice(index3, 1);
              that.setData({
                setList: setList
              })
            }
            // setCylinderList
            for (let i = setCylinderList.length - 1; i >= 0; i--) {
              if (setCylinderList[i].setId == setId) {
                let index4 = setCylinderList.indexOf(setCylinderList[i]);
                if (index4 > -1) {
                  setCylinderList.splice(index4, 1);
                }
              }
            }
            that.setData({
              setCylinderList: setCylinderList
            })
            // allCylinderList
            for (let i = allCylinderList.length - 1; i >= 0; i--) {
              if (allCylinderList[i].setId == setId) {
                let index5 = allCylinderList.indexOf(allCylinderList[i]);
                if (index5 > -1) {
                  allCylinderList.splice(index5, 1);
                }
              }
            }
            that.setData({
              allCylinderList: allCylinderList
            })

            that.countData();
          } else if (res.cancel) {
            console.log('删除取消');
          }
        }
      })
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }

})