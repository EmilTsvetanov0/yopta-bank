const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const fs = require('fs').promises;

const CONFIG = {
    filePath: './data.json',
    interval: 3000
};

if (isMainThread) {
    let cachedData = null;

    const worker = new Worker(__filename, {
        workerData: CONFIG
    });

    worker
        .on('message', data => {
            cachedData = data;
            console.log('Данные обновлены:', cachedData);
        })
        .on('error', err => console.error('Worker error:', err))
        .on('exit', code => {
            if (code !== 0) console.error(`Worker stopped with exit code ${code}`);
        });

    setInterval(() => {
        console.log('Текущие данные:', cachedData);
    }, 1000);

} else {
    const updateData = async () => {
        try {
            const raw = await fs.readFile(workerData.filePath, 'utf8');
            const data = JSON.parse(raw);
            parentPort.postMessage(data);
        } catch (err) {
            console.error(`Ошибка чтения файла (${workerData.filePath}):`, err.message);
        }

        setTimeout(updateData, workerData.interval);
    };

    updateData();
}