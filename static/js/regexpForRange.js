

valueStr=function(value, num) {
    return new Array(num+1).join(value);
};

naiveRange = function(min,max) {
        /*Simply matches min, to max digits by position.  Should create a
        valid regex when min and max have same num digits and has same 10s
        place digit.*/
    var _min=min.toString(),
        _max=max.toString(),
        pattern='', i;

    for(i=0;i<_min.length;i+=1){
        if(_min[i]==_max[i]){
           pattern+=_min[i];
        }else{
           pattern+='['+_min[i]+'-'+_max[i]+']';
        }
    }
    return pattern;
};


floorDigitN=function(x, increment){
    /* create a function to return a floor to the correct digit position
    e.g., floorDigitN(1336) => 1300 when increment is 100*/
    return parseInt(Math.floor(x/increment)*increment);
};

regExpForRange = function(min, max){
        /*  A recursive function to generate a regular expression that matches
        any number in the range between min and max inclusive.

        Note: doctests are order sensitive, while regular expression engines don't care.  So you may need to rewrite these
        doctests if making changes.
        */
    var _min=min.toString(),
        _max=max.toString(),
        re_middle_range,
        max_big,
        min_big,
        max_small,
        min_small,
        re_small,
        re_big,
        i;

    if(min==max){
        return _max;
    }

    if(_max.length>_min.length){
        /*more digits in max than min, so we pair it down into sub ranges
        that are the same number of digits.  If applicable we also create a pattern to
        cover the cases of values with number of digits in between that of
        max and min.*/
        if(_max.length>_min.length+2){
            // digits more than 2 off, create mid range
            re_middle_range='[0-9]{'+(_min.length+1)+','+(_max.length-1)+'}';
        }else if(_max.length>_min.length+1){
            /*digits more than 1 off, create mid range
            assert _min.length+1==_max.length-1 #temp: remove*/
            re_middle_range='[0-9]{'+(_min.length+1)+'}';
        }
        //pair off into sub ranges
        max_big=max;
        min_big=parseInt('1'+(valueStr('0',_max.length-1)));
        re_big=regExpForRange(min_big, max_big);
        max_small=parseInt(valueStr('9',_min.length));
        min_small=min;
        re_small=regExpForRange(min_small,max_small);
        if(re_middle_range){
            return [re_small,re_middle_range,re_big].join('|');
        }else{
            return [re_small,re_big].join('|');
        }
    } else if(_max.length==_min.length){
        var patterns = [],
            distance,
            increment,
            len_end_to_replace,
            pattern,
            pattern_tmp;
        if(_max.length==1){
            patterns=[naiveRange(min,max)];
        }else{
            /* this is probably the trickiest part so we'll follow the example of
             1336 to 1821 through this section */
            patterns=[];
            distance=(max-min).toString(); //e.g., distance = 1821-1336 = 485
            increment=parseInt('1'+valueStr('0',distance.length-1)); //e.g., 100 when distance is 485
            if(increment==1){
                // it's safe to do a naiveRange see, see def since 10's place is the same for min and max
                patterns=[naiveRange(min,max)];
            }else{
               
                /* capture a safe middle range
                   e.g., create regex patterns to cover range between 1400 to 1800 inclusive
                   so in example we should get: 14[0-9]{2}|15[0-9]{2}|16[0-9]{2}|17[0-9]{2}*/
//                console.log(floorDigitN(max, increment)-increment);
//                console.log(floorDigitN(min, increment));
//                console.log(increment);

                for(i=floorDigitN(max, increment)-increment; i>floorDigitN(min, increment); i-=increment){
                    len_end_to_replace=increment.toString().length-1;
                    pattern_tmp = i.toString();
                    if(len_end_to_replace==1){
                        pattern=pattern_tmp.substring(0,pattern_tmp.length-len_end_to_replace)+'[0-9]';
                    }else{
                        pattern=pattern_tmp.substring(0,pattern_tmp.length-len_end_to_replace)+'[0-9]{'+len_end_to_replace+'}';
                    }
                    patterns.push(pattern);
                }
                /* split off ranges outside of increment digits, i.e., what isn't covered in last step.
                   low side: e.g., 1336 -> min=1336, max=1300+(100-1) = 1399 */
                patterns.push(regExpForRange(min,floorDigitN(min, increment)+(increment-1)));
                // high side: e.g., 1821 -> min=1800 max=1821
                patterns.push(regExpForRange(floorDigitN(max, increment),max))
            }
        }
        return patterns.join('|');
    } else {
        return regExpForRange(max, min);
    }
};
