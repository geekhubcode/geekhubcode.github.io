$('[data-toggle=tooltip]').tooltip();

Array.prototype.remove = function () {
    let what, a = arguments, L = a.length, ax;

    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }

    return this;
};

let currencyFormatter = new Intl.NumberFormat('en-US');

let configSet = function (key, obj) {
    localStorage.setItem(key, JSON.stringify(obj));
}

let configGet = function (key) {
    return JSON.parse(localStorage.getItem(key));
}

let loadIncludeMetricNames = function () {
    window.include_metric_names = {};

    try {
        let item = configGet('include_metric_names');
        if (item)
            window.include_metric_names = item;
    } catch (e) {
    }

    for (const [key, value] of Object.entries(window.include_metric_names)) {
        let el = $(`[data-include-index-name="${key}"]`);
        if (el.length === 0)
            delete window.include_metric_names[key];
        else if (value === false)
            $(el).trigger('click');
    }
}

let saveIncludeMetricNames = function () {
    try {
        configSet('include_metric_names', window.include_metric_names);
    } catch (e) {
    }
}

let is_loading = true;
let refresh_chart = true;

$('.copy-link').on('click', function (e) {
    e.preventDefault();

    let copyValue = window.location.href;

    navigator.clipboard.writeText(copyValue).then(function () {
        // empty
    }, function () {
        prompt("Copy to clipboard: Ctrl+C, Enter", copyValue);
    });
});

$('.copy-address').on('click', function (e) {
    e.preventDefault();

    let copyValue = $(this).parent().find('.address').text();

    navigator.clipboard.writeText(copyValue).then(function () {
        // empty
    }, function () {
        prompt("Copy to clipboard: Ctrl+C, Enter", copyValue);
    });

    $(this).addClass('copied');
});

$('.toggle-all').on('click', function (e) {
    if (is_loading)
        return;

    let new_state_enabled = Object.values(window.include_metric_names).indexOf(false) > -1;

    refresh_chart = false;

    $.each($('[data-include-index-name]'), function (_, el) {
        let state = $(this).is(':checked');
        if (state !== new_state_enabled)
            $(el).trigger('click');
    });

    refresh_chart = true;
    updateChart();
});

$('[data-include-index-name]').on('click', function (e) {
    if (this.checked)
        $(this).parents('.metric').removeClass('unchecked');
    else
        $(this).parents('.metric').addClass('unchecked');

    if (is_loading)
        return;

    let metric_name = $(this).data('include-index-name');

    window.include_metric_names[metric_name] = $(this).is(':checked');
    saveIncludeMetricNames();
    updateChart();
});

let formatPrice = function (price) {
    return '$' + currencyFormatter.format(Math.ceil(price));
}

function hex(c) {
    let s = "0123456789abcdef";
    let i = parseInt(c);
    if (i === 0 || isNaN(c))
        return "00";
    i = Math.round(Math.min(Math.max(0, i), 255));
    return s.charAt((i - i % 16) / 16) + s.charAt(i % 16);
}

function convertToHex(rgb) {
    return '#' + hex(rgb[0]) + hex(rgb[1]) + hex(rgb[2]);
}

function trim(s) {
    return (s.charAt(0) === '#') ? s.substring(1, 7) : s
}

function convertToRGB(hex) {
    let color = [];
    color[0] = parseInt((trim(hex)).substring(0, 2), 16);
    color[1] = parseInt((trim(hex)).substring(2, 4), 16);
    color[2] = parseInt((trim(hex)).substring(4, 6), 16);
    return color;
}

function generateColor(startColor, endColor, size) {
    startColor = convertToRGB(startColor);
    endColor = convertToRGB(endColor);

    let result = [];

    for (let i = 0; i < size; i++) {
        let endProgress = i / (size - 1);
        let startProgress = 1 - endProgress;

        let c = [];
        c[0] = startColor[0] * startProgress + endColor[0] * endProgress;
        c[1] = startColor[1] * startProgress + endColor[1] * endProgress;
        c[2] = startColor[2] * startProgress + endColor[2] * endProgress;

        result.push(convertToHex(c));
    }

    return result;

}

let colorize_table = undefined;

function buildColorizeTable() {
    colorize_table = generateColor('#002020', '#00C008', 15)
        .concat(generateColor('#00C008', '#FFE000', 43))
        .concat(generateColor('#FFE000', '#BB3000', 32))
        .concat(generateColor('#BB3000', '#200000', 11));
}

