async function loadNames() {
    const response = await fetch('https://chain.api.btc.com/v3/block/latest');
    const block = await response.json();
    //console.log(block.data.height);
    let latestblock = block.data.height;
    document.getElementById("ind1").innerHTML = latestblock;

    let nexthalving = 0;

    // if (blocksincehalving>210000){
    //latesthalving = latesthalving + 210000;

    while (nexthalving < latestblock) {
        nexthalving = nexthalving += 210000;

    }

    let latesthalving = nexthalving - 210000;

    let blocksincehalving = latestblock - latesthalving;

    let bullstart = latesthalving - 70000;
    let bullend = latesthalving + 70000;
    document.getElementById("bullstart").innerHTML = bullstart;
    document.getElementById("bullend").innerHTML = bullend;

    document.getElementById("lasthalving").innerHTML = latesthalving;

    document.getElementById("nexthalving").innerHTML = nexthalving;

    if (blocksincehalving + 70000 > 140000) {
        document.getElementById("santimant").innerHTML = "<div>bearmarket</div>";
        document.getElementById("santimantcolor").style.backgroundColor = "red";
    } else

    {
        document.getElementById("santimant").innerHTML = "<div>bullmarket</div>";

        document.getElementById("santimantcolor").style.backgroundColor = "green";

    }




    var data = [{
        domain: { x: [0, 1], y: [0, 1] },
        value: blocksincehalving + 70000,
        title: { text: "Speed" },
        type: "indicator",
        mode: "gauge+number",
        delta: { reference: 400 },
        gauge: {
            axis: { range: [0, 210000], tickwidth: 1, tickcolor: "darkblue" },
            bar: { color: "black" },
            bgcolor: "white",
            borderwidth: 2,
            bordercolor: "gray",
            steps: [
                { range: [0, 70000], color: "green" },
                { range: [70000, 140000], color: "purple" },
                { range: [140000, 210000], color: "red" }
            ],
            threshold: {
                line: { color: "white", width: 4 },
                thickness: 0.75,
                value: blocksincehalving + 70000
            }
        }
    }];

    var layout = {
        width: 300,
        height: 300,
        margin: { t: 25, r: 50, l: 50, b: 25 },
        paper_bgcolor: "white",
        font: { color: "black", family: "IBM plex mono" }
    };

    Plotly.newPlot('myDiv', data, layout);

    // logs [{ name: 'Joker'}, { name: 'Batman' }]
}

loadNames();