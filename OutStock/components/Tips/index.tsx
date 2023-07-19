import * as React from "react";
import * as styles from "./index.scss";

interface Props {
  visible: boolean,
  content: any
}
// const { useState, useEffect } = React;

export default React.memo((props: Props) => {
  const { visible, content } = props
  // const [timeVisible, setTimeVisible] = useState(false)

  // useEffect(() => {
  //   setTimeVisible(!visible)
  //   openChangePopupTimer()
  // })

  // const openChangePopupTimer = () => {
  //   const interval = 3000;
  //   // debugger
  //   visible
  //   clearTimeout(this.timer);
  //   setTimeout(() => {
  //     setTimeVisible(false)
  //   }, 1000)
  // }

  return (
    <>
      {(visible) && <>
        <div className={styles.mask}></div>
        <div className={styles.tips}>
          <div className={styles.wrap}>
            <div className={styles.content}>
              <div>{content}</div>
            </div>
          </div>
        </div>
      </>
      }
    </>
  );
});