let colorize = function (data, colorData) {
    return data.map(function(val, i) {
        let colorize_table_index = Math.max(Math.min(colorData[i][1], 100), 0);

        return {
            x: val[0],
            y: val[1],
            color: colorize_table[colorize_table_index],
        };
    });
}

let initChart = function (data) {
    if ($('#chart').length === 0)
        return;

    window.data = data;
    window.dates = Object.keys(window.data['Price']);
    window.x_min = window.dates[0];
    window.x_max = window.dates[window.dates.length - 1];

    buildColorizeTable();
    loadIncludeMetricNames();
    updateIndexControls();
    renderChart();
    updateChart();
}

let updateIndexControls = function () {
    $('[data-index-name]').each(function () {
        let index_name = $(this).data('index-name');
        if (index_name in window.data) {
            let index_value = Math.ceil(Object.values(window.data[index_name]).slice(-1)[0] * 100);
            $(this).text(index_value.toString());
            //document.getElementById('ind2000').innerText = index_value[] ;
        }
    });

    let lastUpdateTimestamp = moment.unix(
        parseInt(Object.keys(window.data['Price']).slice(-1)[0])
    ).utc().format('MMMM Do, YYYY')

    $('[data-timestamp]').text(lastUpdateTimestamp);
}


let updateChart = function () {
    if (refresh_chart === false)
        return;

    let metrics_disabled = false;
    let metric_names = Object.keys(window.data);
    metric_names.remove('Price');
    metric_names.remove('Confidence');

    for (let [key, value] of Object.entries(window.include_metric_names))
        if (metric_names.includes(key) && value === false) {
            metric_names.remove(key);
            metrics_disabled = true;
        }

    let data_cbbi = [];

    for (let date of window.dates) {
        let sum = 0.0;
        let count = 0;
        let current_cbbi_value = 0;

        for (let metric_name of metric_names) {
            let value = window.data[metric_name][date];
            if (value !== null) {
                sum += value;
                count += 1;
            }
        }

        if (count > 0)
            current_cbbi_value = Math.min(Math.max(sum / count, 0), 1);

        data_cbbi.push([
            parseInt(date) * 1000,
            Math.ceil(current_cbbi_value * 100),
        ]);
    }

    let data_bitcoin = [];

    for (let [key, value] of Object.entries(window.data['Price'])) {
        data_bitcoin.push([
            parseInt(key) * 1000,
            value,
        ]);
    }

    window.chart.series[0].update({
        data: colorize(data_bitcoin, data_cbbi)
    }, true);

    window.chart.series[1].update({
        data: data_cbbi
    }, true);

    $('.confidence-score-value').text(data_cbbi[data_cbbi.length - 1][1].toString());

    if (metrics_disabled)
        $('.metrics-disabled-alert').removeClass('d-none')
    else
        $('.metrics-disabled-alert').addClass('d-none')
}

let markerRadius = 1.8;
let markerScale = 1.0;
let markerScaleFactor = 0.55;

