var slider1;

createOscillator();

function createSliders(){
    slider1 = createSlider(0, 1, 0.1, 0.01);
    slider1.position(20, 20);
}

function setup() {

    createCanvas(windowWidth, windowHeight/2);
    noFill();

    createSliders();
    loadSoundInput();

    var container = createDiv("");
    container.class("container");
    container.id("container");

    for (var i = minNote; i < maxNote; i++) { // Podría hacerlo hasta

        var divId = "BOX_"+i;
        var divClass = "box";
        var divContent = i;

        var div = createDiv(divContent);
        div.class(divClass);
        div.id(divId);
        div.parent(container);

        $('#BOX_'+i).hover(function () {
            playNote(this.id.split("BOX_")[1],100, 200,0.5,0.2,oscillator);
        });

        j++;

    }

    var div = createDiv("*")
    div.id("instructions");
    div.class(divClass);

    div.mousePressed(function() {
        if (!autoplay) {
            index = 0;
            autoplay = true;
        }
    });


}

function draw() {
    backgroundColor = (0,0,0);
    background(backgroundColor);

    timeDomain = fft.waveform(1024, 'float32');
    corrBuff = autoCorrelate(timeDomain);
    freq = findFrequency(corrBuff);

    noStroke();
    closestNote = getMidiNoteFromFrequency(getClosestMidiNoteFromFrequency(freq.toFixed(4)));

    text ('Frequency: ' + freq.toFixed(4), 30, 30);
    text ('Frequency: ' + closestNote, 30, 60);

    volume = source.getLevel();

    // If the volume > 0.1,  a rect is drawn at a random location.
    // The louder the volume, the larger the rectangle.
    threshold = slider1.value();
    $(".selectedBox").removeClass("selectedBox");

    printNoWaveform();
    if (volume > threshold) {
        if (closestNote != undefined) {

            $('#BOX_' + closestNote).addClass('selectedBox');
            var ampl = volume;
            console.log(ampl);

            song[song.length] =  { note: closestNote, duration: 2, ampl: ampl };
            playNote(closestNote, 100, ampl, 0.5, 0.2, oscillator);

        }
    }

    if (autoplay && millis() > trigger){

        if(index != undefined && song[index] != undefined && song[index].note != undefined){
            $( ".selectedBox" ).removeClass("selectedBox");
            $('#BOX_'+song[index].note).addClass('selectedBox');

            playNote(song[index].note, song[index].duration, song[index].ampl, 0.5,0.2,oscillator);
            trigger = millis() + song[index].duration;

            index++;
        } else {
            index = 0;
            autoplay = false;
            $( ".selectedBox" ).removeClass("selectedBox");
            oscillator.amp(0);
        }

    } else if (index >= song.length) {
        autoplay = false;
        index=0;
        oscillator.amp(0);
        $( ".selectedBox" ).removeClass("selectedBox");

    }

}
