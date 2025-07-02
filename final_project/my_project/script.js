document.addEventListener('DOMContentLoaded', () => {
    const quakeList = document.getElementById('quake-list');
    const addQuakeForm = document.getElementById('add-quake-form');
    const dateInput = document.getElementById('date');
    const locationInput = document.getElementById('location');
    const magnitudeInput = document.getElementById('magnitude');
    const depthInput = document.getElementById('depth');
    const intensityInput = document.getElementById('intensity');

    // アイコンや色を使って地震情報を魅力的に表示
    function createQuakeItem(q) {
        const li = document.createElement('li');

        // チェックボックス
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.style.marginRight = '8px';
        checkbox.title = '確認済み';
        li.appendChild(checkbox);

        // アイコン（震度に応じて色分け＋アニメーション）
        const icon = document.createElement('span');
        icon.textContent = '🌏';
        icon.style.marginRight = '8px';
        icon.style.fontSize = '1.4em';
        icon.style.transition = 'transform 0.2s';
        if (q.intensity && q.intensity.includes('6')) {
            icon.style.color = '#e74c3c'; // 赤
            icon.style.filter = 'drop-shadow(0 0 6px #e74c3c88)';
        } else if (q.intensity && q.intensity.includes('5')) {
            icon.style.color = '#f39c12'; // オレンジ
            icon.style.filter = 'drop-shadow(0 0 6px #f39c1288)';
        } else if (q.intensity && q.intensity.includes('7')) {
            icon.style.color = '#8e44ad'; // 紫
            icon.style.filter = 'drop-shadow(0 0 6px #8e44ad88)';
        } else {
            icon.style.color = '#3498db'; // 青
            icon.style.filter = 'drop-shadow(0 0 6px #3498db88)';
        }
        // ちょっとしたアニメーション
        li.addEventListener('mouseenter', () => {
            icon.style.transform = 'scale(1.2) rotate(-8deg)';
        });
        li.addEventListener('mouseleave', () => {
            icon.style.transform = 'scale(1) rotate(0)';
        });
        li.appendChild(icon);

        // 本文
        const info = document.createElement('span');
        info.innerHTML =
            `<strong>${q.date}</strong> | <span style="color:#0056b3;">${q.location}</span> | <span style="color:#1976d2;">M${q.magnitude}</span> | 深さ: ${q.depth ? q.depth + 'km' : '不明'} | <span style="font-weight:bold;">最大震度: <span style="color:#e67e22">${q.intensity ? q.intensity : '不明'}</span></span>`;
        li.appendChild(info);

        // 削除ボタン
        const delBtn = document.createElement('button');
        delBtn.textContent = '削除';
        delBtn.style.marginLeft = '12px';
        delBtn.className = 'delete-btn';
        delBtn.title = 'この記録を削除';
        delBtn.addEventListener('click', async () => {
            if (confirm('この記録を削除しますか？')) {
                await fetch(`/quakes/${q.id}`, { method: 'DELETE' });
                fetchQuakes();
            }
        });
        li.appendChild(delBtn);

        return li;
    }

    // 地震データ一覧を取得して最大震度ごとに分けて表示する関数
    async function fetchQuakes() {
        try {
            const response = await fetch('/quakes');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const quakes = await response.json();
            quakeList.innerHTML = '';

            if (quakes.length === 0) {
                quakeList.innerHTML = '<li>記録された地震はありません。</li>';
                return;
            }

            // 最大震度ごとにグループ化
            const grouped = {};
            quakes.forEach(q => {
                const key = (q.intensity !== null && q.intensity !== undefined && q.intensity !== "") ? q.intensity : '不明';
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(q);
            });

            // intensityの並び順（不明は最後、他は文字列昇順）
            const sortedKeys = Object.keys(grouped).sort((a, b) => {
                if (a === '不明') return 1;
                if (b === '不明') return -1;
                return a.localeCompare(b, 'ja', { numeric: true });
            });

            sortedKeys.forEach(intensity => {
                const groupTitle = document.createElement('h3');
                groupTitle.textContent = `最大震度: ${intensity}`;
                groupTitle.style.marginTop = '24px';
                groupTitle.style.color = '#0056b3';
                quakeList.appendChild(groupTitle);

                const ul = document.createElement('ul');
                grouped[intensity].forEach(q => {
                    ul.appendChild(createQuakeItem(q));
                });
                quakeList.appendChild(ul);
            });
        } catch (error) {
            console.error('地震データの取得に失敗しました:', error);
            quakeList.innerHTML = '<li>地震データの取得に失敗しました。</li>';
        }
    }

    addQuakeForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const quakeData = {
            date: dateInput.value,
            location: locationInput.value,
            magnitude: magnitudeInput.value,
            depth: depthInput.value,
            intensity: intensityInput.value
        };

        try {
            const response = await fetch('/quakes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(quakeData),
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            dateInput.value = '';
            locationInput.value = '';
            magnitudeInput.value = '';
            depthInput.value = '';
            intensityInput.value = '';

            await fetchQuakes();

        } catch (error) {
            console.error('地震データの追加に失敗しました:', error);
            alert('地震データの追加に失敗しました。');
        }
    });

    fetchQuakes();
});