(function ($) {
    'use strict';
    $(function () {
        if ($("#audience-chart").length) {
            let cancelleOrder = [130, 190, 250, 250, 190, 260];
            let orders = [100, 230, 340, 340, 260, 340];
            let line = [100, 230, 130, 140, 270, 140];
            let month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
            let response;
            $.ajax({
                url: `/admin/dashboard/getSalesData`,
                method: "get",
                success: (data => {
                    console.log(data);
                    response = data;
                    console.log("got response");

                    // profit and
        if ($("#task-chart").length) {
            var taskChartCanvas = $("#task-chart").get(0).getContext("2d");
            var taskChart = new Chart(taskChartCanvas, {
                type: 'bar',
                data: {
                    // labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
                    labels: response.profitDate,
                    datasets: [{
                        label: 'Profit',
                        // data: [-3, -5, -5, 3, 4, -5, -1, 9],
                        data: response.profit,
                        backgroundColor: '#0bfc03'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    layout: {
                        padding: {
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0
                        }
                    },
                    scales: {
                        yAxes: [{
                            display: true,
                            gridLines: {
                                drawBorder: false,
                                color: '#f1f3f9',
                                zeroLineColor: '#f1f3f9'
                            },
                            ticks: {
                                display: true,
                                fontColor: "#9fa0a2",
                                fontSize: 10,
                                padding: 0,
                                stepSize: 10,
                                min: -10,
                                max: 10
                            }
                        }],
                        xAxes: [{
                            display: false,
                            stacked: false,
                            categoryPercentage: 1,
                            ticks: {
                                display: false,
                                beginAtZero: false,
                                display: true,
                                padding: 10,
                                fontSize: 11
                            },
                            gridLines: {
                                color: "rgba(0, 0, 0, 0)",
                                display: false
                            },
                            position: 'bottom',
                            barPercentage: 0.7
                        }]
                    },
                    legend: {
                        display: false
                    },
                    elements: {
                        point: {
                            radius: 0
                        }
                    }
                }
            });
        }

                    // income and expences
                    if ($("#regional-chart").length) {
                        var regionalChartCanvas = $("#regional-chart").get(0).getContext("2d");
                        var regionalChart = new Chart(regionalChartCanvas, {
                            type: 'horizontalBar',
                            data: {
                                // labels: ["12", "8", "4", "0"],
                                labels: response.profitDate,
                                datasets: [{
                                        label: 'Income',
                                        // data: [400, 360, 360, 360],
                                        data: response.income,
                                        backgroundColor: '#1cbccd'
                                    },
                                    {
                                        label: 'Expenses',
                                        // data: [320, 190, 180, 140],
                                        data: response.expences,
                                        backgroundColor: '#ffbf36'
                                    }
                                ]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: true,
                                layout: {
                                    padding: {
                                        left: -7,
                                        right: 0,
                                        top: 0,
                                        bottom: 0
                                    }
                                },
                                scales: {
                                    yAxes: [{
                                        display: true,
                                        gridLines: {
                                            display: false,
                                            drawBorder: false
                                        },
                                        ticks: {
                                            display: true,
                                            min: 0,
                                            max: 400,
                                            stepSize: 100,
                                            fontColor: "#b1b0b0",
                                            fontSize: 10,
                                            padding: 10
                                        },
                                        barPercentage: 1,
                                        categoryPercentage: .6,
                                    }],
                                    xAxes: [{
                                        display: true,
                                        stacked: false,
                                        ticks: {
                                            display: false,
                                            beginAtZero: true,
                                            fontColor: "#b1b0b0",
                                            fontSize: 10
                                        },
                                        gridLines: {
                                            display: true,
                                            drawBorder: false,
                                            lineWidth: 1,
                                            color: "#f5f5f5",
                                            zeroLineColor: "#f5f5f5"
                                        }
                                    }]
                                },
                                legend: {
                                    display: false
                                },
                                elements: {
                                    point: {
                                        radius: 3,
                                        backgroundColor: '#ff4c5b'
                                    }
                                },
                                legendCallback: function (chart) {
                                    var text = [];
                                    text.push('<div class="item mr-4 d-flex align-items-center">');
                                    text.push('<div class="item-box mr-2" style=" background-color: ' + chart.data.datasets[0].backgroundColor + ' "></div><p class="text-black mb-0"> ' + chart.data.datasets[0].label + '</p>');
                                    text.push('</div>');
                                    text.push('<div class="item d-flex align-items-center">');
                                    text.push('<div class="item-box mr-2" style=" background-color: ' + chart.data.datasets[1].backgroundColor + '"></div><p class="text-black mb-0"> ' + chart.data.datasets[1].label + ' </p>');
                                    text.push('</div>');
                                    return text.join('');
                                }
                            },
                        });
                        document.querySelector('#regional-chart-legend').innerHTML = regionalChart.generateLegend();
                    }

                    // sales report
                    var AudienceChartCanvas = $("#audience-chart").get(0).getContext("2d");
                    var AudienceChart = new Chart(AudienceChartCanvas, {
                        type: 'bar',
                        data: {
                            labels: response.date,
                            datasets: [{
                                    type: 'line',
                                    fill: false,
                                    data: response.line,
                                    borderColor: '#ff4c5b'
                                },
                                {
                                    label: 'Orders',
                                    data: response.orders,
                                    backgroundColor: '#0bfc03'
                                },
                                {
                                    label: 'Cancelled Orders',
                                    data: response.cancelleOrder,
                                    backgroundColor: '#fc1803'
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: true,
                            layout: {
                                padding: {
                                    left: 0,
                                    right: 0,
                                    top: 20,
                                    bottom: 0
                                }
                            },
                            scales: {
                                yAxes: [{
                                    display: true,
                                    gridLines: {
                                        display: true,
                                        drawBorder: false,
                                        color: "#f8f8f8",
                                        zeroLineColor: "#f8f8f8"
                                    },
                                    ticks: {
                                        display: true,
                                        min: 0,
                                        max: 15,
                                        stepSize: 5,
                                        fontColor: "#b1b0b0",
                                        fontSize: 10,
                                        padding: 10
                                    }
                                }],
                                xAxes: [{
                                    stacked: false,
                                    ticks: {
                                        beginAtZero: true,
                                        fontColor: "#b1b0b0",
                                        fontSize: 10
                                    },
                                    gridLines: {
                                        color: "rgba(0, 0, 0, 0)",
                                        display: false
                                    },
                                    barPercentage: .9,
                                    categoryPercentage: .7,
                                }]
                            },
                            legend: {
                                display: false
                            },
                            elements: {
                                point: {
                                    radius: 3,
                                    backgroundColor: '#ff4c5b'
                                }
                            }
                        },
                    });
                })
            })
        }

    });
})(jQuery);