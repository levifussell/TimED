
// Building search
var parsedData = JSON.parse(data);

var GEO_LOCATION = [0, 0]; 

function getCoordinates(name) {
    
    //remove extra name data
    var commaIndex = name.indexOf(','); 
    if(commaIndex != -1) //if comma is found, remove everything past it
    {
        //remove everything past the comma
        name = name.substr(0, commaIndex);
    }
    
    
    
    //Check special cases
    if(name == 'David Hume Tower LTs')
        name = 'David Hume Tower';
    if(name == 'Appleton Tower')
        name = 'Informatics Forum';
    if(name == '50 George Square')
        name = 'George Square (50)';
    
    //test
    console.log(name);
    
    var coords = [];

    for(var i = 0; i < parsedData.locations.length; i++) {
        if(parsedData.locations[i].name === name) {
            coords.push(parsedData.locations[i].longitude);
            coords.push(parsedData.locations[i].latitude);
            break;		
        }		
    }

    return coords;
}

function distance (lat1, lon1, lat2, lon2){
    //check points are equal first
    if(lat1 == lat2 && lon1 == lon2)
        return 0;
    
    // 33m accuracy
    var R = 6371;  //earth radius
    return Math.acos(Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2-lon1)) * R;
}

function compareGeoStringToUser(geoString){
    //split string
    var commaIndex = geoString.indexOf(',');
    var lat = parseFloat(geoString.substr(0, commaIndex));
    var lon = parseFloat(geoString.substr(commaIndex + 1, geoString.length - 1));
    console.log('GEO lat: ' + lat);
    console.log('GEO lon: ' + lon);
    //var lat = geoString[0];
    //var lon = geoString[1];
    
    console.log(GEO_LOCATION);
    
    //compare to geolocation
    if (distance(GEO_LOCATION.x, GEO_LOCATION.y, lat, lon) <= 3) {
        console.log('youre near');
        return true;
    }
    else{
        console.log('not near');
        return false;     
    }
    
}


function findIfNearBuilding(buildingName){
    // Find building need input from timetable data
    //var buildingName = "Student Disability Service";
    var coords = getCoordinates(buildingName);

    var lon2 = coords[0];
    var lat2 = coords[1];
            
    console.log(coords);
        
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(location){
            //GEO_LOCATION.x = location.coords.latitude;    
            //GEO_LOCATION.y = location.coords.longitude;                                                  
            console.log(location.coords.latitude + ' ' + location.coords.longitude);
            if (distance(location.coords.latitude, location.coords.longitude, lat2, lon2) <= 3) {
                console.log('yes');
            }
            else{
                console.log('no');     
            }
        }, function(){
                console.log('error');
        });
    }
    else{
        console.log('denied');
    }
    
    console.log('no navigator: error geolocation');
    return false;
}