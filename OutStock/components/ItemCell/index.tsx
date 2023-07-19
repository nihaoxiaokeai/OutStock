import * as React from "react";
import * as styles from './index.scss';
import { any } from "prop-types";

interface IProps {
  data: any,
  active?: any,
  handleDetail?: any,
  handleClick?: any,
  handleSave?: any,
  orderNum?: any,
}

const { useEffect } = React
export default React.memo((props: IProps) => {
  const { data, handleDetail, handleClick, handleSave, orderNum } = props;
  const { useState} = React;
  const [checked, setChecked] = useState(false)
  const [ showSaveBtn, setSaveBtn ] = useState(null)
  const [localOrderNum, setLocalOrderNum] = useState(0)

  useEffect(() => {
    if (data.orderNum) {
      setLocalOrderNum(data.orderNum)
    }
  })
  
  const handleCheck = (e) => {
    setChecked(!data.check)
    handleClick(e)
  }

  const handleShowBtn = (e) => {
    const { dataset, value } = e.currentTarget
    const msgSeq = +dataset.msgseq
    setLocalOrderNum(value)
    setSaveBtn(msgSeq)
    const temp = {msgSeq, orderNum: value}
    handleSave(temp)
  }

  const save = () => {
    const temp = {msgSeq: showSaveBtn, orderNum: localOrderNum, type: 'save'}
    handleSave(temp)
  }

  return (
    <>
      <div className={styles.con}>
        <div className={styles.item}>
          {
            data.orderSuccess && <div className={styles.subscript}>已订货</div>
          }
          <div className={styles.itemLeft}>
            <div className={styles.sort}>{data.msgSeq}.</div>
            {
              data.orderSuccess ? <img className={styles.checkBox} src={require('assets/images/icon_uncheck.png')} />
              : data.check ? <img className={styles.checkBox} onClick={handleCheck} src={require('assets/images/icon_check.png')} />
              : <img onClick={handleCheck} className={styles.checkBox} src={require('assets/images/icon_circle.png')} />
            }
          </div>
          <div className={styles.itemRight}>
            
            <div className={styles.title} onClick={handleDetail}>{data.itemName} {data.itemSpec}</div>
            {
              data.active && <div id='screens'></div>
            }
            <div className={styles.codeWrap} onClick={handleDetail}>
              <div>条码：{data.itemBarcode}</div>
              <div className={styles.codeFull}>类别：{data.itemInclass}</div>   
            </div>
            <div className={`${styles.stockWrap} ${styles.borderTop}`} onClick={handleDetail}>
              <div className={styles.stockItem}>
              <img style={{ width: '25px' }} src={require('assets/images/icon_day.png')} />
              <div className={styles.ml5}>
                <div className={styles.tip}>实时库存</div>
                <div className={styles.f14}>{data.mrStock}</div>
              </div>
            </div>
            <div className={styles.stockItem}>
              <img style={{ width: '25px' }} src={require('assets/images/icon_onthe.png')} />
              <div className={styles.ml5}>
                <div className={styles.tip}>合理库存</div>
                <div className={styles.f14}>{data.rsStock}</div>
              </div>
            </div>
            </div>
            <div className={`${styles.stockWrap} ${styles.borderBottom}`} onClick={handleDetail}>
              <div className={styles.stockItem}>
                <img style={{ width: '25px' }} src={require('assets/images/icon_number.png')} />
                <div className={styles.ml5}>
                  <div className={styles.tip}>建议订货量</div>
                  <div className={styles.f14}>{data.sugOrderNum}</div>
                </div>
              </div>
              <div className={styles.stockItem}>
                <img style={{ width: '25px' }} src={require('assets/images/icon_whole.png')} />
                <div className={styles.ml5}>
                  <div className={styles.tip}>箱包数</div>
                  <div className={styles.f14}>{data.packetNum}</div>
                </div>
            </div>

            </div>
            <div className={styles.orderInputWrap}>
              <div className={styles.label}>订单数量：&nbsp;
                {
                  data.orderSuccess ? 
                  <span className={styles.placeholder}>{data.orderNum}</span>
                  :
                  // ?  <span className={styles.value}>{data.orderNum}</span>
                  // <span className={styles.value}>{data.orderNum}</span>
                  <input className={styles.input} type="number" placeholder="请输入订货数量" value={localOrderNum == 0 ? '' : localOrderNum} data-msgseq={data.msgSeq} onChange={(e) => {handleShowBtn(e)}} />
                  // <span className={styles.placeholder}>未输入</span>
                }
              </div>
              <div className={styles.full}>
                {
                  !data.orderSuccess &&
                  showSaveBtn === data.msgSeq ? <button className={styles.saveBtn} onClick={save}>保存</button>
                  : <img style={{ width: '28px' }} src={require('assets/images/icon_edit_grey.png')} />
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
})