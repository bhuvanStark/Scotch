

// Update all live sensor values
async function updateRealTimeData() {
    const csvUrl = "https://api.thingspeak.com/channels/2965771/feeds.csv?api_key=I6D9WGROEFOLZJIE&results=1";
    const res = await fetch(csvUrl);
    const text = await res.text();
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",");
    const last = lines[lines.length - 1].split(",");

    const get = (fieldName) => last[headers.indexOf(fieldName)];

    document.getElementById("mq135_ppb").textContent = get("field1");
    document.getElementById("mq7_ppb").textContent = get("field2");
    document.getElementById("mq2_ppb").textContent = get("field3");
    document.getElementById("dB").textContent = get("field4");
    document.getElementById("pm25").textContent = get("field5");
    document.getElementById("pm10").textContent = get("field6");
    document.getElementById("Temperature").textContent = get("field7");
    document.getElementById("Humidity").textContent = get("field8");
}


// Handle tab switching between sensor sections
function showPage(id, btn) {
    document.querySelectorAll('.sensor-page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.nav-pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');

    if (id === 'prediction-page') {
        fetchMLDataAndRenderCharts();  // 👈 Only fetch when needed
    }
}


// Fetch ML data and render graphs
async function fetchMLDataAndRenderCharts() {
    try {
        const res = await fetch('/train-models');
        const data = await res.json();
        console.log("ML data fetched:", data);  // 👈 ADD THIS

        if (data.field4) drawChart("chart_loudness", data.field4, "Loudness (dB)");
        if (data.field5) drawChart("chart_pm25", data.field5, "PM2.5");
        if (data.field6) drawChart("chart_pm10", data.field6, "PM10");
    } catch (err) {
        console.error("Error fetching ML data:", err);
    }
}


// Render chart using Chart.js
function drawChart(canvasId, data, label) {
    const ctx = document.getElementById(canvasId).getContext("2d");

    // Clear previous chart if exists
    if (window[canvasId]) window[canvasId].destroy();

    window[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.original.map(i => `#${i}`),
            datasets: [
                {
                    label: 'Actual',
                    data: data.actual,
                    borderColor: 'green',
                    borderWidth: 2,
                    fill: false
                },
                {
                    label: 'Predicted',
                    data: data.predicted,
                    borderColor: 'orange',
                    borderDash: [5, 5],
                    borderWidth: 2,
                    fill: false
                }
            ]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: `${label} Prediction (Accuracy: ${(data.accuracy * 100).toFixed(2)}%)`
                }
            },
            responsive: true
        }
    });
}

// Initial calls
setInterval(updateRealTimeData, 5000);
updateRealTimeData();
//fetchMLDataAndRenderCharts();
