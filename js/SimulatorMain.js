/* global fillColor */

//SIMULATOR MAIN: simulation of a mobile device with pages
//--------------------------------------------------------

//size of canvas view
var VIEW_SIZE;
//DEVICE (mobile device) measurements
var DEVICE_SIZE;
var DEVICE_RECT;

var SCROLL_SPEED = 5; //bigger = slower

//Slider info
var SLIDER_numDays = 5;
var SLIDER_size = 3;
var SLIDER_spacing = 15;
var SLIDER_pos;
var SLIDER_currentPage = 0;

//Style
var TEXT_FONT = 'ubuntu';

var COLOR_BACKGROUND = new Color(12/255, 6/255, 77/255);
var COLOR_OVERLAY = new Color(40/255, 44/255, 48/255);
var COLOR_SYMBOL = new Color(0/255, 103/255, 242/255);
var COLOR_LIGHT = new Color(170/255, 170/255, 170/255);
var COLOR_ALT = new Color(0.6, 0.6, 0.6);

//Lecture Data
var LECTURE_DATA;
var LECTURE_DATA_SORTED;
var LECUTURE_BINARY_GRAPH;
var LECTURE_MINSTARTTIME = 9 //9:00am
var LECTURE_MAXENDTIME = 19; //7pm

//Time Data
var TIME_LAST_HOUR_UPDATE = 15;
var TIME_HOUR = 16;
var TIME_DAY = 3;
var LOCATION_BUILDING_NAME = "";

var _DEBUG = false;
//---------------------------------------------------------

GetDataFromURL();

//Get simulation data from local URL
function GetDataFromURL(){
    var query = window.location.search;
    // Skip the leading ?, which should always be there, 
    // but be careful anyway
    console.log(query);
    var urlQ = "";
    if (query.substring(0, 1) == '?') {
        urlQ = query.substring(1, query.indexOf('+'));
    } 
    var dataQuery = query.substring(query.indexOf('+'), query.length);
    console.log(urlQ);
    

    if(urlQ != "?" && dataQuery != null && dataQuery.length > 0){
        //get environment data
        var data = dataQuery.split('+'); 
        
        //set env data:
            //day
        TIME_DAY = parseInt(data[1]);
            //day
        TIME_HOUR = parseInt(data[2]);
            //set last update to one hour ago
        TIME_LAST_HOUR_UPDATE = TIME_HOUR - 1;
        
        //add white spaces if needed (by finding capital characters)
        for(var i = 1; i < data[3].length; ++i){
            var s = data[3].substr(i, 1);
            //check for uppercase
            if(s == s.toUpperCase()){
                //insert space
                console.log('upper');
                data[3] = data[3].slice(0, i) + ' ' + data[3].slice(i);
                i += 1;
            }
        }
        
                //building
        LOCATION_BUILDING_NAME = data[3];
        
        //debug
        console.log(data);
        console.log(query);
    } else {
        urlQ = null;
    }
    //start creation of app with collection of data
    GetClassLectures(['INFR08019_SV1_SEM1', 'INFR08008_SV1_SEM1', 'INFR08023_SV1_SEM1', 'INFR08009_SV1_SEM2'], urlQ);
    //call geolocation script function
    console.log(findIfNearBuilding(LOCATION_BUILDING_NAME));
}


//Load Requested lecture data
//console.log('got it:' + localStorage.getItem('label'));

//Start the app after data has been retreived from start
console.log('here');
/*var count = 10;
setTimeout(checkTimeDoneStart, 2000);
function checkTimeDoneStart(){
    if(getData() == null && count > 0){
        //setTimeout(checkTimeDoneStart(), 2000);
        count--;
    }
    else
        StartSim(data);
        
    console.log('done');
}

function StartSim(data){
    GetClassLectures(data);
    console.log(findIfNearBuilding("Main University Library"));
}*/


//Setup window for canvas
function InitialiseDevice() {

    //clear canvas for redraw
    project.clear();

    //save view size = window size
    VIEW_SIZE = view.size;
    
    //calculate simulated device size
    DEVICE_SIZE = new Point(VIEW_SIZE.width * 1, VIEW_SIZE.height * 1);
    //calculate simulated device rec (in centre of view)
    DEVICE_RECT = new Rectangle(new Point(0, 0), DEVICE_SIZE);
    DEVICE_RECT.center = new Point(VIEW_SIZE.width / 2, VIEW_SIZE.height / 2);
    
    //set slider position
    SLIDER_pos = new Point(DEVICE_RECT.center.x, DEVICE_RECT.bottom - 15);
    
    //DEBUG: show window size and bounds
    if(_DEBUG){
        //var boundRec = new Rectangle(5, 5, VIEW_SIZE.width - 10, VIEW_SIZE.height - 10);
        var text = new PointText(new Point(15, 15));
        text.fillColor = 'red';
        text.content = VIEW_SIZE.width + ' ' + VIEW_SIZE.height;
    }
    
    //Background
    var path = new Path.Rectangle(DEVICE_RECT);
    path.fillColor = COLOR_BACKGROUND;
        
    //Load and create Page Today
    //CreatePageToday();
    
    //Load and create Timetable page (left page)
    //CreatePageTimetable();
    
}

