
const cv = require("opencv");

var argv = require('minimist')(process.argv.slice(2));

var imagename = argv.i;
var randkey = argv.k;

cv.readImage('./images/input/' + imagename , function (err, img) {
    if (err) { throw err; }

    var Letters = ['A', 'B', 'C', 'D', 'E'];
    let key = ["C", "A", "D", "C", "D", "C", "A", "A", "A", "B", "A", "D", "C", "A", "C", "B", "B", "B", "B", "D", "B", "D", "D", "A", "A"]; 

    if (randkey != undefined){
        key = new Array(randkey);
        for (let i = 0; i < key.length(); i++) {
            key[i] = Letters[Math.randomInt(0, 5)];
        }
    }

    console.log("Score: " + gradeScantron(key, img) + "%");
});



function gradeScantron(key, img) {
    process.on('uncaughtException', function (err) {
        console.log('Caught exception: ' + err);
    });
    const RED = [0, 0, 255];
    const GREEN = [0, 255, 0];
    const BLUE = [255, 0, 0];
    const WHITE = [255, 255, 255];
    const BLACK = [0, 0, 0];
    const COLORS = [RED, [0, 204, 255], [0, 255, 102], [255, 68, 0], [193, 0, 132]];
    var ANSWER_KEY = key;

    console.log('~~~~~~~~~~~~~~' + imagename + '~~~~~~~~~~~~~~');
    var width = img.width();
    var height = img.height();

    if (width < 1 || height < 1) {
        //throw new Error('Image ' + imagename + ' has no size');
        throw 8601;
    }
    console.log("Key has " + ANSWER_KEY.length + " questions");
    if (height > width) {
        console.log("Flipped image");
        img.rotate(90);
        width = img.width();
        height = img.height();
        img.save('./images/' + imagename + '_rotated.jpg');
    }
    

    var startcontours = new cv.Matrix(height, width);
    var im = img.copy();
    im.convertGrayscale();
    im.gaussianBlur([7, 7]);
    var im_canny = im.copy();

    im_canny.canny(60, 240);
    im_canny.dilate(2);

    let contours = im_canny.findContours();
    startcontours.drawAllContours(contours, WHITE);
    
    startcontours.save('./images/' + imagename + '_a.jpg');//first contours


    let minAreaPercent = 0.2;
    let largestAreaIndex = 0;
    let picArea = width * height;

    for (let i = 0; i < contours.size(); i++) {
        if (contours.area(i) / picArea > minAreaPercent) {
            //console.log(i);
            largestAreaIndex = i;
        }
    }
    var largestcontour = new cv.Matrix(height, width);
    //contours[largestAreaIndex]
    var formarea = Math.round(contours.area(largestAreaIndex) * 100 / picArea);
    console.log("Form is "+formarea+"% of image area");
    largestcontour.drawContour(contours, largestAreaIndex, WHITE);
    let hshdhd = contours.boundingRect(largestAreaIndex);
    largestcontour.rectangle([hshdhd.x, hshdhd.y], [hshdhd.width, hshdhd.height], RED, 1, 2);
    largestcontour.save('./images/' + imagename + '_b.jpg');// largest contour

    let arcLength = contours.arcLength(largestAreaIndex, true);
    contours.approxPolyDP(largestAreaIndex, arcLength * 0.05, true);

    if (contours.cornerCount(largestAreaIndex) != 4) {
        //throw new Error("only " + contours.cornerCount(largestAreaIndex) + " corners. Need 4");
        throw 8602;
    }

    var points = [contours.point(largestAreaIndex, 0), contours.point(largestAreaIndex, 1), contours.point(largestAreaIndex, 2), contours.point(largestAreaIndex, 3)];
    startcontours.ellipse(points[0].x, points[0].y, 20, 20, RED, 3, 3);
    startcontours.ellipse(points[1].x, points[1].y, 20, 20, RED, 3, 3);
    startcontours.ellipse(points[2].x, points[2].y, 20, 20, RED, 3, 3);
    startcontours.ellipse(points[3].x, points[3].y, 20, 20, RED, 3, 3);
    startcontours.save('./images/' + imagename + '_rect.jpg');
    //sort points
    var pointssrt = [{}, {}, {}, {}];
    for (var p = 0; p < 4; p++) {
        var point = points[p];
        if (point.x > width / 2) {//its on the rght side of the image
            if (point.y > height / 2) {//its the lower half
                pointssrt[3] = point;
            } else {
                pointssrt[0] = point;
            }
        } else {//its on the left side of the image
            if (point.y > height / 2) {//its the lower half
                pointssrt[2] = point;
            } else {
                pointssrt[1] = point;
            }
        }
    }

    var srcArray = [pointssrt[0].x, pointssrt[0].y, pointssrt[1].x, pointssrt[1].y, pointssrt[2].x, pointssrt[2].y, pointssrt[3].x, pointssrt[3].y];
    var dstArray = [width, 0, 0, 0, 0, height, width, height];

    var xfrmMat = im.getPerspectiveTransform(srcArray, dstArray);
    img.warpPerspective(xfrmMat, 0, 0, WHITE);
    img.resize(2178, 1614);
    img.save('./images/' + imagename + '_flat.jpg');
   






    //
    var resized2 = img.copy();

    img.cvtColor('CV_BGR2GRAY');
    img.gaussianBlur([7, 7]);
    var th = img.adaptiveThreshold(255, 0, 1, 7, 2);
    var lookupImage = img.copy();
    //varlookupImage img.copy().threshold(0, 150, "Binary Inverted", "Otsu");
    //th.canny();
    th.erode(1);
    //th.dilate(0.5);
    th.save('./images/' + imagename + '_c.jpg');//canny

    
    //Rotate image so info box is on the left
    let flipImage = th.copy();
    //flipImage.convertGrayscale();
    //flipImage.gaussianBlur([7, 7]);
    //flipImage.canny(60, 240);
    //flipImage.dilate(2);
    var flipcontours = flipImage.findContours();
    let minInfoBound = 0.0051;
    let maxInfoBound = 0.08;

    console.log("second pass contours: " + flipcontours.size());
    let secondCtn = new cv.Matrix(img.height(), img.width());
    largestAreaIndex = 0;
    for (let i = 0; i < flipcontours.size(); i++) {
        let percentArea = flipcontours.area(i) / picArea;
        if (percentArea > minInfoBound && percentArea < maxInfoBound && percentArea > (flipcontours.area(largestAreaIndex) / picArea) ) {
            console.log(percentArea);
            //console.log(i);
            largestAreaIndex = i;
            
        }
    }
    secondCtn.drawContour(flipcontours, largestAreaIndex, WHITE);

    //secondCtn.drawAllContours(flipcontours,WHITE);
    console.log("index " + largestAreaIndex);


    secondCtn.save('./images/' + imagename + '_second.jpg');
    


    contours = th.findContours(cv.CV_RETR_TREE);
    var bubbleSheet = resized2;
    var graded = resized2.copy();
    var img3 = resized2.copy();
    var contourimg = new cv.Matrix(1614, 2178);

    var bubbles = [];
    var failedcontours = new cv.Matrix(1614, 2178, cv.Constants.CV_8UC1);
    var rect, ar;
    //for (var t = 0; t < contours.size(); t++) {
    console.log("size: " + contours.size());
    for (let t = 0; t < contours.size(); t++) {
        let rect = contours.boundingRect(t);
        ar = rect.width / rect.height;
        if (rect.width >= 40 && rect.height >= 40 && rect.x > 250 && rect.x < 2040) {
            if (ar >= 0.90 && ar <= 1.18) {
                contourimg.rectangle([rect.x, rect.y], [rect.width, rect.height], COLORS[t % 5], 1, 2);
            }
        } else {

            //if (rect.x > 600 && rect.y > 1100 && rect.y < 1400 && rect.y < 900) {
                failedcontours.drawContour(contours, t, WHITE);
                //console.log(rect);
            //}

        }
    }
    failedcontours.save('./images/' + imagename + '_d.jpg');//failedContours

    contourimg.save('./images/' + imagename + '_e.jpg');//contours
    
    for (var t = 0; t < contours.size(); t++) {
        rect = contours.boundingRect(t);
        ar = rect.width / rect.height;
        if (rect.width >= 40 && rect.height >= 40 && rect.width <= 80 && rect.height <= 80 && ar >= 0.90 && ar <= 1.18 && rect.x > 250 && rect.x < 2040) {

            //bubbleSheet.ellipse(rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width / 2, rect.height / 2, BLUE, 3, 8);
            bubbleSheet.rectangle([rect.x, rect.y], [3, 3], COLORS[t % 3], 1);
            bubbles.push(rect);
        }
    }
    //failedcontours.save('./images/' + imagename + '_failedContours.jpg');

    bubbleSheet.save('./images/' + imagename + '_f.jpg');//flat

    var bubbles2 = [];

    const w = bubbles.length;
    var completed = new Array(300);

    var blank = new cv.Matrix(1614, 2178, cv.Constants.CV_8UC1);
    console.log(w + " total bubble contours found");
    for (var b = 0; b < w; b++) {
        var rect = bubbles[b];
        blank.ellipse(rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width / 2, rect.height / 2, WHITE, 3, 6);
    }
    blank.save('./images/' + imagename + '_g.jpg');//prefill
    blank.erode(1);
    blank.floodFill({
        seedPoint: [50, 50],
        newColor: WHITE,
        rect: [[0, 2], [30, 40]],
        loDiff: [8, 90, 60],
        upDiff: [10, 100, 70]
    });
    blank.save('./images/' + imagename + '_h.jpg');//bubblesMask
    blank.dilate(1);

    var final = blank.copy();
    
    final.erode(3);
    final.gaussianBlur([3, 3]);
    //final.canny();
   

    //final.erode(3);
    final.save('./images/' + imagename + '_i.jpg');//prepick
    var newcontours = final.findContours();
    var blank2 = new cv.Matrix(1614, 2178, cv.Constants.CV_8UC1);
    blank2.drawAllContours(newcontours,WHITE);
    blank2.save('./images/' + imagename + '_j.jpg');//foundbubbles
    

    var s = newcontours.size();
    //if (s < 300) {
    //    throw new Error("PROCESSING FAILED: only found " + s + " contours. Need 300. ");
    //}

    console.log("Contours: " + s);
    var blank4 = new cv.Matrix(1614, 2178);
    var BUBBLE_SORTED = [];
    for (let t = 0; t < s; t++) {
       // if (t % 40 === 0) { console.log(t)}
        try{
            if (newcontours.boundingRect(t).x * newcontours.boundingRect(t).y > 5000) {
                BUBBLE_SORTED.push(newcontours.boundingRect(t));
            }
            blank4.drawContour(newcontours, t);
            let box = newcontours.boundingRect(t);
            blank4.putText(t, box.x, box.y, "HERSEY_PLAIN", COLORS[t % 5], 2, 4);
        }catch(e) {
            throw new error("Error "+t)
        }
    }
    blank4.save('./images/' + imagename + '_k.jpg');//numberedcontours

    BUBBLE_SORTED.sort(function (a, b) { return a.x - b.x; });
    var bubblesL = BUBBLE_SORTED.length;
    var columns = [];
    for (let i = 0; i < bubblesL; i += 15) {
        columns.push(BUBBLE_SORTED.slice(i, i + 15));
    }
    var colL = columns.length;

    //if (colL < 20) {
     //   throw new Error("PROCESSING FAILED: only found " + colL + " columns. Need 20. ");
    //}
    console.log("columns: " + colL);


    for (var i = 0; i < colL; i++) {
        columns[i].sort(function (a, b) { return b.y - a.y; });
    }

    //final sorting into question order
    var QUESTIONS = [];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 20; j++) {
            QUESTIONS.push(columns[j].slice(i * 5, (i + 1) * 5));
        }
    }

    //img3.save('./images/' + imagename + '_threshold.jpg');
    var sortedbubble = new cv.Matrix(1614, 2178);
    var circle
    var Letters = ['A', 'B', 'C', 'D', 'E'];
    var numQuestions = QUESTIONS.length;

    console.log("Found " + numQuestions + " questions");

    for (let i = 0; i < numQuestions; i++) {
        //console.log(i);
        for (var t = 0; t < 5; t++) {  //A,B,C,D,E
            //console.log(i,Letters[t]);
            circle = QUESTIONS[i][t];
            //var avg = total / (circle.width * circle.height);
            //img3.ellipse(circle.x + circle.width / 2, circle.y + circle.height / 2, circle.width / 2, circle.height / 2, COLORS[t % 5], 3, 2);
            if (circle === undefined){
                //img3.rectangle([circle.x, circle.y], [circle.width, circle.height], COLORS[t % 5], 1, 2);
            //} else {
                //throw new Error("Missing bubble, Retake Image");
                throw 8604;
            }
            //img3.putText(avg, circle.x, circle.y, "HERSEY_PLAIN", COLORS[t % 5], 2, 2);
        }
    }
    img3.save('./images/' + imagename + '_l.jpg');//bubblesMask_1
    //lookupImage.cvtColor('CV_BGR2GRAY');
    
    lookupImage.threshold(0, 150, "Binary Inverted", "Otsu");
    lookupImage.erode(.5);

    //lookupImage.inRange([0, 0, 0], [160, 160, 160]);
    lookupImage.save('./images/' + imagename + '_m.jpg');//lookup
    var GRADED = [];
    var total;
    var count = 0;
    var bw;
    var bh;
    var data = 0;
    var correct = 0;
    var numquestions = ANSWER_KEY.length;

    if (numquestions > QUESTIONS.length) {
        //throw new Error("PROCESSING FAILED: Key length is " + numquestions + " but only found " + QUESTIONS.length + " questions");
        throw 8605;
    }

    for (let i = 0; i < numquestions; i++) {//For each question
        var rowVals = [];
        for (var t = 0; t < 5; t++) {  //For each bubble: A,B,C,D,E
            circle = QUESTIONS[i][t]

            count = 0;
            bw = circle.width
            bh = circle.height;

            //console.log(circle.x + 10, circle.y + 10);
            
            for (var x = circle.x; x < circle.x + bw; x++) {
                //console.log(x);
                for (var y = circle.y; y < circle.y + bh; y++) {
                    //console.log(lookupImage.pixel(x, y),x, y);
                    if (lookupImage.pixel(y, x) < 200 && lookupImage.pixel(y, x) > 160) {
                        count++;
                    } else if (lookupImage.pixel(y, x) <= 150 && lookupImage.pixel(y, x) > 100){
                        count += 2;
                    }
                    else if (lookupImage.pixel(y, x) <= 100) {
                        count += 4;
                    }
                    //sortedbubble.ellipse(x, y, [lookupImage.pixel(x, y), lookupImage.pixel(x, y), lookupImage.pixel(x, y)])
                    //console.log(lookupImage.pixel(x, y));
                    //console.log(lookupImage.pixel(x, y)[0]);
                }
            }
            rowVals.push(count);
            //console.log("Bubble " + Letters[t] + " Count: " + count, " AR: " + bw / bh);
        }

        lookupImage.save('./images/' + imagename + '_n.jpg');//lookupRect
        var biggest = 0;
        var biggestindex;
        for (let v = 0; v < 5; v++) {
            if (rowVals[v] > biggest) {
                biggest = rowVals[v];
                biggestindex = v;
            }
        }
        //" at " + QUESTIONS[i][0].x + "," + QUESTIONS[i][0].y +
        //console.log("Q. " + (i + 1) +  " Bubbled " + Letters[biggestindex]);

        circle = QUESTIONS[i][biggestindex]
        if (i < numquestions) {
            if (Letters[biggestindex] == ANSWER_KEY[i]) { //If Correct
                graded.ellipse(circle.x + circle.width / 2, circle.y + circle.height / 2, circle.width / 2, circle.height / 2, GREEN, 3, 2);
                correct++;
            } else { // If Incorrect
                graded.ellipse(circle.x + circle.width / 2, circle.y + circle.height / 2, circle.width / 2, circle.height / 2, RED, 3, 2);
                let rightindex;
                switch (ANSWER_KEY[i]) {
                    case 'A':
                        rightindex = 0;
                        break;
                    case 'B':
                        rightindex = 1;
                        break;
                    case 'C':
                        rightindex = 2;
                        break;
                    case 'D':
                        rightindex = 3;
                        break;
                    case 'E':
                        rightindex = 4;
                        break;
                }
                circle = QUESTIONS[i][rightindex]
                graded.ellipse(circle.x + circle.width / 2, circle.y + circle.height / 2, circle.width / 2, circle.height / 2, GREEN, 3, 2);
            }
        }
    }

    let score = Math.round(correct * 1000 / numquestions)/10;
    graded.putText("Score: " + score + "%", 300, 1400, "HERSEY_PLAIN", COLORS[3], 4, 4);

    graded.putText("Key: " + ANSWER_KEY, 300, 1520, "HERSEY_PLAIN", WHITE, 3, 8);
    graded.putText("Key: " + ANSWER_KEY, 300, 1520, "HERSEY_PLAIN", BLACK, 3, 4);

    graded.save('./images/output/' + imagename + '_graded.jpg');
    console.log("Done.");
    return score;
}