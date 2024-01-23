import { EventEmitter } from 'node:events';
import { Worker } from 'node:worker_threads';

import { WorkerPoolTaskInfo } from './WorkerPoolTaskInfo';

const kTaskInfo = Symbol('kTaskInfo');
const kWorkerFreedEvent = Symbol('kWorkerFreedEvent');

export class WorkerPool extends EventEmitter {
  numThreads: number;
  workers: Worker[];
  freeWorkers: Worker[];
  tasks: {
    // Аргументы задачи
    task: string;
    // Вызываемый по завершении колбэк
    callback: (err: Error | null, result: never) => void;
  }[];

  constructor(numThreads: number, workerPath: string) {
    super();
    this.numThreads = numThreads;
    this.workers = [];
    this.freeWorkers = [];
    this.tasks = [];

    // Инициализация пула воркеров
    for (let i = 0; i < numThreads; i++) this.addNewWorker(workerPath);

    // Обработчик события освобождения воркера
    this.on(kWorkerFreedEvent, () => {
      // Если есть ожидающие задачи, обрабатываем следующую
      if (this.tasks.length > 0) {
        const { task, callback } = this.tasks.shift()!;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        this.runTask(task, callback);
      }
    });
  }

  // Добавление нового воркера в пул
  addNewWorker(workerPath: string) {
    const worker = new Worker(workerPath);

    // Обработчик успешного завершения задачи в воркере
    worker.on('message', (result) => {
      // Вызываем метод done у соответствующего TaskInfo
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      worker[kTaskInfo].done(null, result);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      worker[kTaskInfo] = null;
      // Помечаем воркера как свободного
      this.freeWorkers.push(worker);
      // Сообщаем о событии освобождения воркера
      this.emit(kWorkerFreedEvent);
    });

    // Обработчик ошибки в воркере
    worker.on('error', (err) => {
      // Если есть связанный TaskInfo, вызываем его done с ошибкой
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      if (worker[kTaskInfo]) worker[kTaskInfo].done(err, null);
      // В противном случае, сообщаем об ошибке
      else this.emit('error', err);

      // Удаляем воркера из списка и создаем нового для замены
      this.workers.splice(this.workers.indexOf(worker), 1);
      this.addNewWorker(workerPath);
    });

    // Добавляем воркера в списки и сообщаем о событии освобождения
    this.workers.push(worker);
    this.freeWorkers.push(worker);
    this.emit(kWorkerFreedEvent);
  }

  // Запуск задачи в воркере
  runTask(task: string, callback: (err: Error | null, result: never) => void) {
    // Если нет свободных воркеров, ждем
    if (this.freeWorkers.length === 0) {
      this.tasks.push({ task, callback });
      return;
    }

    // Получаем свободного воркера
    const worker = this.freeWorkers.pop()!;
    // Создаем новый TaskInfo для связи с задачей
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    worker[kTaskInfo] = new WorkerPoolTaskInfo(callback);
    // Отправляем задачу в воркер
    worker.postMessage(task);
  }

  // Завершение работы всех воркеров
  close() {
    for (const worker of this.workers) worker.terminate();
  }
}
