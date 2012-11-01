var to_int = function(str) {
    if(!str) {
        return 0;
    }
    if(typeof str == 'number') {
        return parseInt(str,10);
    }
    return parseInt(str.replace(/\D/g,''),10);
};

Date.prototype.format = function(format) {
    var returnStr = '';
    var replace = Date.replaceChars;
    for (var i = 0; i < format.length; i++) {
        var curChar = format.charAt(i);
        if (replace[curChar]) {
            returnStr += replace[curChar].call(this);
        } else {
            returnStr += curChar;
        }
    }
    return returnStr;
};

Date.replaceChars = {
    d: function() { return (this.getDate() < 10 ? '0' : '') + this.getDate(); },
    j: function() { return this.getDate(); },
    m: function() { return (this.getMonth() < 9 ? '0' : '') + (this.getMonth() + 1); },
    n: function() { return this.getMonth() + 1; },
    Y: function() { return this.getFullYear(); },
    y: function() { return ('' + this.getFullYear()).substr(2); },
    a: function() { return this.getHours() < 12 ? 'am' : 'pm'; },
    A: function() { return this.getHours() < 12 ? 'AM' : 'PM'; },
    g: function() { return this.getHours() > 0 ? this.getHours() % 12 : 12; },
    G: function() { return this.getHours(); },
    H: function() { return (this.getHours() < 10 ? '0' : '') + this.getHours(); },
    i: function() { return (this.getMinutes() < 10 ? '0' : '') + this.getMinutes(); },
    s: function() { return (this.getSeconds() < 10 ? '0' : '') + this.getSeconds(); },
    u: function() { var m = this.getMilliseconds(); return (m < 10 ? '00' : (m < 100 ? '0' : '')) + m; }
};