//Window Event Calls
function OnWindowResize() { 
    //resize the object scale data
    InitialiseDevice(); 
}

//add listeners
window.addEventListener('resize', OnWindowResize);
//--------------------------------------------------

///----------------------------------------------------------------
///----------------------------------------------------------------
///GET LECTURE DATA
///------------------------------------------------------------        

//output array of class lecture based on class input names
function GetClassLectures(ClassNames, urlExternal){
    //Create URL to access lectures from timetable
    var urlBase = 'https://browser.ted.is.ed.ac.uk/generate?';
    
    if(urlExternal == null || ClassNames == null){
        console.log('no info');
        urlBase = urlBase + 'courses=';
        //ClassNames = ['INFR08019_SV1_SEM1', 'INFR08008_SV1_SEM1', 'INFR08023_SV1_SEM1', 'INFR08009_SV1_SEM2'];
        //Add courses to url
        for(var i = 0; i < ClassNames.length; ++i){
            urlBase += ClassNames[i] + (i < ClassNames.length - 1? ',' : '');
        }
        //Add period and format
        urlBase += '&period=YR&format=json';
    }else{
        urlBase = urlExternal;
    }
    
    //2D array on lectures, first dimension = lecture names, 2nd dimension = lecture data
    // lecture data = 'week list', 'location', 'day of week'
    var lectureData = [];
    
    //Get data from URL
    $.getJSON(urlBase, function(data){
        //console.log(JSON.stringify( data, null, 2 ) );
        //console.log(data.status);
        //console.log(data[0]['name']);
        for(var i = 0; i < data.length; ++i){
            //search through the names of all courses
            var name = data[i]['name'];
            //find the names that only contain 'Lecture' keyword
            if(name.indexOf('Lecture') > -1){
                
                //put lecture data in an array
                lectureData.push(data[i]['day']);
                lectureData.push(data[i]['location'][0]['building'] + ', ' + data[i]['location'][0]['room']);
                lectureData.push(data[i]['name']);
                lectureData.push(data[i]['start']);
                lectureData.push(data[i]['end']);
            }
        }
        //check if no data collected, make random data:
        if(lectureData.length != 0)
            ProcessLecs(lectureData);
        else
            GetClassLectures(['INFR08019_SV1_SEM1', 'INFR08008_SV1_SEM1', 'INFR08023_SV1_SEM1', 'INFR08009_SV1_SEM2'], null);
            //FillTestLecs(lectureData);
    });
    
    /*if(lectureData.length != 0)
        console.log(lectureData);
    //display lec data
    for(var l = 0; l < lectureData.length; ++l){
        console.log(lectureData[l]);
        /*for(var d = 0; d < lectureData[l].length; ++d){
            console('   ' + lectureData[l][d]);
        }*/
    //}
} 
    
//if no data accessed from server, fill lecs with fake data
function FillTestLecs(lecs){
    console.log('fill test: FAILED to load data of lectures');
    lecs = ['0', 'somewhere',
            'hello', '9', '10',
            '1', 'somewhere',
            'hello', '9', '10',
            '2', 'somewhere',
            'hello', '9', '10',
            '3', 'somewhere',
            'hello', '9', '10',
            '4', 'somewhere',
            'hello', '9', '10'];
            
    ProcessLecs(lecs);
}

//For processing asyncronous data and setting it to a global array
function ProcessLecs(lecs){
    
    LECTURE_DATA = lecs;
    SortLectureData();
    
    SortLectureDataIntoGraph(LECTURE_DATA_SORTED);
    
    //Load the first page
    LoadPage("TODAY");
    console.log('load today');
    //print data for debug console
    /*for(var i = 0; i < LECTURE_DATA.length; ++i){
        console.log(LECTURE_DATA[i]);
    }*/
    
    //print array for debug console
    console.log(LECTURE_DATA);
}		
///----------------------------------------------------------------
///----------------------------------------------------------------
///----------------------------------------------------------------
///----------------------------------------------------------------

