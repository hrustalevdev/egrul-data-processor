import ProgressBar from 'progress';

export class Progress {
  private readonly _bar: ProgressBar;

  constructor(filename: string, totalFiles: number) {
    this._bar = new ProgressBar(
      `Processing "${filename}"`.padEnd(43, ' ') +
        ': [:bar] :ratexml/s :percent :etas :elapseds',
      {
        complete: '=',
        incomplete: ' ',
        width: 30,
        total: totalFiles,
      },
    );

    this.tick = this.tick.bind(this);
  }

  tick() {
    this._bar.tick();
  }
}
