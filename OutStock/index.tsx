import * as React from "react";
import * as qs from "query-string";
import TipsDialog from "../../components/TipsDialog";
import Tips from "./components/Tips";
import * as styles from "./index.scss";
import ItemCell from "./components/ItemCell";
import * as api from "../../services/outStock";
import BroswerHistory from '@utils/history';
import { withRouter, Route } from "react-router-dom";
import Detail from './components/Detail';

const { useState, useEffect, useRef, useLayoutEffect } = React;

export default withRouter(
  React.memo(() => {

  const [error, setError] = useState(null)
  const [messageList, setMessageList] = useState(null)
  const [checkLen, setCheckLen] = useState(null)
  const [showDialog, setShowDialog] = useState(false)
  const [showTips, setShowTips] = useState(false)
  const [tipsContent, setTipsContent] = useState('')
  const [showOrderDialog, setShowOrderDialog] = useState(false)
  const [dialogContent, setDialogContent] = useState('')
  const [checked, setChecked] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [userBtn, setUserBtn] = useState(false)
  const [msgId, setMsgId] = useState('')
  

  useEffect(() => {
    const params = qs.parse(window.location.search);
    const { msgid } = params;
    // const msgid = '47afc2e3-2352-4c1c-92b2-9ee370537518'
    localStorage.setItem('messageList', null)
    setMsgId(msgid);
    fetchData(msgid)
  }, [])


  useLayoutEffect(() => {
    const qsa = window.location.pathname.split('/')
    if (qsa.length < 4) {
      setShowDetail(false)
      if (history.state && history.state.state) {
        const { msgSeq, orderNum, local } = history.state.state
        getHistoryData(msgSeq, orderNum, local)
        history.state.state = null
        return
      }
      scrollToAnchor('screens')
    } else {
      setShowDetail(true)
    }
  })

  const getHistoryData = (msgSeq, orderNum, local) => {
    const persisted = JSON.parse(localStorage.getItem('messageList'))
    const list = persisted && persisted.filter(item => {
      if(item.msgSeq === msgSeq) {
        item.orderNum = orderNum
        item.local = local
      }
      return item
    })
    setLoadMessageList(list)
  }

  const setLoadMessageList = (list) => {
    setMessageList([...list])
    localStorage.setItem('messageList', JSON.stringify(list))
  } 

  const fetchData = (msgid) => {
    if(history.state) {
      history.state.state = null
    }
    localStorage.removeItem('messageList')
    const p = Promise.race([
      api.getOutStockController({msgid}, true).then((res: any) => {
        document.title = res.pageTitle
        setUserBtn(res.canSubmitOrder)
        setLoadMessageList(res.invWarnMsgResDTOS)
        setCheckLen(0)
      })
    ])
    p.then(res => {
      // console.log(res);
    }).catch(err => {
      setError(err.message)
    })
  }

  // 跳转详情
  const handleDetail = (index) => {
    if(history.state) {
      history.state.state = null
    }
    messageList.forEach(item => {
      item.active = false
    });
    messageList[index].active = true
    setLoadMessageList(messageList)
    const msgSeq = messageList[index].msgSeq
    const msgid = messageList[index].msgid
    const orderNum = messageList[index].orderNum
    setShowDetail(true)
    BroswerHistory.push({
      pathname: `/outstock/${msgid}${location.search}`,
      state: {
        msgSeq: msgSeq,
        msgid: msgid,
        orderNum: orderNum || null
      }
    });
  }

  // 全选
  const handleChange = () => {
     // 全不选
    if (checkLen > 0) {
      messageList.filter(item => {
        if (item.check) {
          item.check = false
          return item
        }
      })
      setCheckLen(null)
      return
    }
    // 全选
    const checkList = messageList.filter(item => {
      if (!item.orderSuccess) {
        item.check = true
        return item
      }
    })
    setCheckLen(checkList.length)
  }

  const checkAll = (messageList, key) => {
    const checkList = [], tempList = [];
    messageList.forEach(item => {
      if (!item.orderSuccess) {
        item.check = key
        checkList.push(item)
      }
      tempList.push(item)
    });
    setCheckLen(checkList.length)
    return tempList
  }

  // 校验
  const validate = () => {
    const validateCheck = messageList.filter(item => {
      return item.check && item.orderNum && item.local
    })
    return validateCheck.length
  }

  // 设定订货量
  const handleSubmit = () => {
    if (!userBtn) {
      return
    }
    const checkeList = messageList.filter(item => {
      return item.check && item.orderNum && item.local
    })
    // 已选择订单
    if (checkeList.length > 0) {
      // 校验是否填写订单数量
      let tempChecked = null
      if (validate() > 0) {
        // 提示list
        tempChecked = messageList.filter(item => {
          if (item.check && item.local) {
            return item
          }
        })
        setChecked(tempChecked)
        setShowOrderDialog(true)
        return
      }
      setDialogContent('请输入订货数量。')
      setShowDialog(true)
      return
    }

    // 未选择订货单并且无输入订货量，提示
    setShowTips(true)
    setTipsContent('请选择需要订货的商品')
    openChangePopupTimer()
  }

  const openChangePopupTimer = () => {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      setShowTips(false)
    }, 2000)
  }

  const onSumbit = () => {
    const postData = checked.map(item => {
      if (item.check && item.local) {
        return {
           msgid: item.msgid,
           msgSeq: item.msgSeq,
           orderNum: item.orderNum,
           itemBarcode: item.itemBarcode,
         }
      }
    })
    const params = {
      msgid: msgId,
      data: postData
    }
    // 请求
    const p = Promise.race([
      api.postSubmitOrderController(params, true).then((res: any) => {
        setShowOrderDialog(false)
        setShowTips(false)
        // fetchData(msgId, msgFlag)
         if (res && (res.errCode === 506)) {
          setUserBtn(false)
          setDialogContent(res.errMsg)
          setShowDialog(true)
          return
        }
        
        if (res && (res.errCode === 505)) {
          setDialogContent(res.errMsg)
          setShowDialog(true)
          return
        }
        if (res && (res.errCode === 400)) {
          setDialogContent(res.errMsg)
          setShowDialog(true)
          return
        }

        messageList.map((item, index) => {
          params.data.map((_item, _index) => {
            if(_item.msgSeq === item.msgSeq) {        
              messageList[index].check = false
              messageList[index].orderSuccess = true
              setLoadMessageList(messageList)
            }
          })
        })

        setTipsContent('提交成功')
        setShowTips(true)
        openChangePopupTimer()
        fetchData(msgId)
        setCheckLen(0)
      })
    ])
    p.then(res => {
      console.log(res)
    }).catch(err => {
      console.log(err)
    })
  }

  const handleCheck = (index) => {
    const checked = !messageList[index].check
    messageList[index].check = checked
    setLoadMessageList(messageList)
  }

  const handleSave = (data) => {
    const { msgSeq, orderNum, type } = data
    let list = messageList
    const index = list.findIndex(item => {
      return item.msgSeq === msgSeq
    })
    const { packetNum, sugOrderNum } = list[index]
    if (type === 'save') {
      // 订货量是否匹配
      isOrderNum(orderNum, packetNum, sugOrderNum, index)
    } else {
      let tempList = messageList
      tempList[index].orderNum = orderNum
      tempList[index].local = true
      // tempList = checkAll(tempList, true)
      setLoadMessageList(tempList) 
    }
  }

  const isOrderNum = (orderNum, packetNum, sugOrderNum, index) => {
    if (!/^(\+?[1-9][0-9]*)$/.test(orderNum)) {
      setShowTips(true)
      setTipsContent('请输入数字')
      openChangePopupTimer()
      return
    }
    // 判断取整
    let num = orderNum / packetNum
    // 不符合倍数
    if (!/^(\+?[1-9][0-9]*)$/.test(num.toString())) {
      if (num < 1) {
        orderNum = packetNum
      } else {
        setShowTips(true)
        setTipsContent('当前整箱数量为小数，将向上取整为整箱订货量。')
        openChangePopupTimer()
        num = Math.floor(num)
        const tempNum = packetNum * (num + 1)
        orderNum = tempNum
      }
     
    } else {
      if (sugOrderNum < orderNum) {
        setDialogContent('当前订货量超出建议订货量，请确认！')
        setShowDialog(true)
        return
      }
    }
    let tempList = messageList
    tempList[index].orderNum = orderNum
    tempList[index].local = true
    // tempList = checkAll(tempList, true)
    setLoadMessageList(tempList) 
  }

  const scrollToAnchor = (anchorName) => {
    if (anchorName) {
        // 找到锚点
        let anchorElement = document.getElementById(anchorName)
        // 如果对应id的锚点存在，就跳转到锚点
        if(anchorElement) { 
          anchorElement.scrollIntoView({block: 'center'})
       }
    }
  }

  return (
    error ? (
      <div>请刷新...</div>
    ) : (
      <div className={styles.contents}>
        {
       !showDetail ? <>
        <Tips
          visible={showTips}
          content={tipsContent}
        />
        <TipsDialog
          visible={showOrderDialog}
          title='确认订单'
          onCancel={() => { setShowOrderDialog(false) }}
          onOk={() => onSumbit()}
        > 
          {
            checked && checked.map((item, index) => {
              return (
                <div className={index === (checked.length - 1) ? `${styles.checkTips} ${styles.noBorder}` : `${styles.checkTips}`}>
                  <div className={styles.label} style={{ flex: 1 }}>
                    <div>{item.itemName}</div>
                    <div style={{ color: '#999', fontSize: '12px', marginTop: '2px' }}>条码：{item.itemBarcode}</div>
                  </div>
                  <div className={styles.full} style={{ fontSize: '16px', marginLeft: '5px', wordBreak: 'break-all' }}>{item.orderNum}</div>
                </div>
              )
            })
          }
        </TipsDialog>
        <TipsDialog
          visible={showDialog}
          title='温馨提示'
          content={dialogContent}
          onCancel={() => { setShowDialog(false) }}
          onOk={() => { setShowDialog(false) }}
        /> 
        <div className={styles.panel}>
          {
            messageList && (messageList.map((item, index) => {
              // var active = index === checkIndex && true
              return (
                <div key={index}>
                  <ItemCell 
                    data={item} 
                    orderNum={item.orderNum}
                    handleSave={(data) => handleSave(data)} 
                    handleDetail={() => handleDetail(index)} 
                    handleClick={() => handleCheck(index)} />
                </div>
                )
            }))
          }
        </div>
        <div className={styles.bottom}>
          <div className={styles.absolute}>
            <div className={styles.bottomLeft} onClick={() => handleChange()}>
              <div className={styles.checkBox} ><img src={require(`assets/images/${checkLen > 0 ? 'icon_check' : 'icon_circle'}.png`)}/></div>
              &nbsp;&nbsp;全选&nbsp;
              {
                checkLen > 0 &&  <span>共<span style={{ color: '#ef4142' }}>{checkLen}</span>条记录</span>
              }
            </div>
            <div className={styles.bottomRight}>
              <button className={userBtn ? `${styles.submitBtn} ${styles.btn}` : `${styles.noBtn} ${styles.btn}`} onClick={() => handleSubmit()}>生成订单</button>
            </div>
            </div>
        </div>
        </>
        : <Route 
            path="/outstock/:id" 
            component={Detail} 
          />
            }
      </div>
      
    )
  );
}));