//sort lecture data into 2D array by day of week
function SortLectureData(){
    //array of 5 days
    var days = new Array(SLIDER_numDays);
    //initialise arrays for each day
    for(var d = 0; d < days.length; ++d){
        //create 2nd list of lecture events
        days[d] = new Array();
        //first item in list is the day of week(Mon..Fri)
        days[d].push(d);
        //Add date
        days[d].push('March ' + (d + 1));
    }
    
    //number of pieces of data per lecture item
    var dataValuesCount = 5;
    for(var i = 0; i < LECTURE_DATA.length; i += dataValuesCount){
        
        //add location of lec
        days[LECTURE_DATA[i]].push(LECTURE_DATA[i + 1]);
        
        //add geo coords of lec
        var geoCoords = getCoordinates(LECTURE_DATA[i + 1]);
        days[LECTURE_DATA[i]].push(geoCoords[0] + ',' + geoCoords[1]);
        
        //add name of lec and check if name is too long
        //if(LECTURE_DATA[i + 2].length > 15)
        //    days[LECTURE_DATA[i]].push(LECTURE_DATA[i + 2].substring(0, 35));
        //else
            days[LECTURE_DATA[i]].push(LECTURE_DATA[i + 2]);
        //add start time
        days[LECTURE_DATA[i]].push(LECTURE_DATA[i + 3]);
        //add end time
        days[LECTURE_DATA[i]].push(LECTURE_DATA[i + 4]);
    }
    
    LECTURE_DATA_SORTED = days;
    console.log(LECTURE_DATA_SORTED);
}

//--------------------------------------------------------------------
//Get the lecture at a specific day and time
// day = 0..4, time = 9..19
function getLecFromDayTime(day, time, dataGeo){
    //sort through lectures
    //console.log(LECTURE_DATA_SORTED[day]);
    //debug
    //console.log(LECTURE_DATA_SORTED[day][j]);
    //console.log(dataGeo);
    console.log(LECTURE_DATA_SORTED[day][j - 1]);
    //itterate through a single day
    for(var j = 5; j < LECTURE_DATA_SORTED[day].length; j += 5){
        //dataFormat = LECTURE NAME:dayOfWeek
        var dataFormat = LECTURE_DATA_SORTED[day][j - 1] + ':' + day;
        console.log(dataFormat);
        console.log(dataGeo);
        //get dayOfWeek unique based on geoData of button
        var dayOfLec = parseInt(dataGeo.substr(dataGeo.length - 1, 1));
        //lec is on time
         console.log("AAAAAA:" + LECTURE_DATA_SORTED[day][j - 3]);
         console.log(LOCATION_BUILDING_NAME);
         var coordLEC1 = getCoordinates(LECTURE_DATA_SORTED[day][j - 3]);
         var coordLEC2 = getCoordinates(LOCATION_BUILDING_NAME);
         var dist = distance(coordLEC1.x, coordLEC1.y, coordLEC2.x, coordLEC2.y);
         console.log(coordLEC1 + ' ' + coordLEC2);
         console.log('dist:' + dist);
         
         //lec is on time and right location
        if(LECTURE_DATA_SORTED[day][j] == time && dataFormat == dataGeo
            && dist <= 3){
            console.log('true');
            return 0;
        }
        //lec is later than time
        else if((LECTURE_DATA_SORTED[day][j] > time && day == dayOfLec) || day < dayOfLec){
            console.log('true');
            console.log(parseInt(dataGeo.substr(dataGeo.length - 1, 1)));
            return 1;
        }
    }
    
    return -1;
}

//sort info into binary graph where 1 = fill, 0 = empty (calender)
function SortLectureDataIntoGraph(data){
    
    //Graph info: x-axis = 5 days of week, y axis = 9:00-19:00 = 10 }= 10x5
    var XAxis = 5;
    var YAxis = 11;
    //Create binary graph and fill it with zeroes
    var binGraphData = new Array(YAxis);
    
    for(var y = 0; y < YAxis; ++y){
        binGraphData[y] = new Array(XAxis);
        for(var x = 0; x < XAxis; ++x){
            binGraphData[y][x] = 0;
        }
    }
    
    //Organise data
    for(var day = 0; day < data.length; ++day){
        
        var dayOfWeek = data[day][0];
        //start at 4 because first 2 values are date values
        //  every 4 values starting at 4 are times
        for(var event = 5; event < data[day].length; event += 5){ 
            //get times of lec (all lecs start at 9:00AM) and bound so not to go outside of array
            var startTime = Math.min(LECTURE_MAXENDTIME, Math.max(LECTURE_MINSTARTTIME, parseInt(data[day][event]))) - LECTURE_MINSTARTTIME;
            //console.log(startTime);
            var endTime = Math.max(LECTURE_MINSTARTTIME, Math.min(LECTURE_MAXENDTIME, parseInt(data[day][event + 1]))) - LECTURE_MINSTARTTIME;
            binGraphData[startTime][dayOfWeek] = 1;
            binGraphData[endTime][dayOfWeek] = 1;
        }
    }
    
    LECUTURE_BINARY_GRAPH = binGraphData;
    
}

