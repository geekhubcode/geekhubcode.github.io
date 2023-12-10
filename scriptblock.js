async function loadNames() {
    const response = await fetch('https://api.blockchair.com/bitcoin/stats');
    const block = await response.json();
    //console.log(block.data.height);
    let latestblock = block.data.blocks;

    document.getElementById("ind1").innerHTML = latestblock;

    let nexthalving = 0;

    // if (blocksincehalving>210000){
    //latesthalving = latesthalving + 210000;

    while (nexthalving < latestblock) {
        nexthalving = nexthalving += 210000;

    }

    let latesthalving = nexthalving - 210000;

    let blocksincehalving = latestblock - nexthalving;

    let bullstart = latesthalving - 70000;
    let bullend = latesthalving + 70000;
    let nextbullstart = nexthalving - 70000;
    let nextbullend = nexthalving + 70000;


    let remainingblocktillnextbullstart = nextbullstart - latestblock;
    let daytillnextbullstart = (remainingblocktillnextbullstart * 10) / 1440;

    let remainingblocktillendofbullrun = nextbullend - latestblock;
    let remainingblocktillnexthalving = nexthalving - latestblock;
    let daytillendofbullrun = (remainingblocktillendofbullrun * 10) / 1440;
    let bullstartsince = ((latestblock - nextbullstart) * 10) / 1440;
    let bearstartsince = ((latestblock - (latesthalving + 70000)) * 10) / 1440;

    let daystillnexthalving = (remainingblocktillnexthalving * 10) / 1440;

    let daystillstopdcain = ((remainingblocktillnexthalving + 8640) * 10) / 1440;


    let daystillstartdcaout = ((remainingblocktillnexthalving + 35000 + 8640) * 10) / 1440;


    document.getElementById("numberdaystillnexthalving").innerHTML = daystillnexthalving;

    document.getElementById("bullstart").innerHTML = nextbullstart;
    document.getElementById("bullend").innerHTML = nextbullend;

    document.getElementById("lasthalving").innerHTML = latesthalving;

    document.getElementById("nexthalving").innerHTML = nexthalving;


    document.getElementById("halvingdate").innerHTML = new Date(calculerDateEvenement(daystillnexthalving)).toISOString().split('T')[0];







    let gauge;



    if ((latestblock > latesthalving && latestblock < latesthalving + 70000) || (latestblock > nextbullstart && latestblock < nexthalving)) {

        document.getElementById("santimant").innerHTML = "<div>bullmarket</div>";
        document.getElementById("santimantcolor").style.backgroundColor = "green";
        document.getElementById("remainingblocktext").innerHTML = "<div>Remaining blocks till end of bullrun:</div>";
        document.getElementById("remainingblock").innerHTML = remainingblocktillendofbullrun;
        document.getElementById("remainingtimetext").innerHTML = "<div>Days until end of bullrun:</div>";
        document.getElementById("remainingtime").innerHTML = daytillendofbullrun;
        document.getElementById("bullstartsincetext").innerHTML = "<div>Days since start of bullrun:</div>";
        document.getElementById("bullstartsince").innerHTML = bullstartsince;
        document.getElementById("bullenddatetext").innerHTML = "<div>Bull end date:</div>";
        document.getElementById("bullenddatetext").style.color = "red";
        document.getElementById("bullenddate").innerHTML = new Date(calculerDateEvenement(daytillendofbullrun)).toISOString().split('T')[0];
        document.getElementById("bullenddate").style.color = "red";
        document.getElementById("bullstartdatetext").innerHTML = "<div>Bull start date:</div>";
        document.getElementById("bullstartdatetext").style.color = "white";
        document.getElementById("bullstartdate").innerHTML = new Date(calculerDateEvenement2(bullstartsince)).toISOString().split('T')[0];
        document.getElementById("bullstartdate").style.color = "white";

        document.getElementById("stopdcaintext").innerHTML = "<div>Stop DCA in date:</div>";
        document.getElementById("stopdcaintext").style.color = "purple";
        document.getElementById("stopdcain").innerHTML = new Date(calculerDateEvenement(daystillstopdcain)).toISOString().split('T')[0];
        document.getElementById("stopdcain").style.color = "purple";
        document.getElementById("startdcaouttext").innerHTML = "<div>Start DCA out date:</div>";
        document.getElementById("startdcaouttext").style.color = "orange";
        document.getElementById("startdcaout").innerHTML = new Date(calculerDateEvenement(daystillstartdcaout)).toISOString().split('T')[0];
        document.getElementById("startdcaout").style.color = "orange";

        gauge = blocksincehalving + 70000;

    } else

    {


        document.getElementById("santimant").innerHTML = "<div>bearmarket</div>";
        document.getElementById("santimantcolor").style.backgroundColor = "red";
        document.getElementById("remainingblocktext").innerHTML = "<div>Next bullrun will start at block:</div>";
        document.getElementById("remainingblock").innerHTML = nextbullstart;
        document.getElementById("remainingtimetext").innerHTML = "<div>Days until next bullrun:</div>";
        document.getElementById("remainingtime").innerHTML = daytillnextbullstart;
        document.getElementById("bullstartsincetext").innerHTML = "<div>Days since start of bearmarket:</div>";
        document.getElementById("bullstartsince").innerHTML = bearstartsince;
        gauge = latestblock - latesthalving + 70000;

    }





    var data = [{
        domain: { x: [0, 1], y: [0, 1] },
        value: gauge,
        title: { text: "Block Meter" },
        type: "indicator",
        mode: "gauge+number+delta",
        delta: { reference: 140000, increasing: { color: "RebeccaPurple" } },
        gauge: {
            axis: { range: [0, 210000], tickwidth: 1, tickcolor: "darkblue" },
            bar: { color: "black" },
            bgcolor: "white",
            borderwidth: 2,
            bordercolor: "gray",
            steps: [
                { range: [0, 70000], color: "green" },
                { range: [70000, 78640], color: "blue" },
                { range: [78640, 105000], color: "purple" },
                { range: [105000, 113640], color: "yellow" },
                { range: [113640, 140000], color: "orange" },
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


    function calculerDateEvenement(joursRestants) {
        var dateActuelle = new Date();
        dateActuelle.setDate(dateActuelle.getDate() + joursRestants);
        return dateActuelle;
    }

    function calculerDateEvenement2(joursRestants2) {
        var dateActuelle2 = new Date();
        dateActuelle2.setDate(dateActuelle2.getDate() - joursRestants2);
        return dateActuelle2;
    }

    var joursRestants = daystillnexthalving;
    var dateEvenement = calculerDateEvenement(joursRestants);

    document.getElementById("dateActuelle").innerHTML += new Date().toISOString().split('T')[0];
    document.getElementById("dateEvenement").innerHTML += dateEvenement.toISOString().split('T')[0];



}

loadNames();