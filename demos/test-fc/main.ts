import {
  unstable_ImmediatePriority as ImmediatePriority,
  unstable_UserBlockingPriority as UserBlockingPriority,
  unstable_NormalPriority as NormalPriority,
  unstable_LowPriority as LowPriority,
  unstable_IdlePriority as IdlePriority,
  unstable_scheduleCallback as scheduleCallback,
  unstable_shouldYield as shouldYield,
  CallbackNode,
  unstable_getFirstCallbackNode as getFirstCallbackNode,
  unstable_cancelCallback as cancelCallback
} from 'scheduler';

type Priority =
  | typeof ImmediatePriority
  | typeof UserBlockingPriority
  | typeof NormalPriority
  | typeof LowPriority
  | typeof IdlePriority;
interface Work {
  count: number;
  priority: Priority;
}

let prevPriority: Priority = IdlePriority;
let curCb: CallbackNode | null = null;
function myScheduler() {
  // 通过优先级获取work，优先级数值越小，优先级越高
  const curWork = workList.sort((a, b) => a.priority - b.priority)?.[0];
  const firstCallback = getFirstCallbackNode();
  if (!curWork) {
    curCb = null;
    prevPriority = IdlePriority;
    if (firstCallback) {
      cancelCallback(firstCallback);
    }
    return;
  }
  const curPriority = curWork.priority;
  if (curPriority === prevPriority) {
    return;
  }
  if (firstCallback) {
    cancelCallback(firstCallback);
  }
  curCb = scheduleCallback(curWork.priority, perform.bind(null, curWork));
}

// didTimeout 表示任务是否已经过期
function perform(work: Work, didTimeout: boolean): any {
  const priority = work.priority;
  const isTaskAsync = priority !== ImmediatePriority && !didTimeout;
  while ((!isTaskAsync || !shouldYield()) && work.count) {
    work.count--;
    insertSpan(priority, work.count + '');
  }

  prevPriority = work.priority;
  // 退出循环有两种可能：1.任务中断；2.任务完成
  if (!work.count) {
    prevPriority = IdlePriority;
    curCb = null;
    const index = workList.indexOf(work);
    if (index !== -1) {
      console.log('移除work', work);
      workList.splice(index, 1);
      console.log('当前workList', JSON.stringify(workList));
    }
  }
  const prevCb = curCb;
  myScheduler();
  const newCb = curCb;
  if (work.count && prevCb === newCb && newCb) {
    return perform.bind(null, work);
  }
}

function insertSpan(priority: number, content: string) {
  const div = document.createElement('div');
  const className =
    {
      [ImmediatePriority]: 'ImmediatePriority',
      [UserBlockingPriority]: 'UserBlockingPriority',
      [NormalPriority]: 'NormalPriority',
      [LowPriority]: 'LowPriority'
    }[priority] || '';
  div.classList.add(className);
  div.innerText = content;
  box?.appendChild?.(div);
  doLongRunningJob(1000000);
}

function doLongRunningJob(len: number) {
  let sum = 0;
  while (len) {
    sum += len;
    len--;
  }
  return sum;
}

const box = document.querySelector('.box');
const btns = document.querySelector('.btns');
const workList: Work[] = [];
[ImmediatePriority, UserBlockingPriority, NormalPriority, LowPriority]
  .reverse()
  .map((item) => {
    const btn = document.createElement('button');
    btn.innerText =
      {
        [ImmediatePriority]: 'ImmediatePriority',
        [UserBlockingPriority]: 'UserBlockingPriority',
        [NormalPriority]: 'NormalPriority',
        [LowPriority]: 'LowPriority'
      }[item] || '';
    btn.onclick = () => {
      const work: Work = {
        count: 100,
        priority: item as Priority
      };
      workList.push(work);
      myScheduler();
    };
    btns?.appendChild?.(btn);
  });
