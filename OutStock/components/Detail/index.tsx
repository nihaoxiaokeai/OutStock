import * as React from "react";
import * as qs from "query-string";
import * as styles from "./index.scss";
import * as api from "../../../../services/outStock";
import BroswerHistory from '@utils/history'
import { withRouter, Redirect  } from "react-router-dom";
import Tips from "../../components/Tips";
import TipsDialog from "../../../../components/TipsDialog";
const { useState, useEffect } = React;
export default withRouter(React.memo((props) => {

  const [error, setError] = useState(null)
  const [msgDetail, setMsgDetail] = useState(null)
  const [msgItem, setMsgItem] = useState(null)
  const [orderNum, setOrderNum] = useState(null)
  const [isSaveBtn, setIsSaveBtn] = useState(false)
  const [showTips, setShowTips] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [userBtn, setUserBtn] = useState(false)
  const [ loading, setLoading ] = useState(false)

  useEffect(() => {
    if (!history.state || !history.state.state) {return}
    const { msgid, msgSeq } = history.state.state
    setLoading(true)
    const p = Promise.race([
      api.getOutStockDetailController({msgid, msgSeq}, true).then((res: any) => {
        setLoading(false)
        if (res.errCode === 400) {
          setMsgDetail(null)
          return
        }
        const data = res;
        const { importanceDegree, packetNum, lastWeekSales, sugOrderNum, mrStock, rsStock, promotionTime, orderNum } = data.invWarnMsgDtlDTO;
        document.title = data.pageTitle
        setUserBtn(data.canSubmitOrder)
        setMsgDetail(data.invWarnMsgDtlDTO)
        if (history.state) {
            setOrderNum(history.state.state.orderNum)
            setIsSaveBtn(!!history.state.state.orderNum)
        } else  {
          setOrderNum(orderNum)
        }
        const arr = Array.of(importanceDegree, packetNum, lastWeekSales, sugOrderNum, mrStock, rsStock, promotionTime)
        msgItemList.map((item, index) => {
          msgItemList[index].value = arr[index]
        })
        setMsgItem(msgItemList)
      })
    ])
    p.then(res => {
      setLoading(false)
      // console.log(res);
    }).catch(err => {
      setLoading(false)
      setError(err.message);
    })
  }, [])

  const msgItemList = [
    { title: '重要程度', icon: 'icon_bill', value: '' },
    { title: '箱包数', icon: 'icon_whole', value: '' },
    { title: '上周销售量', icon: 'icon_aweek', value: '' },
    { title: '建议订货量', icon: 'icon_number', value: '' },
    { title: '实时库存', icon: 'icon_day', value: '' },
    { title: '合理库存', icon: 'icon_onthe', value: '' },
    { title: '促销日期', icon: 'icon_date', value: '' },
  ]

  
  const handleBack = () => {
    BroswerHistory.push({
      pathname: `/outstock`,
      search: `${location.search}`
    });
  }
  // 设定单个订货量
  const handleSubmit1 = () => {
    if (!/^(\+?[1-9][0-9]*)$/.test(orderNum)) {
      setIsSaveBtn(false)
      return
    }
    // 判断取整
    let num = orderNum / msgDetail.packetNum
    // 不符合倍数
    if (!/^(\+?[1-9][0-9]*)$/.test(num.toString())) {
      if (num < 1) {
        setOrderNum(msgDetail.packetNum)
        return
      }
      setShowTips(true)
      openChangePopupTimer()
      num = Math.floor(num)
      const tempNum = msgDetail.packetNum * (num + 1)
      setOrderNum(tempNum)
      return
    }
    // 当前订货量超出建议订货量，请确认！
    if (isSaveBtn && (msgDetail.sugOrderNum < orderNum)) {
      setShowDialog(true)
      return
    }
    const msgSeq = msgDetail.msgSeq
    BroswerHistory.push({
      pathname: `/outstock`,
      search: `${location.search}`,
      state: {
        check: 'ALL',
        msgSeq: msgSeq,
        orderNum: orderNum,
        local: true
      }
    });
  }
  
  const openChangePopupTimer = () => {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      setShowTips(false)
    }, 2000)
  }

  // 更新订单数量
  const handelChange = (e) => {
    const orderNum = e.currentTarget.value.trim()
    setOrderNum(parseInt(orderNum))
    if (!/^(\+?[1-9][0-9]*)$/.test(orderNum)) {
      setIsSaveBtn(false)
      return
    }
    setIsSaveBtn(true)
  }

  const back = () => {
    BroswerHistory.push({
      pathname: `/outstock`,
      search: `${location.search}`
    });
  }

  const onDoalogOk = () => {
    const msgSeq = msgDetail.msgSeq
    BroswerHistory.push({
      pathname: `/outstock`,
      search: `${location.search}`,
      state: {
        check: 'ALL',
        msgSeq: msgSeq,
        orderNum: orderNum,
        local: true
      }
    });
  }

  return (
    <>
      {error ? (
        <div>请刷新...</div>
      ) :
      loading ? <div>正在努力加载中...</div>
      :
      (msgDetail ? 
        <>
          <Tips
            visible={showTips}
            content='当前整箱数量为小数，将向上取整为整箱订货量。'
          />
          <TipsDialog
              visible={showDialog}
              title='温馨提示'
              content='当前订货量超出建议订货量，请确认！'
              onCancel={() => { setShowDialog(false) }}
              onOk={onDoalogOk}
            /> 
          <div className={styles.detailContents}>
            <div className={styles.panel}>
              <div className={styles.title}>{msgDetail.itemName} {msgDetail.itemSpec}</div>
              <div className={styles.f14}>条码：{msgDetail.itemBarcode}</div>
              <div className={styles.nameWrap}>
                <img style={{ width: '25px' }} src={require('assets/images/icon_business.png')} />
                <div className={styles.ml5}>
                  <div className={styles.tip}>供应商编号：{msgDetail.supId}</div>
                  <div className={styles.f14}>{msgDetail.supName}</div>
                </div>
              </div>
              <div className={styles.itemWrap}>
                {
                  msgItem && msgItem.map((item, index) => {
                    return (
                      <div className={index === (msgItem.length - 1) ? `${styles.item} ${styles.widthFull}` : `${styles.item}`} key={index}>
                        <img style={{ width: '25px' }} src={item.icon && require(`assets/images/${item.icon}.png`)} />
                        <div className={styles.ml5}>
                          <div className={styles.tip}>{item.title}</div>
                          <div className={styles.f14}>{item.value}</div>
                        </div>
                      </div>
                    )
                  })
                }
              </div>
              <div className={styles.orderWrap}>
                <div className={styles.label}>订货数量（整包倍数）</div>
                <div className={styles.orderNum}>
                  <div className={styles.value}>
                    {
                      msgDetail.orderSuccess ? <span className={styles.placeholder}>{orderNum}</span>
                      : <input className={styles.input} type="number" placeholder="请输入订货数量" value={orderNum || ''} onChange={handelChange.bind(this)} />
                    }
                  </div>
                  <div className={styles.full}>
                    {
                      !msgDetail.orderSuccess && <img style={{ width: '28px' }} src={require('assets/images/icon_edit.png')} />
                    }
                  </div>
                </div>
              </div>
            </div> 
            <div className={styles.bottom}>
              {
                 !userBtn ? <button className={`${styles.notBtn} ${styles.btn}`} onClick={() => handleBack()}>返回</button>
                 : msgDetail.orderSuccess ? <button className={`${styles.notBtn} ${styles.btn}`} onClick={() => handleBack()}>返回</button>
                 : <button className={isSaveBtn ? `${styles.submitBtn} ${styles.btn}` : `${styles.notBtn} ${styles.btn}`} onClick={() => handleSubmit1()}>保存</button>
              }
            </div>
          </div>
        </>:
        <div className={styles.noData}>
          <img style={{ width: '50px' }} src={require('assets/images/icon_nodata_red.png')} />
          <div className={styles.nodataTips}>暂无数据</div>
          <div className={styles.nodataBtn}>
            <button className={styles.saveBtn} onClick={back}>返回</button>
          </div>
        </div>
      )}
    </>
  );
}));
