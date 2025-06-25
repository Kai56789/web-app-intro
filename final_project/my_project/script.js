document.addEventListener('DOMContentLoaded', () => {
    const quakeList = document.getElementById('quake-list');
    const addQuakeForm = document.getElementById('add-quake-form');
    const dateInput = document.getElementById('date');
    const locationInput = document.getElementById('location');
    const magnitudeInput = document.getElementById('magnitude');
    const depthInput = document.getElementById('depth');

    // 地震データ一覧を取得して表示する関数
    async function fetchQuakes() {
        try {
            const response = await fetch('/quakes');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const quakes = await response.json();
            quakeList.innerHTML = '';
            if (quakes.length === 0) {
                quakeList.innerHTML = '<li>記録された地震はありません。</li>';
            } else {
                quakes.forEach(q => {
                    const li = document.createElement('li');
                    li.textContent = `日時: ${q.date}, 場所: ${q.location}, マグニチュード: ${q.magnitude}, 深さ: ${q.depth ? q.depth + 'km' : '不明'}`;
                    quakeList.appendChild(li);
                });
            }
        } catch (error) {
            console.error('地震データの取得に失敗しました:', error);
            quakeList.innerHTML = '<li>地震データの取得に失敗しました。</li>';
        }
    }

    // 地震データ追加フォームの送信イベント
    addQuakeForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const quakeData = {
            date: dateInput.value,
            location: locationInput.value,
            magnitude: magnitudeInput.value,
            depth: depthInput.value
        };

        try {
            const response = await fetch('/quakes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(quakeData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // フォームをクリア
            dateInput.value = '';
            locationInput.value = '';
            magnitudeInput.value = '';
            depthInput.value = '';

            // 一覧を再取得
            await fetchQuakes();

        } catch (error) {
            console.error('地震データの追加に失敗しました:', error);
            alert('地震データの追加に失敗しました。');
        }
    });

    // 初期データの読み込み
    fetchQuakes();
});