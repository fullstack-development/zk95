import { Property, newAtom } from '@frp-ts/core';
import { injectable } from '@mixer/injectable';
import { mapProperty } from '@mixer/utils';

type NotifyMessage = {
  message: string;
};

type NotifierModel = {
  messageCount$: Property<number>;
  notify: (message: string) => void;
};

export const mkNotifierModel = injectable((): NotifierModel => {
  const messagesQueue$ = newAtom<NotifyMessage[]>([]);
  const messageCount$ = mapProperty(messagesQueue$, (queue) => queue.length);

  const notify = (message: string) => {
    messagesQueue$.modify((prevQueue) => [{ message }, ...prevQueue]);
  };

  return {
    messageCount$,
    notify,
  };
});