let renderChart = function () {
    Highcharts.setOptions({
        lang: {
            thousandsSep: ','
        },

        plotOptions: {
            series: {
                animation: false
            }
        }
    });

    window.chart = Highcharts.stockChart('chart', {
        chart: {
            marginRight: 80,
        },

        title: {
            text: 'CBBI Historical Chart'
        },

        subtitle: {
            text: 'ColinTalksCrypto Bitcoin Bull Run Index'
        },

        legend: {
            enabled: true
        },

        tooltip: {
            hideDelay: 300,
        },

        annotations: getAnnotations(),

        credits: {
            enabled: false,
        },

        rangeSelector: {
            buttons: [{
                type: 'month',
                count: 6,
                text: '6M',
                title: 'View 6 months'
            }, {
                type: 'year',
                count: 1,
                text: '1Y',
                title: 'View 1 year'
            }, {
                type: 'year',
                count: 3,
                text: '3Y',
                title: 'View 3 years'
            }, {
                type: 'year',
                count: 6,
                text: '6Y',
                title: 'View 6 years'
            }, {
                type: 'all',
                text: 'ALL',
                title: 'View all'
            }]
        },

        xAxis: {
          events: {
              setExtremes: function(e) {
                  let maxSize = parseInt(window.x_max) - parseInt(window.x_min);
                  let currentSize = ((e.max - e.min) / 1000) * markerScaleFactor + maxSize * (1 - markerScaleFactor);
                  let newMarkerScale = Math.max(currentSize / maxSize, 0.1).toFixed(1);

                  if (newMarkerScale !== markerScale) {
                      markerScale = newMarkerScale;

                      window.chart.series[0].update({
                          marker: {
                              radius: markerRadius / newMarkerScale,
                          },
                      }, true);
                  }
              }
          }
        },

        yAxis: [{
            type: 'logarithmic',
            opposite: true,

            gridLineColor: '#00000000',
            tickPixelInterval: 32,

            labels: {
                style: {
                    color: '#dd8861',
                },

                align: 'left',
                x: 15,
            },
        }, {
            type: 'linear',
            opposite: false,
            max: 100,
            min: 0,

            gridLineColor: '#00000010',
            tickPixelInterval: 40,
            endOnTick: false,

            labels: {
                style: {
                    color: '#2f4c6c',
                },

                align: 'right',
                x: -15,
            },
        }, {
            type: 'linear',
            min: 0,
            visible: false,
        }, {
            type: 'linear',
            min: 0,
            visible: false,
        }, {
            type: 'linear',
            min: 0,
            visible: false,
        }],

        series: [{
            type: 'spline',
            name: 'Bitcoin Price',
            data: [],
            yAxis: 0,

            dataGrouping: {
                enabled: false
            },

            marker: {
                enabled: true,
                lineColor: undefined,
                radius: markerRadius,
            },

            color: '#dd8861',
            lineWidth: 0.6,
            findNearestPointBy: 'xy',
            showInNavigator: false,
            turboThreshold: 0,

            tooltip: {
                valueDecimals: 2,
                valuePrefix: '$',
            },

            states: {
                hover: {
                    lineWidthPlus: 0,
                },
            },
        }, {
            type: 'areaspline',
            name: 'CBBI Confidence',
            data: [],
            yAxis: 1,

            dataGrouping: {
                enabled: false
            },

            fillColor: {
                linearGradient: {
                    x1: 0,
                    y1: 0,
                    x2: 0,
                    y2: 1
                },
                stops: [
                    [0, '#2f4c6c36'],
                    [1, '#2f4c6c00']
                ]
            },

            color: '#2f4c6c',
            lineWidth: 1,
            findNearestPointBy: 'xy',
            showInNavigator: true,

            tooltip: {
                valueDecimals: 0,
            },

            states: {
                hover: {
                    lineWidthPlus: 0,
                },
            },
        }, {
            type: 'scatter',
            name: 'Halving Event',
            data: [
                [1354057200_000, -1],
                [1468015200_000, -1],
                [1589148000_000, -1],
            ],
            yAxis: 2,

            color: '#998FC7',
        }, {
            type: 'scatter',
            name: 'Price High',
            data: [
                [1354057200_000, -1],
                [1468015200_000, -1],
                [1589148000_000, -1],
            ],
            yAxis: 3,

            color: '#138A36',
            visible: false,
        }, {
            type: 'scatter',
            name: 'Price Low',
            data: [
                [1321657200_000, -1],
                [1421280000_000, -1],
                [1544914800_000, -1],
            ],
            yAxis: 4,

            color: '#9A031E',
            visible: false,
        }],
    });
}

