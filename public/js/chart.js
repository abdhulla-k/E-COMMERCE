$(function () {
    /* ChartJS
     * -------
     * Data and config for chartjs
     */
    'use strict';
    var data = {
        // labels: ["2013", "2014", "2014", "2015", "2016", "2017"],
        labels: [],
        datasets: [{
            label: 'income',
            // data: [10, 19, 3, 5, 2, 3],
            data: [],
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'
            ],
            borderColor: [
                'rgba(255,99,132,1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1,
            fill: false
        }]
    };
    var options = {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true
                }
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

    };
    var doughnutPieData = {
        datasets: [{
            // data: [30, 40, 30],
            data: [],
            backgroundColor: [
                'rgba(62, 235, 5)',
                'rgba(252, 34, 0)',
                'rgba(255, 206, 86, 0.5)',
                'rgba(75, 192, 192, 0.5)',
                'rgba(153, 102, 255, 0.5)',
                'rgba(255, 159, 64, 0.5)'
            ],
            borderColor: [
                'rgba(255,99,132,1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
            ],
        }],

        // These labels appear in the legend and in the tooltips when hovering different arcs
        labels: [
            'Orders',
            'Cancelled Orders'
        ]
    };
    var doughnutPieOptions = {
        responsive: true,
        animation: {
            animateScale: true,
            animateRotate: true
        }
    };
    var areaData = {
        // labels: ["2013", "2014", "2015", "2016", "2017"],
        labels: ["10/22/33", "10, 22, 44", "10/ 33/ 88"],
        datasets: [{
            label: 'profit',
            // data: [12, 19, 3, 5, 2, 3],
            data: [],
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'
            ],
            borderColor: [
                'rgba(255,99,132,1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1,
            fill: true, // 3: no fill
        }]
    };

    var areaOptions = {
        plugins: {
            filler: {
                propagate: true
            }
        }
    }
    
    // Get context with jQuery - using jQuery's .get() method.
    if ($("#barChart").length) {
        console.log("hi")
        $.ajax({
            url: `/seller/dashboard/getData`,
            method: "get",
            success: (res => {
                console.log(res);
                console.log("got response");
                data.labels = res.profitDate;
                data.datasets[0].data = [...res.income];
                var barChartCanvas = $("#barChart").get(0).getContext("2d");
                // This will get the first returned node in the jQuery collection.
                var barChart = new Chart(barChartCanvas, {
                    type: 'bar',
                    data: data,
                    options: options
                });

                // pie chart
                if ($("#pieChart").length) {
                    doughnutPieData.datasets[0].data = [res.cancelleOrder, res.orders];
                    var pieChartCanvas = $("#pieChart").get(0).getContext("2d");
                    var pieChart = new Chart(pieChartCanvas, {
                        type: 'pie',
                        data: doughnutPieData,
                        options: doughnutPieOptions
                    });
                }

                // area chart
                if ($("#areaChart").length) {
                    areaData.labels = [...res.profitDate];
                    areaData.datasets[0].data = [...res.profit];
                    var areaChartCanvas = $("#areaChart").get(0).getContext("2d");
                    var areaChart = new Chart(areaChartCanvas, {
                        type: 'line',
                        data: areaData,
                        options: areaOptions
                    });
                }
            })

        })
    }
});