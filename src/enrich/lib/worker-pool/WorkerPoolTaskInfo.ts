import { AsyncResource } from 'node:async_hooks';

export class WorkerPoolTaskInfo extends AsyncResource {
  callback: (err: Error | null, result: never) => void;

  constructor(callback: (err: Error | null, result: never) => void) {
    super('WorkerPoolTaskInfo');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    this.callback = callback;
  }

  // Метод, вызываемый по завершении задачи
  done(err: Error | null, result: never) {
    // Вызываем колбэк в асинхронном контексте
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    this.runInAsyncScope(this.callback, null, err, result);
    // Сообщаем о завершении использования данного экземпляра TaskInfo
    this.emitDestroy();
  }
}