//Draw a binary graph of lecture data
function DrawLectureDataGraph(data, Position, xAxisRate, yAxisRate){
        
    //Graph info: x-axis = 5 days of week, y axis = 9:00-19:00 = 10 }= 10x5
    var XAxis = 5;
    var YAxis = 11;
    //Draw cells that have been filled
    for(var y = 0; y < YAxis; ++y){
        for(var x = 0; x < XAxis; ++x){
            if(data[y][x] == 1){
                console.log(x + ' ' + y);
                //distance between cells
                var gap = 1;
                //rectangle of cell
                var recCell = new Rectangle(new Point(gap, gap), (yAxisRate) - gap * 2, yAxisRate - gap * 2);
                //draw curved cell
                recCell.center = Position + new Point(x * xAxisRate, y * yAxisRate) + new Point(0, yAxisRate / 2);
                var cornerSize = new Size(2, 2);
                var cell = new Path.RoundRectangle(recCell, cornerSize);
                cell.fillColor = COLOR_SYMBOL;
            }
        }
    }
}

//Takes a 2D array of timetable data and where to make it
function SortLectureDataIntoScroll(data, Position)
{
    //object array
    var objs = [];
    
    //gap offset of lecture events list
    var lecOffset = DEVICE_RECT.height / 30;
    
    //take pairs and make into list
    for(var day = 0; day < data.length; ++day){
        
        //Add background for each day (temp)
        // (NOTE: make invisible but do not remove)
        var recBack = new Path.Rectangle(
                    new Rectangle(DEVICE_RECT.x + (DEVICE_RECT.width * day) + 5,
                    DEVICE_RECT.y + 5, DEVICE_RECT.width - 10,
                    DEVICE_RECT.height - 10));
        //make colour invisible so that is only used for collision
        recBack.fillColor = new Color(0, 0, 0, 0);
        objs.push(recBack);
        
        //first two events are special dates:
        var PosOffset = new Point(DEVICE_SIZE.x * day, lecOffset / 2);
        
        //convert day (mond...sun)
        var dayOfWeek = 'Monday';
        switch(data[day][0]){
            case 0: 
                dayOfWeek = 'Monday';
                break;
            case 1: 
                dayOfWeek = 'Tuesday';
                break;
            case 2: 
                dayOfWeek = 'Wednesday';
                break;
            case 3: 
                dayOfWeek = 'Thursday';
                break;
            case 4: 
                dayOfWeek = 'Friday';
                break;
        }
        
        //generate text aligned objects
        var tx = TextLadder(Position + PosOffset,
                    [dayOfWeek, data[day][1]],
                    50);
        //add items to obj array
        objs.push(tx[0]);
        objs.push(tx[1]);
        //---------------------------------------
        
        //increment events by 4
        for(var event = 2; event < data[day].length; event += 5){
            
            var groupEvent = new Group();
            
            //draw each day on a new page
            var PosOffset = new Point(DEVICE_SIZE.x * day, (event + 2) * lecOffset);
            
            var timeStart = data[day][event + 3];
            var timeEnd = data[day][event + 4];
            var totalTime = timeStart + ':00 - ' + timeEnd + ':00';
            var geoLoc = data[day][event + 1];
            
            //generate text aligned objects
            var tx2 = TextLadder(Position + PosOffset,
                        [data[day][event + 2], data[day][event], ''/*geoLoc*/, totalTime, ''/*data[day][0]*/],
                        //    name(max 35 chars)   location      geoLoc     time     day of week
                        event == 0? 50 : 20);
            
            //add items to obj array
            for(var t = 0; t < tx2.length; ++t){
                groupEvent.addChild(tx2[t]);
            }
            //add to group
            objs.push(groupEvent);
        }
        
    }
    
    return objs;
}

//PAGE LOADS-------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------

//Loads a new page and clears the data of all other currently loaded pages
function LoadPage(pageName){
    
    //Call initialiseDevice to clear data and reconfigure device for new page
    InitialiseDevice();
    
    switch(pageName){
        
        case 'TODAY':
            CreatePageToday();
            break;
        case 'TIMETABLE':
            CreatePageTimetableButton(true);
            break;
        
    }
    
    //Draw overlay edges: TEMP DEBUG
    /*var rectLeft = new Rectangle(-200, -200, 560 - DEVICE_RECT.left, 1000);
    var rectLeftDraw = new Path.Rectangle(rectLeft);
    rectLeftDraw.fillColor = 'white';
    
    var rectTop = new Rectangle(-200, -150, 1000, 200 - DEVICE_RECT.top + 27);
    var rectTopDraw = new Path.Rectangle(rectTop);
    rectTopDraw.fillColor = 'white';*/
}


