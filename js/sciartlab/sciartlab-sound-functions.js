/**
 *
 *  The SciArt Lab sound functions library has been developed by Diego Gonzalez
 *  (xmunch.com) for the SciArt Lab (sciartlab.com).
 *
 *  It is an open source library which runs on p5.js.
 *  Some of the functions are based in the work of Jason Sigal and Golan Levin.
 *
 *  The visualization is a correlogram, which plots
 *  the autocorrelations.
 *
 *  We calculate the pitch by counting the number of samples
 *  between peaks.
 */


// ---------------- Variables ---------------- //
var song = [];
var notes = [];
var midiToFrequency = [];
var frequencyToMidi = [];
var closestNote = 0;
var aFreq = 440; // A note frequency
var source, fft, lowPass, oscillator;
var doCenterClip = false;
var centerClipThreshold = 0.0;
var preNormalize = true;
var postNormalize = true;
var trigger = 0;
var autoplay = false;
var oscillator = new Array();
var backgroundColor;
var volume;
var threshold;
var timeDomain;
var corrBuff;
var freq;

var index;
var maxNote = 127; // Podría hacerlo hasta midiToFrequency.length
var minNote = 38; // Podría hacerlo dece 0
var j = 0;

//Populate midiToFrequency;
for (var i = 0; i <= 127; i++) {
    midiToFrequency[i] = (aFreq / 32) * Math.pow(2, (i - 9) / 12);
}

//Populate frequencyToMidi
for (var i = 0; i <= 127; i++) {
    frequencyToMidi[midiToFrequency[i]] = i;
}


// ---------------- Functions ---------------- //

function createOscillator() {
    oscillator = new p5.SinOsc();
    oscillator.start();
    oscillator.amp(0);
}

function loadSoundInput() {

    source = new p5.AudioIn();
    source.start();

    lowPass = new p5.LowPass();
    lowPass.disconnect();
    source.connect(lowPass);

    fft = new p5.FFT(0, 0);
    fft.setInput(lowPass);
}

function getMidiNoteFromFrequency(frequency) {
    return frequencyToMidi[frequency];
}

function getClosestMidiNoteFromFrequency(inputFrequency) {
    return closestFreq(inputFrequency, frequencyToMidi);
}

function closestFreq(num, arr) {
    var curr = 0;
    var diff = Math.abs(num - curr);
    for (var val in arr) {
        var newdiff = Math.abs(num - val);
        if (newdiff < diff) {
            diff = newdiff;
            curr = val;
        }
    }
    return curr;
}

function getColorFromNote(note){
    //TODO
    if(note = 69)
        return color(40,100,200);
    if(note = 70)
        return color(50,100,10);
    if(note = 71)
        return color(60,200,0);
    if(note = 72)
        return color(30,200,100);
    if(note = 73)
        return color(200,300,20);
    if(note = 74)
        return color(10,400,30);
    if(note = 75)
        return color(0,500,40);

}

function getFrequencyFromMidiNote(midi) {
    return midiToFrequency[midi];
}

function playNote(note, duration, amp, fadeIn, fadeOut, oscillator) {


        printWaveform();

        console.log("Play note "+note+" during "+duration+" at amplitude "+amp);
        var frequency = getFrequencyFromMidiNote(note);

        oscillator.freq(frequency);
        oscillator.amp(amp);

        oscillator.fade(fadeIn, fadeOut);

        if (duration) {
            setTimeout(function () {
                oscillator.fade(fadeIn,fadeOut);
            }, duration);
        }

}

function autoCorrelate(timeDomainBuffer) {

    var nSamples = timeDomainBuffer.length;

    if (preNormalize) {
        timeDomainBuffer = normalize(timeDomainBuffer);
    }

    if (doCenterClip) {
        timeDomainBuffer = centerClip(timeDomainBuffer);
    }

    var autoCorrBuffer = [];
    for (var lag = 0; lag < nSamples; lag++) {
        var sum = 0;
        for (var index = 0; index < nSamples; index++) {
            var indexLagged = index + lag;
            if (indexLagged < nSamples) {
                var sound1 = timeDomainBuffer[index];
                var sound2 = timeDomainBuffer[indexLagged];
                var product = sound1 * sound2;
                sum += product;
            }
        }

        autoCorrBuffer[lag] = sum / nSamples;
    }

    if (postNormalize) {
        autoCorrBuffer = normalize(autoCorrBuffer);
    }

    return autoCorrBuffer;
}

function normalize(buffer) {
    var biggestVal = 0;
    var nSamples = buffer.length;
    for (var index = 0; index < nSamples; index++) {
        if (abs(buffer[index]) > biggestVal) {
            biggestVal = abs(buffer[index]);
        }
    }
    for (var index = 0; index < nSamples; index++) {

        buffer[index] /= biggestVal;
    }
    return buffer;
}


function centerClip(buffer) {
    var nSamples = buffer.length;

    centerClipThreshold = map(mouseY, 0, height, 0, 1);

    if (centerClipThreshold > 0.0) {
        for (var i = 0; i < nSamples; i++) {
            var val = buffer[i];
            buffer[i] = (Math.abs(val) > centerClipThreshold) ? val : 0;
        }
    }
    return buffer;
}

function findFrequency(autocorr) {

    var nSamples = autocorr.length;
    var valOfLargestPeakSoFar = 0;
    var indexOfLargestPeakSoFar = -1;

    for (var index = 1; index < nSamples; index++) {
        var valL = autocorr[index - 1];
        var valC = autocorr[index];
        var valR = autocorr[index + 1];

        var bIsPeak = ((valL < valC) && (valR < valC));
        if (bIsPeak) {
            if (valC > valOfLargestPeakSoFar) {
                valOfLargestPeakSoFar = valC;
                indexOfLargestPeakSoFar = index;
            }
        }
    }

    var distanceToNextLargestPeak = indexOfLargestPeakSoFar - 0;

    var fundamentalFrequency = sampleRate() / distanceToNextLargestPeak;
    return fundamentalFrequency;
}

function printWaveform(){

    background(backgroundColor);
    fill(backgroundColor);
    stroke(72, 249, 238);
    strokeWeight(10);

    beginShape();
    for (var i = 0; i < corrBuff.length; i++) {
        var w = map(i, 0, corrBuff.length, 0, width);
        var h = map(corrBuff[i], -1, 1, height, 0);
        curveVertex(w, h);
    }
    endShape();

    fill(backgroundColor);
    stroke(208, 91, 255);

    strokeWeight(1);
    line (0, height/2, width, height/2);

}


function printNoWaveform(){
    background(backgroundColor);
    stroke(208, 91, 255);
    strokeWeight(1);
    line (0, height/2, width, height/2);
}