let getAnnotations = function () {
    let annotations = [];
    let halvingUnixTimestamps = [
        1354057200_000, // November 28th, 2012
        1468015200_000, // July 9th, 2016
        1589148000_000, // May 11st, 2020
    ];

    for (let value of halvingUnixTimestamps) {
        annotations.push({
            draggable: '',
            type: 'infinityLine',
            typeOptions: {
                type: 'line',
                points: [{
                    x: value,
                    y: 0,
                }, {
                    x: value,
                    y: 1,
                }],

                xAxis: 0,
                yAxis: 2,
            },

            shapeOptions: {
                dashStyle: 'LongDash',
                stroke: '#998FC780',
            },
        });

        annotations.push({
            draggable: '',
            labels: [{
                point: {
                    x: value,
                    y: 0,
                    xAxis: 0,
                    yAxis: 2,
                },

                text: 'H',
            }],

            labelOptions: {
                shape: 'rect',
                padding: 3,
                backgroundColor: '#998FC7',
                borderWidth: 0,
                borderRadius: 0,
                y: 0,
            },
        });
    }

    let priceHighUnixTimestamps = [
        1385852400_000, // December 1st, 2013
        1513551600_000, // December 18th, 2017
    ];

    for (let value of priceHighUnixTimestamps) {
        annotations.push({
            draggable: '',
            type: 'infinityLine',
            typeOptions: {
                type: 'line',
                points: [{
                    x: value,
                    y: 0,
                }, {
                    x: value,
                    y: 1,
                }],

                xAxis: 0,
                yAxis: 3,
            },

            shapeOptions: {
                dashStyle: 'LongDash',
                stroke: '#138A3650',
            },
        });

        annotations.push({
            draggable: '',
            labels: [{
                point: {
                    x: value,
                    y: 0,
                    xAxis: 0,
                    yAxis: 3,
                },

                text: 'HI',
            }],

            labelOptions: {
                shape: 'rect',
                padding: 3,
                backgroundColor: '#138A36',
                borderWidth: 0,
                borderRadius: 0,
                y: 0,
            },
        });
    }

    let priceLowUnixTimestamps = [
        1321657200_000, // November 19th, 2011
        1421280000_000, // January 15th, 2015
        1544914800_000, // December 16th, 2018
    ];

    for (let value of priceLowUnixTimestamps) {
        annotations.push({
            draggable: '',
            type: 'infinityLine',
            typeOptions: {
                type: 'line',
                points: [{
                    x: value,
                    y: 0,
                }, {
                    x: value,
                    y: 1,
                }],

                xAxis: 0,
                yAxis: 4,
            },

            shapeOptions: {
                dashStyle: 'LongDash',
                stroke: '#9A031E40',
            },
        });

        annotations.push({
            draggable: '',
            labels: [{
                point: {
                    x: value,
                    y: 0,
                    xAxis: 0,
                    yAxis: 4,
                },

                text: 'LO',
            }],

            labelOptions: {
                shape: 'rect',
                padding: 3,
                backgroundColor: '#9A031E',
                borderWidth: 0,
                borderRadius: 0,
                y: 0,
            },
        });
    }

    return annotations;
}

let initTable = function (json) {
    let tr_el = $('#table thead tr');
    if (tr_el.length === 0)
        return;

    let tbody_el = $('#table tbody');
    if (tbody_el.length === 0)
        return;

    let keys_array = [
        'Date',
        'Price',
        'Confidence',
    ]

    for (let json_key of Object.keys(json))
        if (!keys_array.includes(json_key))
            keys_array.push(json_key);

    json['Date'] = Object.keys(json['Price']).map(v => moment.unix(parseInt(v)).utc().format('MM-DD-YYYY'));

    let min_map = {};
    let max_map = {};

    for (let key of keys_array) {
        tr_el.append(`<th>${key}</th>`);

        json[key] = Object.values(json[key]);

        let value = json[key][0];
        if (value < 10) {
            min_map[key] = Math.min(...json[key]);
            max_map[key] = Math.max(...json[key]);
        }
    }

    let tbody_html = [];

    for (let i = json['Date'].length - 1; i >= 0; i--) {
        let tr_html = [];

        for (let key of keys_array) {
            let bg_opacity = 1;
            let value = json[key][i];

            if (key === 'Price')
                value = formatPrice(value);

            if (value < 10) {
                bg_opacity = 1 - ((value - min_map[key]) / (max_map[key] - min_map[key]));
                value *= 100;
                value = value.toFixed(2) + '%';

                let dotIndex = value.indexOf('.');
                value = `<span class='significant'>${value.substring(0, dotIndex)}</span><span class='not-significant'>${value.substring(dotIndex)}</span>`
            }

            tr_html.push(`<td style='background:rgba(255,255,255,${bg_opacity})'>${value}</td>`);
        }

        tbody_html.push(`<tr>${tr_html.join('')}</tr>`)
    }

    tbody_el.append(tbody_html.join(''));
}

let completeLoading = function () {
    $('#loading').remove();
    is_loading = false;
}

fetch('https://colintalkscrypto.com/cbbi/data/latest.json', {
    referrerPolicy: 'no-referrer',
})
    .then(response => {
        if (!response.ok)
            throw new Error(response.status);

        return response.json();
    })
    .then(json => {
        initChart(json);
        initTable(json);
        completeLoading();
    })
    .catch(error => {
        alert(`An error has occurred during CBBI data load :(\nPlease try again later by reloading the page.\n\n${error}`);

        setTimeout(function () {
            window.location.reload();
        }, 5_000);

        throw(error);
    })
;