//PAGE CREATES
//--------------------

//Create Today Page:
function CreatePageToday(){
   
    //slide dates
    var pos1 = new Point(DEVICE_RECT.center.x, DEVICE_RECT.height / 5);
    /*SlideObj(pos1, 
            TextLadder(pos1, ["Monday", "3 March"], 50).concat(
        TextLadder(pos1 + new Point(0, 150), ["The Biomedical Science Lecture", "9:00 AM - 10:00 AM"], 20).concat(
        TextLadder(pos1 + new Point(0, 220), ["The Dynamic Cell Lecture", "10:005 AM - 11:00 AM"], 20))), 
             true);*/
    SlideObj(pos1, SortLectureDataIntoScroll(LECTURE_DATA_SORTED, pos1), true);
    //SlideObj(new Point(DEVICE_RECT.center.x + 200, 200), 
    //        ["Tuesday", "4 march"], false);
    
    //---------------------------
    //Create outter logo---------
    var size = DEVICE_RECT.height / 19;
    var logo = new Path.Circle(new Point(DEVICE_RECT.center.x, DEVICE_RECT.top + size * 1.5), size);
    logo.fillColor = COLOR_BACKGROUND;
    logo.strokeColor = 'white';
    logo.strokeWidth = 2;
    // Set the shadow color of the circle to RGB black:
    logo.shadowColor = new Color(0, 0, 0),
    // Set the shadow blur radius to 12:
    logo.shadowBlur = 5,
    // Offset the shadow by { x: 5, y: 5 }
    logo.shadowOffset = new Point(2, 2);
    //inner logo-----------
    var sizeInner = size / 1.5;
    var logoInner = new Path.Circle(new Point(DEVICE_RECT.center.x - (size / 4.5), DEVICE_RECT.top + size * 1.5), sizeInner);
    logoInner.fillColor = COLOR_SYMBOL;
    //create title logo-----------
     var text = new PointText({
            point: new Point(DEVICE_RECT.center.x, DEVICE_RECT.top + size * 1.5 + 6),
            content: 'TimED',
            fillColor: 'white',
            fontFamily: 'Times New Roman',
            fontWeight: 'normal',
            fontSize: 23,
            justification: 'center'//,
     });
    
    //Create timetable button
    CreatePageTimetableButton(false);
}

//get the position of the minimap circles at bottom of screen based on index
function SliderMapPosFromIndex(index){
    return SLIDER_pos + new Point((index - Math.floor(SLIDER_numDays / 2)) * SLIDER_spacing, 0)
}

//Returns a vertical text array, Names[0] = bigger, rest are small
// Size = biggest text size to use
function TextLadder(Position, Names, Size){
    
    var ladder = [];
    
    //Add text
    for(var i = 0; i < Names.length; ++i){
        //text
        var text = new PointText({
            point: Position + [0, i * Size / 1.5],
            content: Names[i],
            fillColor: i == 0? 'white' : COLOR_ALT,
            fontFamily: TEXT_FONT,
            fontWeight: i == 0 && Size > 30? 'normal':'normal',
            //sizes can't be smaller than 3
            fontSize: i == 0? Size : Math.max(Size / 3, 12),
            justification: 'center'//,
            /*// Set the shadow color of the circle to RGB black:
            shadowColor: new Color(0, 0, 0),
            // Set the shadow blur radius to 12:
            shadowBlur: 2,
            // Offset the shadow by { x: 5, y: 5 }
            shadowOffset: new Point(2, 2)*/
        });
        
        //add to group
        ladder.push(text);
    }
    
    return ladder;
}


function ButtonCirc (Pathdata) {
    Path.apply(this, Pathdata);

    this.onFrame = function(event){
        //input current day (Mon(0)..Fri(4)) and hour(9..19))
        var now = new Date();
        //var timeHr = 16; //hour time
        //var timeDay = 3;
        //TODO: check if they are at the lecture theatre-----
        //---------------------------------------------------
        //if colour is neutral colour, check if on time to lec or missed lec
        if(this.fillColor == COLOR_SYMBOL && TIME_HOUR != this.timeOfLastHourUpdate){
            //update once an hour
            this.timeOfLastHourUpdate = TIME_HOUR;
            
            //check on time = scroller is on right day and time check
            var timeCheck = getLecFromDayTime(TIME_DAY, TIME_HOUR, this.data);
            if(timeCheck == 0){
                this.fillColor = new Color(0, 1, 0, 1);
                //console.log('BUTTON:' + cirAttend.name + ' -- ' + cirAttend.geo);
            }
            //else check if scroller has exceeded day
            else if(timeCheck == -1){
                this.fillColor = new Color(1, 0, 0, 1);
                //console.log('BUTTON:' + cirAttend.name + ' -- ' + cirAttend.geo);
            }
        }
    }
    
    this.data = 0;
    this.timeOfLastHourUpdate = TIME_LAST_HOUR_UPDATE;
}
ButtonCirc.prototype = new Path;
/*Person.prototype.walk = function () {
  // walk logic
};*/

