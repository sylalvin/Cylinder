var app = getApp();
var util = require('../../utils/util');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    qcmappversion: '1.0.0',
    getOrderData: false,
    disabled: false,
    opacity: 0.9,
    scanFlag: true,
    scan_number: 0,
    scan_bulk: 0,
    scan_set: 0,
    scan_sum: 0,
    cylinderList: [],
    setList: [],
    setCylinderList: [],
    allCylinderList: [],
    cylinderId: 0,
    detection: 0,
    empty: 0,
    orderData: {
      actionType: 2,
      creator: "",
      carId: 0,
      supercargoId: 0,
      driverId: 0,
      warehouseId: 0,
      customerId: 0,
      destinationType: 2,
      waybillNumber: "",
      unitId: 1,
      cylinderNum: 0,
      lat: '',
      lng: '',
      cylinderRecordList: []
    },
    actionTypeList: [
      { name: '发瓶', value: '2', checked: 'true' },
      { name: '收瓶', value: '1' }
    ],
    bottleType: [
      { name: '满瓶', value: '0', checked: 'true' },
      { name: '空瓶', value: '1' }
    ],
    inputValue: "",
    forTransNumberList: [],
    animationData: {}
  },

  onShow: function () {
    var that = this;
    // 执行删除后的初始化气瓶数据
    var setList = app.globalData.wareSetList;
    var cylinderList = app.globalData.wareCylinderList;
    var setCylinderList = app.globalData.wareSetCylinderList;
    var allCylinderList = app.globalData.wareAllCylinderList;
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
    that.setGlobal();
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
    // that.initData();
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
          'orderData.creator': res.data
        })
      },
    })
  },

  // 气瓶满空
  radioChange2: function (e) {
    var that = this;
    that.setData({
      'orderData.actionType': e.detail.value
    })
  },

  // 气瓶满空
  radioChange: function (e) {
    var that = this;
    that.setData({
      empty: e.detail.value
    })
  },

  // 模糊查询运单号item
  bindInputChange: function (e) {
    var that = this;
    if (e.detail.value.length > 4) {
      wx.request({
        url: "https://wx.feifanqishi.net/index.php",
        method: 'GET',
        data: {
          'action': 'searchTransOrderNumber',
          'number': e.detail.value
        },
        header: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        success: (res) => {
          if (that.judge(res.data.data)) {
            let forTransNumberList = [];
            for (let k = 0; k < res.data.data.length; k++) { // 只取前五条运单号
              forTransNumberList.push(res.data.data[k]);
            }
            that.setData({
              forTransNumberList: forTransNumberList
            })
            that.showAnimation();
          } else {
            that.setData({
              forTransNumberList: []
            })
          }
        },
        fail: (e) => {
          wx.showToast({
            title: '查询运单号列表接口访问失败',
            icon: 'none',
            mask: true,
            duration: 2500
          })
        }
      })
    } else {
      that.setData({
        forTransNumberList: []
      })
    }
  },

  onSelectItem: function (e) {
    var that = this;
    let forTransNumberList = that.data.forTransNumberList;
    let index = e.currentTarget.dataset.setIndex;
    let transId = forTransNumberList[index];
    that.queryTransInfo(transId);
    that.setData({
      forTransNumberList: []
    })
  },

  // 动画
  showAnimation: function () {
    var that = this;
    var animation = wx.createAnimation({
      duration: 1000,
      timingFunction: 'ease'
    });
    animation.opacity(1).step();
    that.setData({
      animationData: animation.export()
    })
  },

  // 根据运单号查询erp中运单信息
  queryTransInfo: function (transId) {
    var that = this;
    var qcmappversion = that.data.qcmappversion;
    that.setData({
      'orderData.waybillNumber': transId,
      inputValue: transId
    })
    if (transId != "") {
      wx.request({
        url: "https://wx.feifanqishi.net/index.php",
        method: 'GET',
        data: {
          'action': 'searchTransByOrderNo',
          'number': transId
        },
        success: (res) => {
          if ((res.data.data != "") && (res.data.data != null)) {
            that.setData({
              getOrderData: true
            })
            // 拼接判断司机和押运员
            let driverName = '';
            let surpercargoName = '';
            let driverNameArray = res.data.data.driverName.split(',');
            let surpercargoNameArray = res.data.data.surpercargo.split(',');
            let dsArray = driverNameArray.concat(surpercargoNameArray);
            for (let i = 0; i < dsArray.length; i++) {
              if (dsArray[i] == "") {
                dsArray.splice(i, 1);
                i--;
              }
            }
            if (dsArray.length == 1) {
              driverName = dsArray[0];
            } else if (dsArray.length > 1) {
              driverName = dsArray[0];
              surpercargoName = dsArray[dsArray.length - 1];
            }
            // 客户id或仓库id
            if (that.judge(res.data.data.customerName)) {
              that.setData({
                'orderData.destinationType': 1
              })
              wx.request({
                url: app.globalData.apiUrl + '/getCustomerByName',
                method: 'POST',
                data: {
                  'name': res.data.data.customerName,
                  'unitId': 1
                },
                header: {
                  'qcmappversion': qcmappversion,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                success: (res) => {
                  if (that.judge(res.data.data)) {
                    that.setData({
                      'orderData.customerId': res.data.data[0].id ? res.data.data[0].id : 0,
                      'orderData.warehouseId': 0
                    })
                  }
                },
                fail: (e) => {
                  wx.showToast({
                    title: '查询客户信息接口访问失败',
                    icon: 'none',
                    mask: true,
                    duration: 2500
                  })
                }
              })
            } else if (that.judge(res.data.data.warehouseName)) {
              that.setData({
                'orderData.destinationType': 2
              })
              wx.request({
                url: app.globalData.apiUrl + '/getWarehouseByName',
                method: 'POST',
                data: {
                  'name': res.data.data.warehouseName,
                  'unitId': 1
                },
                header: {
                  'qcmappversion': qcmappversion,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                success: (res) => {
                  if (that.judge(res.data.data)) {
                    that.setData({
                      'orderData.warehouseId': res.data.data[0].id ? res.data.data[0].id : 0,
                      'orderData.customerId': 0
                    })
                  }
                },
                fail: (e) => {
                  wx.showToast({
                    title: '查询仓库信息接口访问失败',
                    icon: 'none',
                    mask: true,
                    duration: 2500
                  })
                }
              })
            } else {
              that.setData({
                'orderData.destinationType': 0,
                'orderData.warehouseId': 0,
                'orderData.customerId': 0
              })
            }

            // 车辆id
            if (that.judge(res.data.data.carNumber)) {
              wx.request({
                url: app.globalData.apiUrl + '/getCarByCarNumber',
                method: 'POST',
                data: {
                  'carNumber': res.data.data.carNumber,
                  'unitId': 1
                },
                header: {
                  'qcmappversion': qcmappversion,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                success: (res) => {
                  if (that.judge(res.data.data)) {
                    that.setData({
                      'orderData.carId': res.data.data[0].id ? res.data.data[0].id : 0
                    })
                  }
                },
                fail: (e) => {
                  wx.showToast({
                    title: '查询车辆信息接口访问失败',
                    icon: 'none',
                    mask: true,
                    duration: 2500
                  })
                }
              })
            } else {
              that.setData({
                'orderData.carId': 0
              })
            }

            // 司机id
            if (that.judge(driverName)) {
              wx.request({
                url: app.globalData.apiUrl + '/getEmployeeByName',
                method: 'POST',
                data: {
                  'name': driverName,
                  'unitId': 1
                },
                header: {
                  'qcmappversion': qcmappversion,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                success: (res) => {
                  if (that.judge(res.data.data)) {
                    that.setData({
                      'orderData.driverId': res.data.data[0].id ? res.data.data[0].id : 0
                    })
                  }
                },
                fail: (e) => {
                  wx.showToast({
                    title: '查询司机信息接口访问失败',
                    icon: 'none',
                    mask: true,
                    duration: 2500
                  })
                }
              })
            } else {
              that.setData({
                'orderData.driverId': 0
              })
            }

            // 押运员id
            if (that.judge(surpercargoName)) {
              wx.request({
                url: app.globalData.apiUrl + '/getEmployeeByName',
                method: 'POST',
                data: {
                  'name': surpercargoName,
                  'unitId': 1
                },
                header: {
                  'qcmappversion': qcmappversion,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                success: (res) => {
                  if (that.judge(res.data.data)) {
                    that.setData({
                      'orderData.supercargoId': res.data.data[0].id ? res.data.data[0].id : 0
                    })
                  }
                },
                fail: (e) => {
                  wx.showToast({
                    title: '查询押运员信息接口访问失败',
                    icon: 'none',
                    mask: true,
                    duration: 2500
                  })
                }
              })
            } else {
              that.setData({
                'orderData.supercargoId': 0
              })
            }

          } else {
            that.setData({
              getOrderData: false
            })
          }
        },
        fail: (e) => {
          wx.showToast({
            title: '获取订单信息接口访问失败',
            icon: 'none',
            duration: 2000
          })
        }
      })
    }
  },

  // 页面主要逻辑部分--开始
  // 扫码添加
  addCylinder: function () {
    var that = this;
    that.setData({
      scanFlag: true
    })
    wx.scanCode({
      success: (res) => {
        // 此处判断散瓶、集格
        if (res.result.indexOf("/set/code/") != -1) {
          // 集格
          var setCode = res.result.indexOf("/set/code/");
          setCode = res.result.substring(setCode + 10);
          that.queryCylinderBySetId(Number(setCode));
        } else if (res.result.indexOf("0001") != -1) {
          // 散瓶
          var setId = null;
          var cylinderCode = res.result;
          var cylinderList = that.data.cylinderList;
          var cylinderNumber = cylinderCode.substring(cylinderCode.length - 11);
          if (cylinderNumber.length != 11) {
            wx.showToast({
              title: '该气瓶码长度不正确',
              icon: 'none',
              mask: true,
              duration: 2500
            })
          } else {
            if (cylinderList.includes(cylinderNumber)) {
              wx.showToast({
                title: '该气瓶已扫描',
                icon: 'none',
                mask: true,
                duration: 2500
              })
            } else {
              // 查询气瓶信息
              that.queryCylinderInfoByNumber(setId, cylinderNumber);
            }
          }
        } else {
          wx.showToast({
            title: '该码不符合规范',
            icon: 'none',
            mask: true,
            duration: 2500
          })
        }
        if (that.data.scanFlag) {
          setTimeout(that.addCylinder, 2000);
        }
      },
      fail: (e) => {
        // 退出扫码动作或调取扫码动作失败
        that.setData({
          scanFlag: false
        })
      }
    })
  },

  // 根据集格编号查询集格下绑定的气瓶
  queryCylinderBySetId: function (setId) {
    var that = this;
    var qcmappversion = that.data.qcmappversion;
    var setList = that.data.setList;
    wx.request({
      url: app.globalData.apiUrl + '/getCylinderBySetId',
      method: 'GET',
      data: {
        'setId': setId
      },
      header: {
        'qcmappversion': qcmappversion
      },
      success: (res) => {
        if ((res.data.data != null) || (res.data.data != [])) { // 集格下有绑定气瓶，集格计数
          if (setList.includes(setId)) {
            wx.showToast({
              title: '该集格已扫描',
              icon: 'none',
              mask: true,
              duration: 2500
            })
          } else {
            setList.push(setId);
            that.setData({
              setList: setList
            })
            that.countData();
            wx.showToast({
              title: "集格编号：" + setId + " 绑定气瓶数量：" + res.data.data.length,
              icon: 'none',
              mask: true,
              duration: 2500
            })
            if (res.data.data.length > 0) {
              for (let i = 0; i < res.data.data.length; i++) {
                let cylinderNumber = res.data.data[i].cylinderNumber;
                that.queryCylinderInfoByNumber(setId, cylinderNumber);
              }
            } else {
              wx.showToast({
                title: 'ID为 ' + setId + ' 的集格未绑定气瓶',
                icon: 'none',
                mask: true,
                duration: 2500
              })
            }
          }
        } else {
          wx.showToast({
            title: 'ID为 ' + setId + ' 的集格未绑定气瓶',
            icon: 'none',
            mask: true,
            duration: 2500
          })
        }
      },
      fail: (e) => {
        wx.showToast({
          title: '查询集格接口访问失败',
          icon: 'none',
          mask: true,
          duration: 2500
        })
      }
    })
  },

  // 根据气瓶二维码编号查询气瓶信息
  queryCylinderInfoByNumber: function (setId, cylinderNumber) {
    var that = this;
    var qcmappversion = that.data.qcmappversion;
    if (setId == null) {
      let cylinderList = that.data.cylinderList;
      let allCylinderList = that.data.allCylinderList;
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
            if (util.checkEmpty(res.data.data.setId)) {
              let setList = that.data.setList;
              if (setList.includes(res.data.data.setId)) {
                wx.showToast({
                  title: '该集格已扫描',
                  icon: 'none',
                  mask: true,
                  duration: 2500
                })
              } else {
                that.queryCylinderBySetId(res.data.data.setId);
              }
            } else {
              let cylinderId = res.data.data.id;
              let unitId = res.data.data.unitId;
              let cylinderCode = res.data.data.cylinderCode; // 气瓶码
              let cylinderTypeName = res.data.data.cylinderTypeName; // 气瓶类型名称
              let gasMediumName = res.data.data.gasMediumName; // 气瓶介质名称
              let regularInspectionDate = res.data.data.regularInspectionDate.substring(0, 7); // 气瓶下检日期
              let cylinderScrapDate = res.data.data.cylinderScrapDate.substring(0, 7); // 气瓶过期日期

              let cylinderManufacturingDate = res.data.data.cylinderManufacturingDate.substring(0, 7); // 气瓶生产日期
              let volume = res.data.data.volume; // 气瓶容积
              let nominalTestPressure = res.data.data.nominalTestPressure; // 气瓶压力
              let weight = res.data.data.weight; // 气瓶重量
              let lastFillTime = res.data.data.lastFillTime; // 气瓶最后充装时间
              let wallThickness = res.data.data.wallThickness; // 气瓶壁厚
              cylinderList.push(cylinderNumber);
              allCylinderList.push({ setId, cylinderNumber, cylinderId, unitId, cylinderCode, cylinderTypeName, gasMediumName, regularInspectionDate, cylinderScrapDate, cylinderManufacturingDate, volume, nominalTestPressure, weight, lastFillTime, wallThickness });
              that.setData({
                cylinderList: cylinderList,
                allCylinderList: allCylinderList
              })
              that.countData();
              wx.showToast({
                title: "二维码：" + cylinderNumber + " 介质：" + gasMediumName + " 过期日期：" + regularInspectionDate,
                icon: 'none',
                mask: true,
                duration: 2500
              })
            }
          } else {
            // 未查询到气瓶信息
            wx.showToast({
              title: 'ID为 ' + cylinderNumber + ' 的气瓶信息缺失',
              icon: 'none',
              mask: true,
              duration: 2500
            })
          }
        },
        fail: (e) => {
          wx.showToast({
            title: '查询气瓶接口访问失败',
            icon: 'none',
            mask: true,
            duration: 2500
          })
        }
      })
    } else {
      let setCylinderList = that.data.setCylinderList;
      let allCylinderList = that.data.allCylinderList;
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
            let cylinderScrapDate = res.data.data.cylinderScrapDate.substring(0, 7); // 气瓶过期日期

            let cylinderManufacturingDate = res.data.data.cylinderManufacturingDate.substring(0, 7); // 气瓶生产日期
            let volume = res.data.data.volume; // 气瓶容积
            let nominalTestPressure = res.data.data.nominalTestPressure; // 气瓶压力
            let weight = res.data.data.weight; // 气瓶重量
            let lastFillTime = res.data.data.lastFillTime; // 气瓶最后充装时间
            let wallThickness = res.data.data.wallThickness; // 气瓶壁厚
            setCylinderList.push({ setId, cylinderNumber, cylinderId, unitId, cylinderCode, cylinderTypeName, gasMediumName, regularInspectionDate, cylinderScrapDate, cylinderManufacturingDate, volume, nominalTestPressure, weight, lastFillTime, wallThickness });
            allCylinderList.push({ setId, cylinderNumber, cylinderId, unitId, cylinderCode, cylinderTypeName, gasMediumName, regularInspectionDate, cylinderScrapDate, cylinderManufacturingDate, volume, nominalTestPressure, weight, lastFillTime, wallThickness });
            that.setData({
              setCylinderList: setCylinderList,
              allCylinderList: allCylinderList
            })
            that.countData();
          } else {
            // 未查询到气瓶信息
            wx.showToast({
              title: 'ID为 ' + cylinderNumber + ' 的气瓶信息缺失',
              icon: 'none',
              duration: 2000
            })
          }
        },
        fail: (e) => {
          wx.showToast({
            title: '查询气瓶接口访问失败',
            icon: 'none',
            duration: 2000
          })
        }
      })
    }
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

  // 设置全局变量
  setGlobal: function () {
    var that = this;
    app.globalData.wareCylinderList = that.data.cylinderList;
    app.globalData.wareSetCylinderList = that.data.setCylinderList;
    app.globalData.wareSetList = that.data.setList;
    app.globalData.wareAllCylinderList = that.data.allCylinderList;
  },

  // 清空收发全局变量
  clearData: function () {
    var that = this;
    app.globalData.wareCylinderList = [];
    app.globalData.wareSetCylinderList = [];
    app.globalData.wareSetList = [];
    app.globalData.wareAllCylinderList = [];
    that.setData({
      cylinderList: app.globalData.wareCylinderList,
      setCylinderList: app.globalData.wareSetCylinderList,
      setList: app.globalData.wareSetList,
      allCylinderList: app.globalData.wareAllCylinderList
    })
    that.countData();
  },

  // 提交
  submitForm: function () {
    var that = this;
    var qcmappversion = that.data.qcmappversion;
    // 增加气瓶位置信息
    wx.getLocation({
      success: function (res) {
        that.setData({
          'orderData.lat': res.latitude,
          'orderData.lng': res.longitude
        })
      }
    })
    wx.showModal({
      title: '确认信息',
      content: "提交前请保证信息无误，确认提交？",
      success(res) {
        if (res.confirm) {
          if (that.data.getOrderData) {
            let setList = that.data.setList;
            let cylinderList = that.data.cylinderList;
            let setCylinderList = that.data.setCylinderList;
            let allCylinderList = that.data.allCylinderList;
            let cylinderRecordList = that.data.orderData.cylinderRecordList;
            let cylinderNum = allCylinderList.length;
            that.setData({
              'orderData.cylinderNum': cylinderNum
            })
            if (allCylinderList.length > 0) {
              for (let i = allCylinderList.length - 1; i >= 0; i--) {
                let temp = allCylinderList[i];
                // 拼接气瓶信息
                let jsonData = {};
                jsonData.cylinderId = temp.cylinderId;
                jsonData.detection = that.data.detection;
                jsonData.empty = that.data.empty;
                cylinderRecordList.push(jsonData);
              }
              that.setData({
                'orderData.cylinderRecordList': JSON.stringify(cylinderRecordList)
              })
              if ((that.judge(that.data.orderData.creator)) && (that.judge(that.data.orderData.waybillNumber))) {
                var data = that.data.orderData;
                wx.request({
                  url: app.globalData.apiUrl + '/addTransmitReceiveRecord',
                  method: 'POST',
                  data: data,
                  header: {
                    'qcmappversion': qcmappversion,
                    "Content-Type": "application/x-www-form-urlencoded",
                  },
                  success: (res) => {
                    if (res.data.msg == "成功") {
                      that.clearData();
                      that.setData({
                        disabled: true,
                        opacity: 0.3
                      })
                      wx.showToast({
                        title: '添加成功',
                        duration: 2000
                      })
                    } else {
                      wx.showToast({
                        title: '添加失败,请再次提交',
                        icon: 'none',
                        mask: true,
                        duration: 2500
                      })
                    }
                  },
                  fail: (e) => {
                    wx.showToast({
                      title: '添加收发接口访问失败,5秒后再次请求',
                      icon: 'none',
                      mask: true,
                      duration: 2500
                    })
                    setTimeout(function () {
                      that.submitForm();
                    }, 5000)
                  }
                })
              } else {
                wx.showToast({
                  title: '创建人或运单号不能为空',
                  icon: "none",
                  duration: 2000
                })
                return;
              }
            } else {
              wx.showToast({
                title: '您还未录入数据',
                icon: 'none',
                duration: 2000
              })
            }
          } else {
            wx.showToast({
              title: '未获取到运单信息，请核对运单号',
              icon: 'none',
              duration: 2000
            })
          }
        } else if (res.cancel) {
          console.log('删除取消');
        }
      }
    })
  },

  // 判断是否为空或null
  judge: function (x) {
    if ((x == "") || (x == null)) {
      return false;
    } else {
      return true;
    }
  },
  // 页面主要逻辑部分--结束

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }

})