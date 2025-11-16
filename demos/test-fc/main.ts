const btn = document.querySelector('button');
const box = document.querySelector('.box');
interface Work {
  count: number;
}
function myScheduler() {
  const curWork = workList.pop();
  if (curWork) {
    perform(curWork);
  }
}

function perform(work: Work) {
  while (work.count) {
    work.count--;
    insertSpan();
  }
  myScheduler();
}

function insertSpan() {
  const div = document.createElement('div');
  box?.appendChild?.(div);
}

const workList: Work[] = [];

if (btn) {
  btn.onclick = () => {
    const work = {
      count: 100
    };
    workList.unshift(work);
    myScheduler();
  };
}