//Position = point, ObjList = items to add to scroll 
function SlideObj(Position, ObjsList, Slidable) {
    //create a group to add items to
    var slideObjGroup = new Group();

    //Add text
    var cirAttend;
    var buttonCount = 0;
    for(var i = 0; i < ObjsList.length; ++i){
        
        //add to group
        slideObjGroup.addChild(ObjsList[i]);
        
        if(ObjsList[i].hasChildren()){
            /*buttonCount++;
            cirAttend = new Path.Circle(ObjsList[i].position + new Point(0, DEVICE_RECT.height / 20), DEVICE_RECT.height / 40);
            cirAttend.name = 'cirAttend' + i;
            cirAttend.fillColor = COLOR_SYMBOL;
            cirAttend.strokeColor = 'white';
            cirAttend.strokeWidth = 2;
            cirAttend.geo = i;*/
            var basePos = ObjsList[i].position + new Point(0, DEVICE_RECT.height / 20);
            var segments = [basePos, basePos + new Point(0, 20),
                            basePos + new Point(20, 20), basePos + new Point(20, 0),
                            basePos];
            cirAttend = new ButtonCirc(segments);
            cirAttend.name = 'cirAttend' + i;
            cirAttend.fillColor = COLOR_SYMBOL;
            cirAttend.strokeColor = 'white';
            cirAttend.strokeWidth = 2;
            //write out data to pair button with unique id = lecture:day of week
            cirAttend.data = ObjsList[i].children[0]._content + ':' + ObjsList[i].lastChild._content;
            
            //Add color event call
            /*cirAttend.onMouseDown = function(event){
                if(cirAttend.fillColor == COLOR_SYMBOL) {//&& compareGeoStringToUser(('10,10')))
                    cirAttend.fillColor = new Color(0, 1, 0, 1);
                    console.log('BUTTON:' + cirAttend.name + ' -- ' + cirAttend.geo);
                }
                else {
                    cirAttend.fillColor = new Color(1, 0, 0, 1);
                    console.log('BUTTON:' + cirAttend.name + ' -- ' + cirAttend.geo);
                }
            }*/
            
            slideObjGroup.addChild(cirAttend);
        }
        
    }
    
    console.log(slideObjGroup);
    
    /*for(var j = slideObjGroup.children.length - 1; j > slideObjGroup.children.length - 1 - buttonCount; --j){
        
        //Add color event call
        slideObjGroup.children[j].onMouseDown = function(event){
            if(slideObjGroup.children[j].fillColor == COLOR_SYMBOL) {//&& compareGeoStringToUser(('10,10')))
                slideObjGroup.children[j].fillColor = new Color(0, 1, 0, 1);
                console.log('BUTTON:' + slideObjGroup.children[j].name + ' -- ' + slideObjGroup.children[j].geo);
            }
            else {
                slideObjGroup.children[j].fillColor = new Color(1, 0, 0, 1);
                console.log('BUTTON:' + slideObjGroup.children[j].name + ' -- ' + slideObjGroup.children[j].geo);
            }
        }
    }*/
    //create buttons
    /*var buttonArray = [];
    var cirAttend;
    for(var i = 0; i < ObjsList.length; ++i){
        
        if(ObjsList[i].hasChildren()){
            cirAttend = new Path.Circle(ObjsList[i].position + new Point(0, DEVICE_RECT.height / 20), DEVICE_RECT.height / 40);
            cirAttend.fillColor = COLOR_SYMBOL;
            cirAttend.strokeColor = 'white';
            cirAttend.strokeWidth = 2;
            cirAttend.geo = 0;
            
            //Add color event call
            cirAttend.onMouseDown = function(event){
                if(cirAttend.fillColor == COLOR_SYMBOL) //&& compareGeoStringToUser(('10,10')))
                    cirAttend.fillColor = new Color(0, 1, 0, 1);
                else 
                    cirAttend.fillColor = new Color(1, 0, 0, 1);
            }
            
            buttonArray.push(new Path.Circle(cirAttend));
        }
    }
    
    for(var i = 0; i < buttonArray.length; ++i){
        slideObjGroup.addChild(buttonArray[i]);
    }*/
    
    
    /*slideObjGroup.onFrame = function(event){
        console.log('nonononono');
        if(slideObjGroup.lastChild.fillColor == new Color(0, 0, 0, 0) && compareGeoStringToUser(objs.lastChild.geo)){
        console.log('gogogogogoog');
        slideObjGroup.lastChild.fillColor = new Color(0, 1, 0, 1);
        }
        else{
        console.log('nonononono');
        slideObjGroup.lastChild.fillColor = new Color(1, 0, 0, 1);
        }
    }*/
    
    
    //if object can be grabbed and moved
    if(Slidable){
        //Create group anchor point to move to
        var cAnchor = new Path.Circle(Position, 5);
        cAnchor.fillColor = 'black';
        cAnchor.visible = _DEBUG; //No need to see the anchor point (in non-debug)
        cAnchor.data.anchorPoint = new Point(Position); //point to anchor page
        //store data of the offset for the scroll
        //  (note: groups use center of all items so scroll is offset)
        cAnchor.data.dist = slideObjGroup.position - Position;
        //Anchor updating
        cAnchor.onFrame = function(event) {
            cAnchor.position = cAnchor.data.anchorPoint;
        }
        //add anchor to group
        slideObjGroup.addChild(cAnchor);
        //slideObjGroup.pivot.y = slideObjGroup.position.y - cAnchor.position.y;
        //add mouse input on group
        slideObjGroup.onMouseDrag = function(event) {
            slideObjGroup.position.x += event.delta.x;
            //indicator not to move to anchor
            if(slideObjGroup.lastChild.fillColor == 'red')
                slideObjGroup.lastChild.fillColor = 'green';
                
            //if object pulled too far from anchor, snap to knew point
                //get distance
            var distX = slideObjGroup.position.x - 
                        (slideObjGroup.lastChild.data.anchorPoint.x +  cAnchor.data.dist.x);
            console.log(distX);
            //if scroll moved past a location and is not yellow (no change mode)
            if(Math.abs(distX) > DEVICE_SIZE.x / 10 && slideObjGroup.lastChild.fillColor != 'yellow'){
                
                //Make fillColor yellow (state that doesnt let anchor change)
                slideObjGroup.lastChild.fillColor = 'yellow';
                if(distX > 0 && SLIDER_currentPage > 0)
                    slideObjGroup.lastChild.data.anchorPoint.x += DEVICE_SIZE.x;
                else if(SLIDER_currentPage < SLIDER_numDays - 1)
                    slideObjGroup.lastChild.data.anchorPoint.x -= DEVICE_SIZE.x;
            }
        }
        //mouse up = no indicator
        slideObjGroup.onMouseUp = function(event) {
            //indicator to move to anchor
            slideObjGroup.lastChild.fillColor = 'red';
        }
        //move group towards anchor
        slideObjGroup.onFrame = function(event) {
            //check for no indicator
            if(slideObjGroup.lastChild.fillColor != 'green') {
                var dist = slideObjGroup.position - (slideObjGroup.lastChild.position
                    + cAnchor.data.dist);
                slideObjGroup.position -= dist / SCROLL_SPEED;
            }
        }
        
        //create minimap scroller at bottom-----------------------------------------------
        // 5 days of week = 5 pages

        for(var i = 0; i < SLIDER_numDays; ++i){
            
            var circ = new Path.Circle(SliderMapPosFromIndex(i), SLIDER_size);
            circ.fillColor = 'white';
        }
        
        //Create slider minimap indicator at screen bottom
        var sliderInd = new Path.Circle(Position, SLIDER_size);
        sliderInd.fillColor = 'red';
        sliderInd.onFrame = function(event){
            //create indicator for slider that follows anchor
            //normalise anchor position
            SLIDER_currentPage = Math.min(1 + -Math.ceil(slideObjGroup.lastChild.data.anchorPoint.x /
                                DEVICE_SIZE.x), SLIDER_numDays - 1);
            sliderInd.position = SliderMapPosFromIndex(SLIDER_currentPage);
        }
        //-------------------------------------------------------------------------------
        
    }
}

