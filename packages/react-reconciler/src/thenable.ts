import {
  Thenable,
  PendingThenable,
  FulfilledThenable,
  RejectedThenable
} from 'shared/ReactTypes';

export const SuspenseException = new Error(
  '这个不是真实的错误，而是Suspense工作的一部分。如果你捕获到了这个错误，请把它继续抛出去'
);

let suspendedThenable: Thenable<any> | null = null;

export function getSuspenseThenable(): Thenable<any> {
  if (!suspendedThenable) {
    throw new Error('suspendedThenable不应该为空，这个是一个bug');
  }
  const thenable = suspendedThenable;
  suspendedThenable = null;
  return thenable;
}

export function noop() {}

export function trackUsedThenable<T>(thenable: Thenable<T>) {
  switch (thenable.status) {
    case 'fulfilled':
      return thenable.value;
    case 'rejected':
      throw thenable.reason;
    default:
      if (typeof thenable.status === 'string') {
        // 已追踪
        thenable.then(noop, noop);
      } else {
        const pending = thenable as unknown as PendingThenable<T, void, any>;
        pending.status = 'pending';

        pending.then(
          (value: T) => {
            const fulfilled = pending as unknown as FulfilledThenable<
              T,
              void,
              any
            >;
            fulfilled.status = 'fulfilled';
            fulfilled.value = value;
          },
          (err) => {
            const rejected = pending as unknown as RejectedThenable<
              T,
              void,
              any
            >;
            rejected.status = 'rejected';
            rejected.reason = err;
          }
        );
      }
      break;
  }

  suspendedThenable = thenable;
  throw SuspenseException;
}
