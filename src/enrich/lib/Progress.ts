import ProgressBar from 'progress';

export class Progress {
  private readonly _bar: ProgressBar;

  constructor(folderName: string, totalFiles: number) {
    this._bar = new ProgressBar(
      `Processing "${folderName}" folder: ` +
        '[:bar] :current/:total :percent :etas :elapseds; last_parsed: :file \n',
      {
        complete: '=',
        incomplete: ' ',
        width: 30,
        total: totalFiles,
      },
    );

    this.tick = this.tick.bind(this);
  }

  tick(token?: { file: string }) {
    this._bar.tick(token);
  }
}