//---------------------------------------------------------------------
//---------------------------------------------------------------------
//---------------------------------------------------------------------

//Create Timetable button on top left corner, buttonOn determines whether the page should be displayed at load
function CreatePageTimetableButton(buttonOn){
    
    var startButtonPosX = DEVICE_RECT.left - (DEVICE_RECT.width / 1.0);
    var endButtonPosX = DEVICE_RECT.right - (DEVICE_RECT.width / 2);
    
    //group for adding button and page together
    var pageGroup = new Group();
    
    //create background angled into corner of screen
    var recBase = new Rectangle(DEVICE_RECT);
    recBase.x = startButtonPosX;
        
    //page background rectangle
    var recPageBackground = new Path.Rectangle(recBase);
    recPageBackground.fillColor = COLOR_OVERLAY;
    //pivot top right corner and rotate
    recPageBackground.pivot = recPageBackground.bounds.topRight;
    //button shadow
    recPageBackground.shadowColor = new Color(0, 0, 0),
    // Set the shadow blur radius to 12:
    recPageBackground.shadowBlur = 4,
    // Offset the shadow by { x: 5, y: 5 }
    recPageBackground.shadowOffset = new Point(2, 2)
    
    //page selection determines by starting state
    recPageBackground.data.active = buttonOn;   
    
    //add background rec to group
    pageGroup.addChild(recPageBackground);
    
    //Create circle tab to drag page from
    var size = 50;
    var circTab = new Path.Circle(new Point(DEVICE_RECT.left + (size / 4), DEVICE_RECT.top + size), size);
    circTab.fillColor = new Color(0, 0, 0, 0);
    pageGroup.addChild(circTab);
    
    //create circle '=' indicator'
    var txtTab = new PointText({
            point: circTab.position + (!recPageBackground.data.active? new Point(20, 16) : new Point(-60, 16)),
            content: '=',
            fillColor: !recPageBackground.data.active? 'white' : 'grey',
            fontFamily: TEXT_FONT,
            fontWeight: 'bold',
            //sizes can't be smaller than 3
            fontSize: 50,
            justification: 'center'//,
        });
            
    pageGroup.addChild(txtTab);
    
    //if page is active, set it to end position already
    if(recPageBackground.data.active)
        pageGroup.position.x = endButtonPosX;
    
    //when page is dragged in
    pageGroup.onMouseDrag = function(event){
        
        //drag and move page group
        pageGroup.position.x += event.delta.x;
        
        //if page is being dragged in, limit 
        if(pageGroup.position.x > endButtonPosX)
            pageGroup.position.x = endButtonPosX;
        //if page is being dragged out, limit 
        if(pageGroup.position.x < startButtonPosX + (DEVICE_RECT.width / 2))
            pageGroup.position.x = startButtonPosX + (DEVICE_RECT.width / 2);
    }
    
    //when page is relesed, snap into place
    pageGroup.onMouseUp = function(event){
        //slide back in
        if(recPageBackground.data.active){
         
            //turn off page
            LoadPage("TODAY");   
        }
        //slide back out
        else{
            
            //turn on page
            LoadPage("TIMETABLE");
            CreatePageTimetable();
        }
    }
    
}

