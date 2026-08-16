// Chart instances
let chartIn, chartOut, chartDropped, chartConn, chartTopics, chartSubs;

function createChart(canvasId, label, lineColor, fillColor) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: label,
                data: [],
                borderColor: lineColor,
                backgroundColor: fillColor,
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    display: true,
                    grid: { display: false },
                    ticks: { maxTicksLimit: 6, font: { size: 10 }, color: '#94a3b8' }
                },
                y: {
                    display: true,
                    beginAtZero: true,
                    grid: { color: '#f1f5f9' },
                    ticks: { maxTicksLimit: 4, font: { size: 10 }, color: '#94a3b8' }
                }
            }
        }
    });
}

function initCharts() {
    chartIn = createChart('chart-messages-in', 'Messages In', '#0284c7', 'rgba(2, 132, 199, 0.08)');
    chartOut = createChart('chart-messages-out', 'Messages Out', '#00C48C', 'rgba(0, 196, 140, 0.08)');
    chartDropped = createChart('chart-dropped', 'Dropped Messages', '#94a3b8', 'rgba(148, 163, 184, 0.08)');
    chartConn = createChart('chart-connections', 'Connections', '#6366f1', 'rgba(99, 102, 241, 0.12)');
    chartTopics = createChart('chart-topics', 'Topics', '#f59e0b', 'rgba(245, 158, 11, 0.12)');
    chartSubs = createChart('chart-subscriptions', 'Subscriptions', '#06b6d4', 'rgba(6, 182, 212, 0.12)');
}

function renderSparklines(inVal, outVal) {
    const sparkIn = document.getElementById('spark-in');
    const sparkOut = document.getElementById('spark-out');
    
    // Generate mini visual bars
    const count = 12;
    sparkIn.innerHTML = Array.from({length: count}).map(() => {
        const h = Math.max(4, Math.min(18, Math.round(Math.random() * (inVal > 0 ? 16 : 4) + (inVal > 0 ? 4 : 2))));
        return `<div class="spark-bar" style="height: ${h}px"></div>`;
    }).join('');

    sparkOut.innerHTML = Array.from({length: count}).map(() => {
        const h = Math.max(4, Math.min(18, Math.round(Math.random() * (outVal > 0 ? 16 : 4) + (outVal > 0 ? 4 : 2))));
        return `<div class="spark-bar out" style="height: ${h}px"></div>`;
    }).join('');
}

async function fetchOverview() {
    try {
        const res = await fetch('/api/overview');
        const data = await res.json();

        // Update Top KPIs
        document.getElementById('kpi-messages-in-rate').innerHTML = `${data.metrics.messagesInRate} <span class="rate-unit">messages/sec</span>`;
        document.getElementById('kpi-messages-out-rate').innerHTML = `${data.metrics.messagesOutRate} <span class="rate-unit">messages/sec</span>`;
        document.getElementById('kpi-all-connections').innerText = data.metrics.allConnections;
        document.getElementById('kpi-live-connections').innerText = data.metrics.liveConnections;
        document.getElementById('kpi-subscriptions').innerText = data.metrics.subscriptions;
        document.getElementById('kpi-shared-subscriptions').innerText = data.metrics.sharedSubscriptions;
        document.getElementById('kpi-topics').innerText = data.metrics.topics;
        document.getElementById('kpi-retained').innerText = data.metrics.retained;

        // Render Sparklines
        renderSparklines(data.metrics.messagesInRate, data.metrics.messagesOutRate);

        // Update Node Details
        document.getElementById('node-name').innerText = data.node.name;
        document.getElementById('node-uptime').innerText = data.node.uptime;
        document.getElementById('node-conn').innerText = data.metrics.liveConnections;
        document.getElementById('node-subs').innerText = data.metrics.subscriptions;
        document.getElementById('node-topics').innerText = data.metrics.topics;
        document.getElementById('node-version').innerText = data.node.version;
        document.getElementById('node-cpu').innerText = `${data.node.cpu} / ${(data.node.cpu * 1.4).toFixed(2)}`;
        document.getElementById('node-memory-bar').style.width = `${data.node.memoryUsage}%`;
    } catch (err) {
        console.error('Error fetching overview:', err);
    }
}

async function fetchHistory() {
    try {
        const res = await fetch('/api/history');
        const hist = await res.json();

        if (hist.timestamps && hist.timestamps.length > 0) {
            updateChartData(chartIn, hist.timestamps, hist.messagesIn);
            updateChartData(chartOut, hist.timestamps, hist.messagesOut);
            updateChartData(chartDropped, hist.timestamps, hist.droppedMessages);
            updateChartData(chartConn, hist.timestamps, hist.connections);
            updateChartData(chartTopics, hist.timestamps, hist.topics);
            updateChartData(chartSubs, hist.timestamps, hist.subscriptions);
        }
    } catch (err) {
        console.error('Error fetching history:', err);
    }
}

function updateChartData(chart, labels, data) {
    if (!chart) return;
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update('none');
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    fetchOverview();
    fetchHistory();

    // Poll every 2 seconds
    setInterval(fetchOverview, 2000);
    setInterval(fetchHistory, 2000);
});