//Creates the full timetable display on the timetable page and returns the objects
function CreatePageTimetable(){
    
    
    //days of week x-axis
    var xAxisRate = DEVICE_RECT.width / (SLIDER_numDays + 1);
    var xAxisLoc = new Point(DEVICE_RECT.left + xAxisRate, DEVICE_RECT.height / 4.5);
    for(var i = 0; i < SLIDER_numDays; ++i){
        
        //Determine text version of day of week
        var dayOfWeek = 'Mon';
        switch(i){
            case 0:
                dayOfWeek = 'Mon';
                break;
            case 1:
                dayOfWeek = 'Tue';
                break;
            case 2:
                dayOfWeek = 'Wed';
                break;
            case 3:
                dayOfWeek = 'Thu';
                break;
            case 4:
                dayOfWeek = 'Fri';
                break;
        }
        
        var txtDay = new PointText({
                point: xAxisLoc + new Point(i * xAxisRate, 0),
                content: dayOfWeek,
                fillColor: COLOR_LIGHT,
                fontFamily: TEXT_FONT,
                fontWeight: 'normal',
                //sizes can't be smaller than 3
                fontSize: 15,
                justification: 'center'//,
            });
    }
    
    //Time of day y-axis
    var hourSlots = 15;
    var startTime = 9; //9:00 AM
    var yAxisRate = DEVICE_RECT.height / (hourSlots);
    var yAxisLoc = new Point(DEVICE_RECT.left + 10, DEVICE_RECT.top + (4 * yAxisRate));
    for(var i = 0; i < hourSlots - 4; ++i){
        
        var txtDay = new PointText({
                point: yAxisLoc + new Point(0, i * yAxisRate),
                content: startTime + i + ':00',
                fillColor: COLOR_LIGHT,
                fontFamily: TEXT_FONT,
                fontWeight: 'normal',
                //sizes can't be smaller than 3
                fontSize: 15,
                justification: 'left'//,
            });
    }
    
    //Week Title
    var txtWeekDay = new PointText({
                point: xAxisLoc - new Point(-xAxisRate, yAxisRate),
                content: 'WEEK 4',
                fillColor: 'white',
                fontFamily: TEXT_FONT,
                fontWeight: 'normal',
                //sizes can't be smaller than 3
                fontSize: 45,
                justification: 'center'//,
            });
            
            //console.log(GetLectureData());
    //SortLectureDataIntoGraph(GetLectureData());
    DrawLectureDataGraph(LECUTURE_BINARY_GRAPH, xAxisLoc + new Point(0, yAxisRate / 2), xAxisRate, yAxisRate);
}
